import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParcelStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { PackageTypeEnum, packageTypeConfigs, type PackageType, PaymentMethodEnum } from '../../constants/enums';
import { generateId } from '../../utils/helpers';
import { formatCurrency } from '../../utils/formatters';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useParcelEstimate, useCreateParcel, useCancelParcel } from '../../hooks/useParcelQuery';
import { usePayment } from '../../hooks/usePayment';

type DetailsNav   = StackNavigationProp<ParcelStackParamList, 'ParcelDetails'>;
type DetailsRoute = RouteProp<ParcelStackParamList, 'ParcelDetails'>;

const WEIGHT_OPTIONS: { label: string; kg: number }[] = [
  { label: '< 1 kg',  kg: 0.5 },
  { label: '1–3 kg',  kg: 2   },
  { label: '3–5 kg',  kg: 4   },
  { label: '5–10 kg', kg: 7.5 },
  { label: '10+ kg',  kg: 15  },
];

const PACKAGE_TYPE_ICONS: Record<string, string> = {
  [PackageTypeEnum.DOCUMENTS]:   'description',
  [PackageTypeEnum.FOOD_ITEMS]:  'fastfood',
  [PackageTypeEnum.ELECTRONICS]: 'devices',
  [PackageTypeEnum.CLOTHING]:    'checkroom',
  [PackageTypeEnum.FRAGILE]:     'warning',
  [PackageTypeEnum.MEDICINE]:    'local-pharmacy',
  [PackageTypeEnum.OTHER]:       'inventory-2',
};

export default function ParcelDetailsScreen() {
  const navigation = useNavigation<DetailsNav>();
  const { params } = useRoute<DetailsRoute>();
  const { colors } = useTheme();
  const { openPayment, isLoading: paymentLoading } = usePayment();
  const { showDialog } = useDialog();

  const [packageType, setPackageType] = useState<PackageType>(
    (params?.selectedType as PackageType) ?? PackageTypeEnum.DOCUMENTS,
  );
  const [weightOpt, setWeightOpt]         = useState(WEIGHT_OPTIONS[0]);
  const [description, setDescription]     = useState('');
  const [receiverName, setReceiverName]   = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [isFragile, setIsFragile]         = useState(
    (params?.selectedType as PackageType) === PackageTypeEnum.FRAGILE,
  );
  const [isExpress, setIsExpress]         = useState(false);
  const [otpVerify, setOtpVerify]         = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'razorpay'>('cash');

  // Auto-enable fragile toggle when user picks the Fragile package type
  useEffect(() => {
    if (packageType === PackageTypeEnum.FRAGILE) setIsFragile(true);
  }, [packageType]);

  const hasCoords = !!(params.pickupLat && params.pickupLng && params.dropLat && params.dropLng);

  const estimateParams = hasCoords
    ? {
        pickupLat: params.pickupLat!,
        pickupLng: params.pickupLng!,
        dropLat:   params.dropLat!,
        dropLng:   params.dropLng!,
        weightKg:  weightOpt.kg,
        isFragile,
        isExpress,
      }
    : null;

  const { data: estimateData } = useParcelEstimate(estimateParams);
  const createParcel = useCreateParcel();
  const cancelParcel = useCancelParcel();

  const vehicleOptions = estimateData?.vehicleOptions ?? [];
  const activeVehicle  = vehicleOptions.find((v) => v.isCompatible) ?? vehicleOptions[0];

  const fareBreakdown = activeVehicle?.fare ?? estimateData?.fareBreakdown;

  const fallbackFare = useMemo(() => {
    const base = 49;
    const wIdx = WEIGHT_OPTIONS.indexOf(weightOpt);
    return base + wIdx * 30 + (isFragile ? 20 : 0) + (isExpress ? 40 : 0);
  }, [weightOpt, isFragile, isExpress]);

  const displayFare = fareBreakdown?.totalFare ?? fallbackFare;

  const canProceed =
    packageType &&
    weightOpt &&
    receiverName.trim().length > 1 &&
    receiverPhone.length === 10;

  const handleProceed = () => {
    if (!canProceed) return;

    if (hasCoords) {
      createParcel.mutate(
        {
          pickupAddress: params.pickupFull || params.pickup,
          dropAddress:   params.dropoffFull || params.dropoff,
          pickupLat:     params.pickupLat!,
          pickupLng:     params.pickupLng!,
          dropLat:       params.dropLat!,
          dropLng:       params.dropLng!,
          packageType,
          weightKg:      weightOpt.kg,
          isFragile,
          isExpress,
          receiverName,
          receiverPhone,
          notes:         description,
          paymentMethod: paymentMethod as any,
          vehicleType:   activeVehicle?.vehicleType,
        },
        {
          onSuccess: (data) => {
            const goToMatching = () =>
              navigation.navigate('ParcelMatching', {
                parcelId:     data.parcelId,
                pickup:       params.pickup,
                dropoff:      params.dropoff,
                fare:         displayFare,
                packageType,
                receiverName,
                receiverPhone,
                pickupLat:    params.pickupLat,
                pickupLng:    params.pickupLng,
                dropLat:      params.dropLat,
                dropLng:      params.dropLng,
              });

            if (paymentMethod === 'razorpay') {
              openPayment({
                entityType:  'parcel',
                entityId:    data.parcelId,
                amount:      displayFare,
                description: `Parcel delivery · ${packageTypeConfigs[packageType]?.label}`,
                onSuccess: () => goToMatching(),
                onFailure: () => {
                  cancelParcel.mutate(data.parcelId);
                  showDialog({
                    title:   'Payment Failed',
                    message: 'Your booking was cancelled. Please try again.',
                    type:    'error',
                  });
                },
              });
            } else {
              goToMatching();
            }
          },
          onError: (err: any) => {
            showDialog({ title: 'Booking Failed', message: err?.response?.data?.message ?? 'Could not create parcel request. Please try again.', type: 'error' });
          },
        },
      );
    } else {
      navigation.navigate('ParcelMatching', {
        parcelId:     generateId(),
        pickup:       params.pickup,
        dropoff:      params.dropoff,
        fare:         displayFare,
        packageType,
        receiverName,
        receiverPhone,
      });
    }
  };

  const packageTypes = Object.entries(packageTypeConfigs);
  const isBusy = createParcel.isPending || paymentLoading || cancelParcel.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Package Details" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {/* ─── Route summary ─────────────────────────────────────────── */}
        <View style={[styles.routeCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <Text style={[Typography.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>{params.pickup}</Text>
          </View>
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
            <Text style={[Typography.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>{params.dropoff}</Text>
          </View>
          {estimateData && (
            <View style={[styles.routeMeta, { backgroundColor: `${Colors.primary}10` }]}>
              <MaterialIcons name="straighten" size={14} color={Colors.primary} />
              <Text style={[Typography.captionBold, { color: Colors.primary, marginLeft: 4 }]}>
                {estimateData.distanceKm.toFixed(1)} km
              </Text>
              <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 8 }]}>
                ~{estimateData.durationMin} min ETA
              </Text>
            </View>
          )}
        </View>

        {/* ─── Package type ───────────────────────────────────────────── */}
        <SectionLabel label="Package type" colors={colors} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScroll}>
          {packageTypes.map(([key, cfg]) => {
            const isSelected = packageType === key;
            const iconName   = PACKAGE_TYPE_ICONS[key] ?? 'inventory-2';
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setPackageType(key as PackageType)}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: isSelected ? `${Colors.primary}15` : colors.card,
                    borderColor:     isSelected ? Colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.typeIconBox, { backgroundColor: isSelected ? `${Colors.primary}20` : `${colors.textMuted}15` }]}>
                  <MaterialIcons name={iconName as any} size={22} color={isSelected ? Colors.primary : colors.textMuted} />
                </View>
                <Text style={[Typography.captionBold, { color: isSelected ? Colors.primary : colors.textSub, marginTop: 8, textAlign: 'center' }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Weight ─────────────────────────────────────────────────── */}
        <SectionLabel label="Approximate weight" colors={colors} />
        <View style={styles.weightRow}>
          {WEIGHT_OPTIONS.map((w) => {
            const isSelected = weightOpt.label === w.label;
            return (
              <TouchableOpacity
                key={w.label}
                onPress={() => setWeightOpt(w)}
                style={[
                  styles.weightBtn,
                  {
                    backgroundColor: isSelected ? Colors.primary : colors.card,
                    borderColor:     isSelected ? Colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[Typography.captionBold, { color: isSelected ? Colors.white : colors.textSub }]}>
                  {w.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Options (fragile / express / OTP) ──────────────────────── */}
        <SectionLabel label="Delivery options" colors={colors} />
        <View style={[styles.optionsCard, { backgroundColor: colors.card }]}>
          {[
            { label: 'Fragile item',     desc: 'Extra care handling',              value: isFragile, toggle: setIsFragile, icon: 'warning',  accent: Colors.warning },
            { label: 'Express delivery', desc: 'Priority pickup & faster delivery', value: isExpress, toggle: setIsExpress, icon: 'bolt',     accent: Colors.primary },
            { label: 'OTP on delivery',  desc: 'Receiver confirms via OTP',        value: otpVerify, toggle: setOtpVerify, icon: 'verified', accent: Colors.success },
          ].map(({ label, desc, value, toggle, icon, accent }) => (
            <TouchableOpacity key={label} onPress={() => toggle(!value)} style={styles.optionRow} activeOpacity={0.8}>
              <View style={[styles.optionIconBox, { backgroundColor: value ? `${accent}15` : `${colors.textMuted}12` }]}>
                <MaterialIcons name={icon as any} size={18} color={value ? accent : colors.textMuted} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.label, { color: colors.text }]}>{label}</Text>
                <Text style={[Typography.caption, { color: colors.textSub }]}>{desc}</Text>
              </View>
              <View style={[styles.toggle, { backgroundColor: value ? accent : colors.border }]}>
                <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 18 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Receiver details ────────────────────────────────────────── */}
        <SectionLabel label="Receiver details" colors={colors} />
        <View style={[styles.inputGroup, { backgroundColor: colors.card }]}>
          <View style={styles.inputRow}>
            <MaterialIcons name="person" size={18} color={colors.textMuted} style={{ marginLeft: Spacing.base }} />
            <TextInput
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Receiver's name"
              placeholderTextColor={colors.textMuted}
              style={[styles.inlineInput, { color: colors.text, borderBottomColor: colors.border }]}
            />
          </View>
          <View style={styles.inputRow}>
            <MaterialIcons name="phone" size={18} color={colors.textMuted} style={{ marginLeft: Spacing.base }} />
            <TextInput
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              placeholder="10-digit phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              style={[styles.inlineInput, { color: colors.text }]}
            />
          </View>
        </View>

        {/* ─── Package description ─────────────────────────────────────── */}
        <SectionLabel label="Package description" colors={colors} />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Briefly describe what you're sending"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={2}
          style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        />

        {/* ─── Payment method ──────────────────────────────────────────── */}
        <SectionLabel label="Payment method" colors={colors} />
        <View style={[styles.optionsCard, { backgroundColor: colors.card }]}>
          {[
            { key: 'razorpay' as const, label: 'Razorpay', desc: 'Cards, UPI, Netbanking & more', icon: 'credit-card' },
            { key: 'cash'     as const, label: 'Cash',     desc: 'Pay rider on pickup',            icon: 'payments'    },
          ].map((opt) => {
            const isSelected = paymentMethod === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setPaymentMethod(opt.key)}
                style={[styles.optionRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconBox, { backgroundColor: isSelected ? `${Colors.primary}15` : `${colors.textMuted}12` }]}>
                  <MaterialIcons name={opt.icon as any} size={18} color={isSelected ? Colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.label, { color: isSelected ? Colors.primary : colors.text }]}>{opt.label}</Text>
                  <Text style={[Typography.caption, { color: colors.textSub }]}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, { borderColor: isSelected ? Colors.primary : colors.border }]}>
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: Colors.primary }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Fare breakdown ──────────────────────────────────────────── */}
        <SectionLabel label="Fare breakdown" colors={colors} />
        {fareBreakdown ? (
          <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
            {[
              { label: 'Base fare',                                              value: fareBreakdown.baseFare      },
              { label: `Distance (${fareBreakdown.distanceKm.toFixed(1)} km)`,  value: fareBreakdown.distanceFare  },
              ...(fareBreakdown.weightSurcharge > 0  ? [{ label: 'Weight surcharge', value: fareBreakdown.weightSurcharge  }] : []),
              ...(fareBreakdown.fragileSurcharge > 0 ? [{ label: 'Fragile handling', value: fareBreakdown.fragileSurcharge }] : []),
              ...(fareBreakdown.peakUpcharge > 0     ? [{ label: 'Peak-time charge', value: fareBreakdown.peakUpcharge    }] : []),
              ...(fareBreakdown.expressUpcharge > 0  ? [{ label: 'Express upcharge', value: fareBreakdown.expressUpcharge  }] : []),
              ...(fareBreakdown.platformFee > 0      ? [{ label: 'Platform fee',     value: fareBreakdown.platformFee     }] : []),
              ...(fareBreakdown.gst > 0              ? [{ label: 'GST (18%)',        value: fareBreakdown.gst             }] : []),
            ].map(({ label, value }) => (
              <View key={label} style={styles.breakdownRow}>
                <Text style={[Typography.body, { color: colors.textSub }]}>{label}</Text>
                <Text style={[Typography.body, { color: colors.text }]}>{formatCurrency(value)}</Text>
              </View>
            ))}
            {fareBreakdown.memberDiscountAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[Typography.body, { color: Colors.success }]}>Member discount</Text>
                <Text style={[Typography.body, { color: Colors.success }]}>
                  -{formatCurrency(fareBreakdown.memberDiscountAmount)}
                </Text>
              </View>
            )}
            <View style={[styles.breakdownDivider, { borderColor: colors.border }]} />
            <View style={styles.breakdownRow}>
              <Text style={[Typography.label, { color: colors.text }]}>Total</Text>
              <Text style={[Typography.h4, { color: Colors.primary }]}>{formatCurrency(fareBreakdown.totalFare)}</Text>
            </View>
            {fareBreakdown.minimumFareApplied && (
              <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>Minimum fare applied</Text>
            )}
            <View style={[styles.etaBadge, { backgroundColor: `${Colors.primary}10` }]}>
              <MaterialIcons name="access-time" size={14} color={Colors.primary} />
              <Text style={[Typography.captionBold, { color: Colors.primary, marginLeft: 4 }]}>
                ~{fareBreakdown.etaMin} min  ·  {fareBreakdown.distanceKm.toFixed(1)} km
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.fareCard, { backgroundColor: `${Colors.primary}10` }]}>
            <View>
              <Text style={[Typography.body, { color: colors.textSub }]}>Estimated fare</Text>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>Final fare may vary</Text>
            </View>
            <Text style={[Typography.h3, { color: Colors.primary }]}>{formatCurrency(displayFare)}</Text>
          </View>
        )}
      </ScrollView>

      {canProceed && (
        <View style={[styles.footer, { backgroundColor: colors.surface }, Shadows.lg]}>
          <View style={styles.footerRow}>
            <View>
              <Text style={[Typography.caption, { color: colors.textMuted }]}>Total payable</Text>
              <Text style={[Typography.h4, { color: Colors.primary }]}>{formatCurrency(displayFare)}</Text>
            </View>
            <Button
              label={isBusy ? 'Processing…' : paymentMethod === 'razorpay' ? 'Pay & Book Rider' : 'Book Rider'}
              onPress={handleProceed}
              isDisabled={isBusy}
              isLoading={isBusy}
              style={{ flex: 1, marginLeft: 16 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[Typography.label, {
      color: colors.textSub,
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.lg,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontSize: 11,
    }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },

  // Route summary
  routeCard:       { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base },
  routeRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot:        { width: 10, height: 10, borderRadius: 5 },
  routeLine:       { width: 2, height: 16, marginLeft: 4, marginVertical: 4 },
  routeMeta:       { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.md, alignSelf: 'flex-start' },

  // Package type cards (horizontal scroll)
  typeScroll:      { paddingHorizontal: Spacing.xl, paddingBottom: 4, gap: 10 },
  typeCard:        { width: 90, borderRadius: BorderRadius.lg, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  typeIconBox:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // Weight
  weightRow:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: 8 },
  weightBtn:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1.5 },

  // Options
  optionsCard:     { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  optionRow:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  optionIconBox:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  toggle:          { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleThumb:     { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white },

  // Receiver / Description
  inputGroup:      { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  inlineInput:     { flex: 1, paddingHorizontal: Spacing.sm, paddingVertical: 14, borderBottomWidth: 1 },
  textArea:        { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.sm, height: 72, textAlignVertical: 'top' },

  // Fare
  breakdownCard:   { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, padding: Spacing.base },
  breakdownRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  breakdownDivider:{ borderTopWidth: 1, marginVertical: 8 },
  etaBadge:        { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.md, alignSelf: 'flex-start' },
  fareCard:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.xl, padding: Spacing.base, borderRadius: BorderRadius.xl },

  // Payment picker
  radio:           { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot:        { width: 10, height: 10, borderRadius: 5 },

  // Footer
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.base, paddingBottom: 30, paddingHorizontal: Spacing.xl },
  footerRow:       { flexDirection: 'row', alignItems: 'center' },
});

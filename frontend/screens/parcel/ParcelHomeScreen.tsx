import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParcelStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { PackageTypeEnum, packageTypeConfigs, parcelStatusConfigs, ParcelStatusEnum, type ParcelStatus } from '../../constants/enums';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useActiveBookings } from '../../hooks/useActiveBookings';

type ParcelNav = StackNavigationProp<ParcelStackParamList, 'ParcelHome'>;

const PACKAGE_TYPE_ICONS: Record<string, string> = {
  [PackageTypeEnum.DOCUMENTS]:   'description',
  [PackageTypeEnum.FOOD_ITEMS]:  'fastfood',
  [PackageTypeEnum.ELECTRONICS]: 'devices',
  [PackageTypeEnum.CLOTHING]:    'checkroom',
  [PackageTypeEnum.FRAGILE]:     'warning',
  [PackageTypeEnum.MEDICINE]:    'local-pharmacy',
  [PackageTypeEnum.OTHER]:       'inventory-2',
};

const PACKAGE_TYPES = [
  { key: PackageTypeEnum.DOCUMENTS,   label: 'Documents',   desc: 'Files, papers' },
  { key: PackageTypeEnum.ELECTRONICS, label: 'Electronics', desc: 'Phones, laptops' },
  { key: PackageTypeEnum.CLOTHING,    label: 'Clothing',    desc: 'Garments, shoes' },
  { key: PackageTypeEnum.FOOD_ITEMS,  label: 'Food',        desc: 'Tiffin, snacks' },
  { key: PackageTypeEnum.MEDICINE,    label: 'Medicine',    desc: 'Medicines, health' },
  { key: PackageTypeEnum.FRAGILE,     label: 'Fragile',     desc: 'Glass, ceramics' },
  { key: PackageTypeEnum.OTHER,       label: 'Other',       desc: 'Anything else' },
];

function AnimatedRow({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  React.useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    y.value = withDelay(delay, withTiming(0, { duration: 400 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function ParcelHomeScreen() {
  const navigation = useNavigation<ParcelNav>();
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { activeParcel } = useActiveBookings();

  const resumeParcel = () => {
    if (!activeParcel) return;
    const parcelId = activeParcel.parcelId ?? activeParcel._id ?? '';

    const isMatchingPhase = activeParcel.status === ParcelStatusEnum.SEARCHING_RIDER
      || activeParcel.status === ParcelStatusEnum.RIDER_ASSIGNED;

    if (isMatchingPhase) {
      navigation.navigate('ParcelMatching', {
        parcelId,
        pickup:       activeParcel.pickupAddress ?? '',
        dropoff:      activeParcel.dropAddress   ?? '',
        fare:         activeParcel.fare          ?? 0,
        packageType:  activeParcel.packageType   ?? '',
        receiverName: activeParcel.receiverName  ?? '',
        receiverPhone:activeParcel.receiverPhone ?? '',
        pickupLat:    activeParcel.pickupLat,
        pickupLng:    activeParcel.pickupLng,
        dropLat:      activeParcel.dropLat,
        dropLng:      activeParcel.dropLng,
      });
    } else {
      navigation.navigate('ParcelTracking', {
        parcelId,
        pickup:      activeParcel.pickupAddress ?? '',
        dropoff:     activeParcel.dropAddress   ?? '',
        pickupLat:   activeParcel.pickupLat,
        pickupLng:   activeParcel.pickupLng,
        dropLat:     activeParcel.dropLat,
        dropLng:     activeParcel.dropLng,
        packageType: activeParcel.packageType,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Send a Parcel" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <AnimatedRow delay={0}>
          <LinearGradient colors={Colors.gradientParcel as [string, string]} style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.h3, { color: Colors.white }]}>Fast delivery 📦</Text>
              <Text style={[Typography.body, { color: 'rgba(255,255,255,0.85)', marginTop: 4 }]}>
                Send anything across Mumbai in 60 min
              </Text>
              <View style={styles.featureRow}>
                {['Tracked', 'Insured', '24/7'].map((f) => (
                  <View key={f} style={styles.featureChip}>
                    <MaterialIcons name="check-circle" size={12} color={Colors.white} />
                    <Text style={[Typography.captionBold, { color: Colors.white, marginLeft: 4 }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={{ fontSize: 64 }}>🛵</Text>
          </LinearGradient>
        </AnimatedRow>

        {/* CTA / active parcel block */}
        <AnimatedRow delay={80}>
          {activeParcel ? (
            <View style={[styles.activeCard, { backgroundColor: `${Colors.accent}10`, borderColor: `${Colors.accent}30` }]}>
              <View style={styles.activeCardRow}>
                <Text style={{ fontSize: 28 }}>
                  {parcelStatusConfigs[activeParcel.status as ParcelStatus]?.emoji ?? '📦'}
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.label, { color: Colors.accent }]}>Active Delivery</Text>
                  <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>
                    {parcelStatusConfigs[activeParcel.status as ParcelStatus]?.alias ?? activeParcel.status}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.resumeBtn, { backgroundColor: Colors.accent }]}
                  onPress={resumeParcel}
                >
                  <Text style={[Typography.captionBold, { color: Colors.white }]}>Track →</Text>
                </TouchableOpacity>
              </View>
              <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 10 }]}>
                Complete or cancel this delivery to send a new parcel.
              </Text>
            </View>
          ) : (
            <View style={[styles.ctaCard, { backgroundColor: colors.card }]}>
              <Text style={[Typography.h4, { color: colors.text, marginBottom: 4 }]}>Send a parcel</Text>
              <Text style={[Typography.body, { color: colors.textSub, marginBottom: 16 }]}>
                Enter pickup and drop locations to get started
              </Text>
              <Button
                label="Book Now"
                onPress={() => navigation.navigate('ParcelLocation', { selectedType: selectedType ?? undefined })}
              />
            </View>
          )}
        </AnimatedRow>

        {/* Package types — hidden when a parcel is active */}
        {!activeParcel && (
          <AnimatedRow delay={160}>
            <Text style={[Typography.label, { color: colors.text, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: 12 }]}>
              What are you sending?
            </Text>
            <FlatList
              data={PACKAGE_TYPES}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeList}
              keyExtractor={(i) => i.key}
              renderItem={({ item }) => {
                const isSelected = selectedType === item.key;
                const iconName = PACKAGE_TYPE_ICONS[item.key] ?? 'inventory-2';
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedType(item.key);
                      setTimeout(() => navigation.navigate('ParcelLocation', { selectedType: item.key }), 150);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isSelected ? `${Colors.primary}15` : colors.card,
                        borderColor: isSelected ? Colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.typeIconBox, { backgroundColor: isSelected ? `${Colors.primary}20` : `${colors.textMuted}15` }]}>
                      <MaterialIcons name={iconName as any} size={22} color={isSelected ? Colors.primary : colors.textMuted} />
                    </View>
                    <Text style={[Typography.captionBold, { color: isSelected ? Colors.primary : colors.textSub, marginTop: 8, textAlign: 'center' }]}>
                      {item.label}
                    </Text>
                    <Text style={[Typography.caption, { color: isSelected ? Colors.primary : colors.textMuted, textAlign: 'center' }]}>
                      {item.desc}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </AnimatedRow>
        )}

        {/* Features */}
        <AnimatedRow delay={240}>
          <Text style={[Typography.label, { color: colors.text, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: 12 }]}>
            Why SwibberParcel?
          </Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: 'speed', label: '60-min delivery', desc: 'Same-day express', color: Colors.primary },
              { icon: 'verified-user', label: 'Insured parcels', desc: 'Up to ₹5000 coverage', color: Colors.success },
              { icon: 'gps-fixed', label: 'Live tracking', desc: 'Real-time updates', color: Colors.accent },
              { icon: 'support-agent', label: '24/7 support', desc: 'Always here for you', color: Colors.warning },
            ].map((f) => (
              <View key={f.label} style={[styles.featureBox, { backgroundColor: colors.card }]}>
                <View style={[styles.featureIcon, { backgroundColor: `${f.color}15` }]}>
                  <MaterialIcons name={f.icon as any} size={22} color={f.color} />
                </View>
                <Text style={[Typography.captionBold, { color: colors.text, marginTop: 8 }]}>{f.label}</Text>
                <Text style={[Typography.caption, { color: colors.textSub }]}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </AnimatedRow>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center' },
  featureRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  featureChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  ctaCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.xl },
  typeList: { paddingHorizontal: Spacing.xl, gap: 10, paddingBottom: 4 },
  typeCard: { width: 90, padding: 12, borderRadius: BorderRadius.lg, borderWidth: 1.5, alignItems: 'center' },
  typeIconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: 12 },
  featureBox:    { width: '46%', borderRadius: BorderRadius.xl, padding: Spacing.base },
  featureIcon:   { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  activeCard:    { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, borderWidth: 1.5, padding: Spacing.base },
  activeCardRow: { flexDirection: 'row', alignItems: 'center' },
  resumeBtn:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.lg },
});

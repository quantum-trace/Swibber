import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import {
  vehicleConfigs,
  parcelStatusConfigs,
  packageTypeConfigs,
  type ParcelStatus,
  type VehicleType,
  type PackageType,
} from '../../constants/enums';

export interface ParcelTrackingCardProps {
  parcelId: string;
  status: ParcelStatus;
  etaMin?: number | null;
  distanceKm?: number | null;
  riderName?: string;
  riderPhone?: string;
  riderRating?: number;
  vehicleType?: VehicleType | string;
  vehicleNumber?: string;
  packageType?: PackageType | string;
  weightKg?: number;
  onContactPress?: () => void;
  onChatPress?: () => void;
  onCancelPress?: () => void;
}

function ParcelTrackingCard({
  parcelId,
  status,
  etaMin,
  distanceKm,
  riderName,
  riderPhone,
  riderRating,
  vehicleType,
  vehicleNumber,
  packageType,
  weightKg,
  onContactPress,
  onChatPress,
  onCancelPress,
}: ParcelTrackingCardProps) {
  const { colors }     = useTheme();
  const { showDialog } = useDialog();

  const statusCfg  = parcelStatusConfigs[status];
  const vehicleCfg = vehicleType ? vehicleConfigs[vehicleType as VehicleType] : null;
  const packageCfg = packageType ? packageTypeConfigs[packageType as PackageType] : null;

  const handleCall = () => {
    if (riderPhone) {
      Linking.openURL(`tel:${riderPhone}`).catch(() =>
        showDialog({ title: 'Error', message: 'Unable to make a call.', type: 'error' }),
      );
    } else {
      onContactPress?.();
    }
  };

  const etaLabel = etaMin != null
    ? etaMin <= 1 ? 'Arriving now' : `${etaMin} min`
    : '--';

  const distLabel = distanceKm != null
    ? distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(1)} km`
    : '--';

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, Shadows.lg]}>
      {/* Status row */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
        <Text style={[Typography.labelLarge, { color: statusCfg.color, flex: 1 }]}>
          {statusCfg.alias}
        </Text>
        {parcelId && (
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            #{parcelId.slice(-8).toUpperCase()}
          </Text>
        )}
      </View>

      {/* ETA + Distance row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialIcons name="access-time" size={16} color={Colors.primary} />
          <Text style={[Typography.labelLarge, { color: colors.text, marginLeft: 4 }]}>
            {etaLabel}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 2 }]}>ETA</Text>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metaItem}>
          <MaterialIcons name="near-me" size={16} color={Colors.primary} />
          <Text style={[Typography.labelLarge, { color: colors.text, marginLeft: 4 }]}>
            {distLabel}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 2 }]}>Away</Text>
        </View>
        {packageCfg && (
          <>
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 16 }}>{packageCfg.emoji}</Text>
              <Text style={[Typography.caption, { color: colors.textSub, marginLeft: 4 }]}>
                {packageCfg.alias}{weightKg ? ` · ${weightKg} kg` : ''}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Rider info */}
      {riderName ? (
        <View style={styles.riderRow}>
          <View style={[styles.riderAvatar, { backgroundColor: Colors.primary + '20' }]}>
            <MaterialIcons name="person" size={22} color={Colors.primary} />
          </View>
          <View style={styles.riderDetails}>
            <Text style={[Typography.label, { color: colors.text }]}>{riderName}</Text>
            <View style={styles.riderMeta}>
              {vehicleCfg && (
                <Text style={[Typography.caption, { color: colors.textSub }]}>
                  {vehicleCfg.alias}
                </Text>
              )}
              {vehicleNumber && (
                <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 6 }]}>
                  {vehicleNumber}
                </Text>
              )}
              {riderRating != null && (
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={11} color="#FFD700" />
                  <Text style={[Typography.caption, { color: colors.text, marginLeft: 2 }]}>
                    {riderRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.riderRow}>
          <View style={[styles.riderAvatar, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="two-wheeler" size={22} color={colors.textMuted} />
          </View>
          <Text style={[Typography.body, { color: colors.textSub }]}>
            Assigning a rider...
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}
          onPress={handleCall}
        >
          <MaterialIcons name="phone" size={18} color={Colors.primary} />
          <Text style={[Typography.captionBold, { color: Colors.primary, marginLeft: 6 }]}>
            Call
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onChatPress}
        >
          <MaterialIcons name="chat-bubble-outline" size={18} color={colors.text} />
          <Text style={[Typography.captionBold, { color: colors.text, marginLeft: 6 }]}>
            Chat
          </Text>
        </TouchableOpacity>

        {onCancelPress && statusCfg.step < 3 && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.error + '15', borderColor: Colors.error + '40' }]}
            onPress={onCancelPress}
          >
            <MaterialIcons name="cancel" size={18} color={Colors.error} />
            <Text style={[Typography.captionBold, { color: Colors.error, marginLeft: 6 }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default memo(ParcelTrackingCard);

const styles = StyleSheet.create({
  card: {
    borderTopLeftRadius:  BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop:           Spacing.base,
    paddingHorizontal:    Spacing.xl,
    paddingBottom:        Spacing.xl + 8,
  },
  statusRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   Spacing.sm,
  },
  statusDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    marginRight:  8,
  },
  metaRow: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: Colors.primary + '08',
    borderRadius:   BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
    marginBottom:   Spacing.base,
    gap:            0,
  },
  metaItem: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
  metaDivider: {
    width:  1,
    height: 24,
    marginHorizontal: 4,
  },
  divider: {
    height:        1,
    marginBottom:  Spacing.base,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.base,
    gap:           Spacing.base,
  },
  riderAvatar: {
    width:        44,
    height:       44,
    borderRadius: 22,
    alignItems:   'center',
    justifyContent: 'center',
  },
  riderDetails: {
    flex: 1,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     2,
    flexWrap:      'wrap',
    gap:           4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems:    'center',
    marginLeft:    6,
  },
  actions: {
    flexDirection: 'row',
    gap:           8,
  },
  actionBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius:   BorderRadius.md,
    borderWidth:    1,
  },
});

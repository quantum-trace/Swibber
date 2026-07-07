import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { rideStatusConfigs, type RideStatus, RideStatusEnum } from '../../constants/enums';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import type { ETAUpdate } from '../../hooks/useRideTracking';

interface RideStatusCardProps {
  status: RideStatus;
  etaUpdate?: ETAUpdate | null;
  driverName?: string;
  onCancel?: () => void;
  colors: {
    surface: string; card: string; text: string; textSub: string;
    textMuted: string; border: string;
  };
}

const ACTIVE_STATUSES: RideStatus[] = [
  RideStatusEnum.SEARCHING,
  RideStatusEnum.DRIVER_ASSIGNED,
  RideStatusEnum.DRIVER_ARRIVING,
  RideStatusEnum.DRIVER_ARRIVED,
  RideStatusEnum.IN_PROGRESS,
];

const CANCELLABLE_STATUSES: RideStatus[] = [
  RideStatusEnum.SEARCHING,
  RideStatusEnum.DRIVER_ASSIGNED,
  RideStatusEnum.DRIVER_ARRIVING,
];

export const RideStatusCard = React.memo(function RideStatusCard({
  status,
  etaUpdate,
  driverName,
  onCancel,
  colors,
}: RideStatusCardProps) {
  const config = rideStatusConfigs[status];
  if (!config) return null;

  const isCancellable = CANCELLABLE_STATUSES.includes(status);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: `${config.color}20` }]}>
          <MaterialIcons name={config.icon as any} size={22} color={config.color} />
        </View>

        <View style={styles.info}>
          <Text style={[Typography.label, { color: colors.text }]}>{config.alias}</Text>
          {driverName && status !== RideStatusEnum.SEARCHING && (
            <Text style={[Typography.caption, { color: colors.textSub }]}>{driverName}</Text>
          )}
          {status === RideStatusEnum.SEARCHING && (
            <Text style={[Typography.caption, { color: colors.textMuted }]}>Looking for nearby drivers…</Text>
          )}
        </View>

        {etaUpdate && status !== RideStatusEnum.COMPLETED && status !== RideStatusEnum.CANCELLED && (
          <View style={styles.etaBadge}>
            <Text style={[Typography.h4, { color: Colors.primary }]}>{etaUpdate.etaMin}</Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>min</Text>
          </View>
        )}
      </View>

      {ACTIVE_STATUSES.includes(status) && (
        <View style={styles.progressRow}>
          {ACTIVE_STATUSES.map((s, i) => {
            const activeIdx = ACTIVE_STATUSES.indexOf(status);
            const isPast    = i < activeIdx;
            const isCurrent = i === activeIdx;
            return (
              <React.Fragment key={s}>
                <View style={[
                  styles.progressDot,
                  { backgroundColor: isPast || isCurrent ? config.color : colors.border },
                  isCurrent && styles.progressDotActive,
                ]} />
                {i < ACTIVE_STATUSES.length - 1 && (
                  <View style={[
                    styles.progressLine,
                    { backgroundColor: isPast ? config.color : colors.border },
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {isCancellable && onCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={[Typography.label, { color: Colors.error }]}>Cancel Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container:        { padding: Spacing.base, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  row:              { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:          { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info:             { flex: 1 },
  etaBadge:         { alignItems: 'center', minWidth: 44 },
  progressRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },
  progressDot:      { width: 10, height: 10, borderRadius: 5 },
  progressDotActive:{ width: 13, height: 13, borderRadius: 7 },
  progressLine:     { flex: 1, height: 2, marginHorizontal: 2 },
  cancelBtn:        { marginTop: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 24 },
});

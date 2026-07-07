import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { usePressScale } from '../../animations/scaleAnimation';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import type { VehicleConfig, SurgeLevelConfig } from '../../constants/enums';

interface VehicleCardProps {
  config: VehicleConfig;
  fare: number;
  eta: number;
  surgeConfig: SurgeLevelConfig;
  isSelected: boolean;
  onPress: () => void;
}

export default function VehicleCard({ config, fare, eta, surgeConfig, isSelected, onPress }: VehicleCardProps) {
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? `${Colors.primary}15` : colors.card,
            borderColor: isSelected ? Colors.primary : colors.border,
          },
          animatedStyle,
        ]}
      >
        {/* Vehicle icon + info */}
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: isSelected ? `${Colors.primary}20` : `${colors.border}60` }]}>
            <Text style={{ fontSize: 28 }}>{config.emoji}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.nameRow}>
              <Text style={[Typography.h4, { color: colors.text }]}>{config.alias}</Text>
              {surgeConfig.key !== 'none' && (
                <View style={[styles.surgeBadge, { backgroundColor: surgeConfig.color }]}>
                  <Text style={styles.surgeText}>{surgeConfig.label}</Text>
                </View>
              )}
            </View>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {config.capacity} {config.capacity === 1 ? 'passenger' : 'passengers'} • {config.description}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
              <MaterialIcons name="access-time" size={12} color={colors.textMuted} />
              <Text style={[Typography.caption, { color: colors.textMuted }]}>{eta} min away</Text>
            </View>
          </View>
        </View>

        {/* Fare */}
        <View style={styles.right}>
          <Text style={[Typography.h4, { color: colors.text }]}>{formatCurrency(fare)}</Text>
          {surgeConfig.key !== 'none' && (
            <Text style={[Typography.captionBold, { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
              {formatCurrency(Math.round(fare / surgeConfig.multiplier))}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.checkmark}>
            <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: BorderRadius.lg, borderWidth: 1.5, padding: Spacing.base, marginBottom: 10 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  surgeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  surgeText: { ...Typography.captionBold, color: Colors.white, fontSize: 9 },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  checkmark: { position: 'absolute', top: 8, right: 8 },
});

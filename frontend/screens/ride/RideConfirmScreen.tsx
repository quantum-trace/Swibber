import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing } from '../../theme';
import { generateId } from '../../utils/helpers';
import { formatCurrency } from '../../utils/formatters';
import { vehicleConfigs } from '../../constants/enums';
import Header from '../../components/common/Header';

type ConfirmNav = StackNavigationProp<RideStackParamList, 'RideConfirm'>;
type ConfirmRoute = RouteProp<RideStackParamList, 'RideConfirm'>;

export default function RideConfirmScreen() {
  const navigation = useNavigation<ConfirmNav>();
  const { params } = useRoute<ConfirmRoute>();
  const { colors } = useTheme();

  const ring1 = useSharedValue(0.4);
  const ring2 = useSharedValue(0.4);
  const ring3 = useSharedValue(0.4);
  const carScale = useSharedValue(1);

  useEffect(() => {
    const cfg = { duration: 1800, easing: Easing.out(Easing.cubic) };
    ring1.value = withRepeat(withTiming(1.5, cfg), -1, false);
    ring2.value = withRepeat(withSequence(withTiming(0.4, { duration: 0 }), withTiming(1.5, { ...cfg, duration: 1800 })), -1, false);
    ring3.value = withRepeat(withSequence(withTiming(0.4, { duration: 0 }), withTiming(1.5, { ...cfg, duration: 1800 })), -1, false);
    carScale.value = withRepeat(withSequence(withTiming(1.05, { duration: 600 }), withTiming(0.95, { duration: 600 })), -1, true);

    // Navigate to matching after 3s
    const t = setTimeout(() => {
      navigation.replace('DriverMatching', { rideId: generateId() });
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  const r1Style = useAnimatedStyle(() => ({ transform: [{ scale: ring1.value }], opacity: 1 - (ring1.value - 0.4) / 1.1 }));
  const r2Style = useAnimatedStyle(() => ({ transform: [{ scale: ring2.value }], opacity: 1 - (ring2.value - 0.4) / 1.1 }));
  const r3Style = useAnimatedStyle(() => ({ transform: [{ scale: ring3.value }], opacity: 1 - (ring3.value - 0.4) / 1.1 }));
  const carStyle = useAnimatedStyle(() => ({ transform: [{ scale: carScale.value }] }));

  const vehicleConfig = vehicleConfigs[params.vehicleType as keyof typeof vehicleConfigs];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Finding Driver" />

      <View style={styles.content}>
        <View style={styles.animContainer}>
          <Animated.View style={[styles.ring, { borderColor: `${Colors.primary}30` }, r1Style]} />
          <Animated.View style={[styles.ring, { borderColor: `${Colors.primary}20` }, r2Style]} />
          <Animated.View style={[styles.ring, { borderColor: `${Colors.accent}15` }, r3Style]} />
          <Animated.View style={[styles.carBox, carStyle]}>
            <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.carGradient}>
              <Text style={{ fontSize: 40 }}>{vehicleConfig?.emoji ?? '🚗'}</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={[Typography.h2, { color: colors.text, marginTop: 32, textAlign: 'center' }]}>
          Finding your {vehicleConfig?.alias}...
        </Text>
        <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginTop: 8 }]}>
          Matching you with the best nearby driver
        </Text>

        <View style={[styles.fareCard, { backgroundColor: colors.card }]}>
          <View style={styles.fareRow}>
            <Text style={[Typography.body, { color: colors.textSub }]}>Estimated fare</Text>
            <Text style={[Typography.h3, { color: colors.text }]}>{formatCurrency(params.fare)}</Text>
          </View>
          <View style={[styles.fareRow, { marginTop: 8 }]}>
            <Text style={[Typography.body, { color: colors.textSub }]}>Route</Text>
            <Text style={[Typography.label, { color: colors.text, maxWidth: 180, textAlign: 'right' }]} numberOfLines={2}>
              {params.pickup} → {params.destination}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  animContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5 },
  carBox: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  carGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fareCard: { width: '100%', borderRadius: 16, padding: Spacing.base, marginTop: 32 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

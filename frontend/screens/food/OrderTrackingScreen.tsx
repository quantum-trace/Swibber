import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FoodStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Header from '../../components/common/Header';

type TrackNav = StackNavigationProp<FoodStackParamList, 'OrderTracking'>;
type TrackRoute = RouteProp<FoodStackParamList, 'OrderTracking'>;

const STEPS = [
  { key: 'placed', label: 'Order placed', icon: 'receipt', desc: 'We received your order' },
  { key: 'confirmed', label: 'Restaurant confirmed', icon: 'restaurant', desc: 'Kitchen is preparing your food' },
  { key: 'preparing', label: 'Being prepared', icon: 'outdoor-grill', desc: 'Your food is being cooked' },
  { key: 'picked', label: 'Out for delivery', icon: 'delivery-dining', desc: 'Rider is on the way' },
  { key: 'delivered', label: 'Delivered', icon: 'check-circle', desc: 'Enjoy your meal!' },
];

export default function OrderTrackingScreen() {
  const navigation = useNavigation<TrackNav>();
  const { params } = useRoute<TrackRoute>();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.15, { duration: 700 }), withTiming(1, { duration: 700 })), -1, true);

    const intervals = [2000, 5000, 10000, 16000];
    const timers = intervals.map((delay, i) =>
      setTimeout(() => {
        setCurrentStep(i + 1);
        if (i === 3) setTimeout(() => navigation.replace('OrderComplete', { orderId: params.orderId }), 1500);
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const etaMinutes = Math.max(2, 30 - currentStep * 6);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack={false} title="Order Tracking" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ETA hero */}
        <LinearGradient colors={Colors.gradientFood as [string, string]} style={styles.etaHero}>
          <Animated.View style={pulseStyle}>
            <Text style={{ fontSize: 52 }}>{currentStep >= 3 ? '🚴' : currentStep >= 2 ? '👨‍🍳' : '🍽️'}</Text>
          </Animated.View>
          <Text style={[Typography.h3, { color: Colors.white, marginTop: 12 }]}>
            {currentStep >= 4 ? 'Delivered!' : `${etaMinutes} min away`}
          </Text>
          <Text style={[Typography.body, { color: 'rgba(255,255,255,0.8)', marginTop: 4 }]}>
            {STEPS[currentStep]?.label ?? 'Delivered'}
          </Text>
        </LinearGradient>

        {/* Order ID */}
        <View style={[styles.orderIdRow, { backgroundColor: colors.card }]}>
          <MaterialIcons name="receipt" size={16} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textSub, marginLeft: 6 }]}>
            Order #{params.orderId.slice(-8).toUpperCase()}
          </Text>
          <TouchableOpacity style={styles.helpBtn}>
            <Text style={[Typography.captionBold, { color: Colors.primary }]}>Need help?</Text>
          </TouchableOpacity>
        </View>

        {/* Tracking steps */}
        <View style={[styles.stepsCard, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 16 }]}>Order status</Text>
          {STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIcon, {
                    backgroundColor: isDone || isActive ? Colors.primary : colors.background,
                    borderColor: isDone || isActive ? Colors.primary : colors.border,
                  }]}>
                    <MaterialIcons
                      name={isDone ? 'check' : step.icon as any}
                      size={14}
                      color={isDone || isActive ? Colors.white : colors.textMuted}
                    />
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: isDone ? Colors.primary : colors.border }]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[Typography.label, { color: isDone || isActive ? colors.text : colors.textMuted }]}>
                    {step.label}
                  </Text>
                  {(isDone || isActive) && (
                    <Text style={[Typography.caption, { color: colors.textSub }]}>{step.desc}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Rider info */}
        {currentStep >= 3 && (
          <View style={[styles.riderCard, { backgroundColor: colors.card }]}>
            <View style={styles.riderInfo}>
              <View style={[styles.riderAvatar, { backgroundColor: `${Colors.primary}20` }]}>
                <Text style={{ fontSize: 24 }}>🚴</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[Typography.label, { color: colors.text }]}>Suresh Kumar</Text>
                <Text style={[Typography.caption, { color: colors.textSub }]}>Your delivery partner</Text>
              </View>
            </View>
            <View style={styles.riderActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${Colors.success}15` }]}>
                <MaterialIcons name="call" size={20} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${Colors.primary}15` }]}>
                <MaterialIcons name="chat" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  etaHero: { margin: Spacing.xl, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center' },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.base, padding: Spacing.base, borderRadius: BorderRadius.md },
  helpBtn: { marginLeft: 'auto' },
  stepsCard: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.base },
  stepRow: { flexDirection: 'row', marginBottom: 4 },
  stepLeft: { alignItems: 'center', width: 30 },
  stepIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 2, flex: 1, minHeight: 20, marginVertical: 3 },
  stepContent: { flex: 1, paddingLeft: 10, paddingBottom: 16 },
  riderCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, padding: Spacing.base },
  riderInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  riderActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});

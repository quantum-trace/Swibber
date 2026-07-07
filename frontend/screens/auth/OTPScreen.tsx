import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing } from '../../theme';
import { Config } from '../../constants/config';
import Button from '../../components/common/Button';
import OTPInput from '../../components/common/OTPInput';
import Header from '../../components/common/Header';

type OTPNav = StackNavigationProp<AuthStackParamList, 'OTPVerify'>;
type OTPRoute = RouteProp<AuthStackParamList, 'OTPVerify'>;

export default function OTPScreen() {
  const navigation = useNavigation<OTPNav>();
  const { params } = useRoute<OTPRoute>();
  const auth = useAuthContext();
  const { colors } = useTheme();

  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [timer, setTimer] = useState<number>(Config.OTP_RESEND_TIMER);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const checkmarkScale = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(20);

  useEffect(() => {
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    contentY.value = withDelay(100, withSpring(0, { damping: 16 }));
  }, []);

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-8, { duration: 55 }),
      withTiming(8, { duration: 55 }),
      withTiming(0, { duration: 55 }),
    );
  };

  const handleVerify = useCallback(async () => {
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setError('');
    setIsLoading(true);

    try {
      await auth.verifyPhoneOTP(otp, name || undefined);
      setIsSuccess(true);
      checkmarkScale.value = withSpring(1, { damping: 8, stiffness: 180 });
      // Navigation handled by auth state change in AppNavigator
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string };
      triggerShake();
      if (err?.code?.includes('invalid-verification-code') || err?.message?.includes('invalid')) {
        setError('Incorrect code. Please try again.');
      } else if (err?.code?.includes('session-expired') || err?.message?.includes('expired')) {
        setError('Code expired. Request a new one below.');
      } else {
        setError(err?.message ?? 'Verification failed. Please try again.');
      }
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  }, [otp, name, auth]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && !isLoading) handleVerify();
  }, [otp]);

  const handleResend = async () => {
    if (timer > 0 || isSending) return;
    setIsSending(true);
    setError('');
    setOtp('');
    try {
      await auth.sendPhoneOTP(params.phone);
      setTimer(Config.OTP_RESEND_TIMER);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Failed to resend. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  const maskedPhone = params.phone.replace(/(\+\d{1,3})(\d+)(\d{4})$/, (_, cc, mid, last) =>
    `${cc} ${'•'.repeat(mid.length)} ${last}`,
  );

  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.successWrap, checkmarkStyle]}>
          <View style={[styles.successCircle, { backgroundColor: `${Colors.success}20` }]}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={[Typography.h2, { color: colors.text, marginTop: 20 }]}>Verified!</Text>
          <Text style={[Typography.body, { color: colors.textSub, marginTop: 8, textAlign: 'center' }]}>
            Welcome to Swibber
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="" />

      <Animated.View style={[styles.content, contentStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>Check your{'\n'}messages</Text>
        <Text style={[Typography.body, { color: colors.textSub, marginBottom: 40 }]}>
          We sent a 6-digit code to{' '}
          <Text style={{ color: colors.text, fontWeight: '600' }}>{maskedPhone}</Text>
        </Text>

        <Animated.View style={shakeStyle}>
          <OTPInput value={otp} onChange={setOtp} error={!!error} />
        </Animated.View>

        {error ? (
          <Text style={[Typography.caption, { color: Colors.error, textAlign: 'center', marginTop: 14 }]}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Verify"
          onPress={handleVerify}
          isLoading={isLoading}
          isDisabled={otp.length < 6}
          style={{ marginTop: 36 }}
        />

        {/* Resend row */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={[Typography.body, { color: colors.textSub }]}>
              Resend code in{' '}
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isSending}>
              <Text style={[Typography.labelLarge, { color: isSending ? colors.textMuted : Colors.primary }]}>
                {isSending ? 'Sending…' : 'Resend code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.wrongNumber}
          onPress={() => navigation.goBack()}
        >
          <Text style={[Typography.label, { color: colors.textMuted }]}>
            Wrong number?{' '}
            <Text style={{ color: Colors.primary }}>Change it</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.base },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: { fontSize: 52, color: Colors.success },
  resendRow: { alignItems: 'center', marginTop: 28 },
  wrongNumber: { alignItems: 'center', marginTop: 16 },
});

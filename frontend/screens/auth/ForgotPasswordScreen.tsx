import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing } from '../../theme';
import { Validators } from '../../utils/validators';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Header from '../../components/common/Header';

type ForgotNav = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotNav>();
  const auth = useAuthContext();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(24);

  useEffect(() => {
    contentOpacity.value = withDelay(80, withTiming(1, { duration: 400 }));
    contentY.value = withDelay(80, withSpring(0, { damping: 16 }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const handleSend = async () => {
    if (!Validators.isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await auth.sendPasswordReset(email);
      setIsSent(true);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code?.includes('user-not-found')) {
        // For security, don't reveal if email exists — show same success state
        setIsSent(true);
      } else if (err?.code?.includes('too-many-requests')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err?.message ?? 'Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack />
        <Animated.View style={[styles.successContent, contentStyle]}>
          <Text style={{ fontSize: 72 }}>📬</Text>
          <Text style={[Typography.h2, { color: colors.text, marginTop: 24, marginBottom: 10, textAlign: 'center' }]}>
            Check your email
          </Text>
          <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginBottom: 40, lineHeight: 24 }]}>
            We sent a password reset link to{'\n'}
            <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text>
            {'\n\n'}
            Check your spam folder if you don't see it.
          </Text>
          <Button
            label="Back to Sign In"
            onPress={() => navigation.navigate('EmailAuth', { mode: 'login' })}
            fullWidth={false}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="" />
      <Animated.View style={[styles.content, contentStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>Forgot{'\n'}password?</Text>
        <Text style={[Typography.body, { color: colors.textSub, marginBottom: 36, lineHeight: 24 }]}>
          No worries! Enter your email and we'll send you a secure reset link.
        </Text>

        <Input
          label="Email address"
          placeholder="you@email.com"
          value={email}
          onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
          leftIcon="email"
          error={error}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />

        <Button
          label="Send Reset Link"
          onPress={handleSend}
          isLoading={isLoading}
          isDisabled={!email}
          style={{ marginTop: 8 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.xl, paddingTop: Spacing.base },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});

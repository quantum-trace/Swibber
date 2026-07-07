import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Validators } from '../../utils/validators';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Header from '../../components/common/Header';

type EmailAuthNav = StackNavigationProp<AuthStackParamList, 'EmailAuth'>;
type EmailAuthRoute = RouteProp<AuthStackParamList, 'EmailAuth'>;

type Mode = 'login' | 'signup';

export default function EmailAuthScreen() {
  const navigation = useNavigation<EmailAuthNav>();
  const { params } = useRoute<EmailAuthRoute>();
  const auth = useAuthContext();
  const { colors, isDark } = useTheme();

  const [mode, setMode] = useState<Mode>(params?.mode ?? 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(28);

  useEffect(() => {
    cardOpacity.value = withDelay(60, withTiming(1, { duration: 400 }));
    cardY.value = withDelay(60, withSpring(0, { damping: 16, stiffness: 200 }));
  }, []);

  // Animate mode switch
  const switchOpacity = useSharedValue(1);
  const handleModeSwitch = (next: Mode) => {
    if (next === mode) return;
    switchOpacity.value = withTiming(0, { duration: 150 }, () => {
      switchOpacity.value = withTiming(1, { duration: 200 });
    });
    setMode(next);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: switchOpacity.value,
  }));

  const passwordStrength = Validators.getPasswordStrength(password);
  const strengthColors = {
    weak: Colors.error,
    fair: Colors.warning,
    strong: Colors.primary,
    very_strong: Colors.success,
  } as const;
  const strengthLabels = { weak: 'Weak', fair: 'Fair', strong: 'Strong', very_strong: 'Strong' } as const;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (mode === 'signup' && !Validators.isValidName(name)) e.name = 'Enter your full name';
    if (!Validators.isValidEmail(email)) e.email = 'Enter a valid email address';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    if (mode === 'signup') {
      if (!Validators.isValidPassword(password)) e.password = 'Min 8 chars, 1 uppercase, 1 number';
      if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await auth.signInWithEmail(email, password);
      } else {
        await auth.signUpWithEmail(name, email, password);
      }
      // Navigation handled by auth state in AppNavigator
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const code = err?.code ?? '';
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        setErrors({ submit: 'Incorrect email or password. Please try again.' });
      } else if (code.includes('email-already-in-use')) {
        setErrors({ submit: 'An account with this email already exists. Try signing in.' });
      } else if (code.includes('weak-password')) {
        setErrors({ password: 'Choose a stronger password.' });
      } else if (code.includes('too-many-requests')) {
        setErrors({ submit: 'Too many attempts. Please wait a moment and try again.' });
      } else {
        setErrors({ submit: err?.message ?? 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && (
        <LinearGradient
          colors={['rgba(76,53,232,0.10)', 'transparent']}
          style={styles.topGlow}
        />
      )}
      <Header showBack title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={cardStyle}>
            {/* Mode toggle pills */}
            <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(['login', 'signup'] as Mode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => handleModeSwitch(m)}
                  style={[
                    styles.togglePill,
                    mode === m && { backgroundColor: Colors.primary },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      Typography.label,
                      { color: mode === m ? Colors.white : colors.textSub },
                    ]}
                  >
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Animated.View style={formStyle}>
              <Text style={[styles.title, { color: colors.text }]}>
                {mode === 'login' ? 'Welcome\nback' : 'Create your\naccount'}
              </Text>

              {mode === 'signup' && (
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  value={name}
                  onChangeText={setName}
                  leftIcon="person"
                  error={errors.name}
                  autoCapitalize="words"
                />
              )}

              <Input
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="email"
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder={mode === 'signup' ? 'Min 8 chars, 1 uppercase, 1 number' : 'Your password'}
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon="lock"
                error={errors.password}
              />

              {/* Password strength bar (signup only) */}
              {mode === 'signup' && password.length > 0 && (
                <View style={styles.strengthRow}>
                  {(['weak', 'fair', 'strong', 'very_strong'] as const).map((level, i) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            i <= ['weak', 'fair', 'strong', 'very_strong'].indexOf(passwordStrength)
                              ? strengthColors[passwordStrength]
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                  <Text style={[Typography.caption, { color: strengthColors[passwordStrength] }]}>
                    {strengthLabels[passwordStrength]}
                  </Text>
                </View>
              )}

              {mode === 'signup' && (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  leftIcon="lock"
                  error={errors.confirmPassword}
                />
              )}

              {mode === 'login' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotLink}
                >
                  <Text style={[Typography.label, { color: Colors.primary }]}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {errors.submit ? (
                <View style={[styles.errorBanner, { backgroundColor: `${Colors.error}18`, borderColor: `${Colors.error}30` }]}>
                  <Text style={[Typography.caption, { color: Colors.error }]}>{errors.submit}</Text>
                </View>
              ) : null}

              <Button
                label={mode === 'login' ? 'Sign In' : 'Create Account'}
                onPress={handleSubmit}
                isLoading={isLoading}
                style={{ marginTop: 8 }}
              />
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.base },

  toggleRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    padding: 4,
    marginBottom: 32,
  },
  togglePill: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 24,
  },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
    marginBottom: 14,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },

  forgotLink: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -4 },

  errorBanner: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
});

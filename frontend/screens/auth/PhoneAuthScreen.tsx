import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { COUNTRY_CODES } from '../../constants/authEnums';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';

type PhoneNav = StackNavigationProp<AuthStackParamList, 'PhoneAuth'>;

export default function PhoneAuthScreen() {
  const navigation = useNavigation<PhoneNav>();
  const auth = useAuthContext();
  const { colors, isDark } = useTheme();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const inputRef = useRef<TextInput>(null);

  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(32);

  useEffect(() => {
    cardOpacity.value = withDelay(100, withTiming(1, { duration: 450 }));
    cardY.value = withDelay(100, withSpring(0, { damping: 16, stiffness: 200 }));
    setTimeout(() => inputRef.current?.focus(), 600);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const filteredCountries = countrySearch
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.includes(countrySearch),
      )
    : COUNTRY_CODES;

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 15) {
      setError('Enter a valid phone number');
      return;
    }
    setError('');
    setIsLoading(true);

    const fullPhone = `${selectedCountry.code}${digits}`;
    try {
      await auth.sendPhoneOTP(fullPhone);
      navigation.navigate('OTPVerify', { phone: fullPhone });
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message?.includes('invalid-phone')
        ? 'Invalid phone number. Check the country code and try again.'
        : err?.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isDark && (
        <LinearGradient
          colors={['rgba(76,53,232,0.12)', 'transparent']}
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
            {/* Header text */}
            <Text style={[styles.title, { color: colors.text }]}>Enter your{'\n'}phone number</Text>
            <Text style={[Typography.body, { color: colors.textSub, marginBottom: 36 }]}>
              We'll send you a one-time verification code
            </Text>

            {/* Phone input row */}
            <Text style={[Typography.label, { color: colors.textSub, marginBottom: 8 }]}>
              Phone number
            </Text>
            <View style={[styles.inputRow, { borderColor: error ? Colors.error : colors.border, backgroundColor: colors.card }]}>
              {/* Country picker trigger */}
              <TouchableOpacity
                onPress={() => setPickerVisible(true)}
                style={[styles.countryBtn, { borderRightColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{selectedCountry.flag}</Text>
                <Text style={[Typography.labelLarge, { color: colors.text }]}>{selectedCountry.code}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Number input */}
              <TextInput
                ref={inputRef}
                value={phone}
                onChangeText={(t) => { setPhone(t); if (error) setError(''); }}
                keyboardType="phone-pad"
                placeholder="98765 43210"
                placeholderTextColor={colors.textMuted}
                style={[styles.phoneInput, { color: colors.text }]}
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={handleSend}
              />
            </View>

            {error ? (
              <Text style={[Typography.caption, { color: Colors.error, marginTop: 6 }]}>{error}</Text>
            ) : null}

            <Button
              label="Send OTP"
              onPress={handleSend}
              isLoading={isLoading}
              isDisabled={phone.replace(/\D/g, '').length < 6}
              style={{ marginTop: 32 }}
            />

            <Text style={[Typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 20, lineHeight: 18 }]}>
              Standard SMS rates may apply. By continuing, you agree to receive a verification code via SMS.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[Typography.h3, { color: colors.text }]}>Select Country</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
            <TextInput
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Search country or code"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.iso}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedCountry(item);
                  setPickerVisible(false);
                  setCountrySearch('');
                }}
                style={({ pressed }) => [
                  styles.countryItem,
                  { borderBottomColor: colors.border },
                  pressed && { backgroundColor: colors.card },
                  selectedCountry.iso === item.iso && { backgroundColor: `${Colors.primary}15` },
                ]}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>{item.name}</Text>
                <Text style={[Typography.label, { color: colors.textMuted }]}>{item.code}</Text>
                {selectedCountry.iso === item.iso && (
                  <MaterialCommunityIcons name="check" size={18} color={Colors.primary} style={{ marginLeft: 8 }} />
                )}
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.base },

  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 10,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    height: 60,
    overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: '100%',
    borderRightWidth: 1,
  },
  flag: { fontSize: 22 },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '500',
    height: '100%',
  },

  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
});

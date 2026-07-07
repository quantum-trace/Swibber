import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const MIN_AMOUNT = 100;

export default function WithdrawMoneySection() {
  const { colors, isDark } = useTheme();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    setAmount(digits);
    const num = parseInt(digits, 10);
    if (digits && num < MIN_AMOUNT) {
      setError(`Minimum withdrawal amount is ₹${MIN_AMOUNT}`);
    } else {
      setError(null);
    }
  };

  const isValid = !!amount && !error && parseInt(amount, 10) >= MIN_AMOUNT;

  return (
    <View style={[styles.withdrawCard, { backgroundColor: colors.card }]}>
      <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>Withdraw to Bank</Text>

      <View style={[styles.bankInfo, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
        <View style={[styles.bankIcon, { backgroundColor: `${Colors.primary}15` }]}>
          <MaterialIcons name="account-balance" size={24} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.label, { color: colors.text }]}>State Bank of India</Text>
          <Text style={[Typography.caption, { color: colors.textSub }]}>**** 4321</Text>
        </View>
        <TouchableOpacity>
          <Text style={[Typography.captionBold, { color: Colors.primary }]}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountInputWrapper}>
        <Text style={[Typography.h3, { color: colors.text, position: 'absolute', left: 14, zIndex: 1 }]}>₹</Text>
        <TextInput
          style={[styles.amountInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="0"
          placeholderTextColor={colors.textSub}
          keyboardType="numeric"
          value={amount}
          onChangeText={handleAmountChange}
          placeholder={`Min ₹${MIN_AMOUNT}`}
        />
      </View>

      {error && (
        <Text style={[Typography.caption, { color: Colors.error, marginBottom: 10 }]}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.withdrawBtn, { backgroundColor: isValid ? Colors.primary : colors.border }]}
        disabled={!isValid}
      >
        <MaterialIcons name="account-balance-wallet" size={18} color={Colors.white} />
        <Text style={[Typography.label, { color: Colors.white, marginLeft: 6 }]}>Withdraw ₹{amount || '0'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  withdrawCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amountInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  amountInput: {
    padding: 14,
    paddingLeft: 34,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: BorderRadius.md,
  },
});

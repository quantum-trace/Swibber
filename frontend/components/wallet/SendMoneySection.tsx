import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const MIN_AMOUNT = 100;

export default function SendMoneySection() {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    setAmount(digits);
    const num = parseInt(digits, 10);
    if (digits && num < MIN_AMOUNT) {
      setError(`Minimum transfer amount is ₹${MIN_AMOUNT}`);
    } else {
      setError(null);
    }
  };

  const isValid = !!amount && !error && parseInt(amount, 10) >= MIN_AMOUNT;

  return (
    <View style={[styles.sendCard, { backgroundColor: colors.card }]}>
      <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>Send Money</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        placeholder="Enter mobile number or UPI ID"
        placeholderTextColor={colors.textSub}
        value={contact}
        onChangeText={setContact}
      />

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
        style={[styles.sendBtn, { backgroundColor: isValid ? Colors.primary : colors.border }]}
        disabled={!isValid}
      >
        <MaterialIcons name="send" size={18} color={Colors.white} />
        <Text style={[Typography.label, { color: Colors.white, marginLeft: 6 }]}>Send ₹{amount || '0'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sendCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  input: {
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 12,
    fontSize: 16,
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
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: BorderRadius.md,
  },
});

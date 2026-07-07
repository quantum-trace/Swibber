import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const PRESET_AMOUNTS = [100, 200, 500, 1000];
const MIN_AMOUNT = 100;

export default function AddMoneySection() {
  const { colors } = useTheme();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = (amt: number) => {
    setIsCustom(false);
    setSelectedAmount(amt);
    setCustomInput('');
    setError(null);
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setError(null);
  };

  const handleCustomChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    setCustomInput(digits);
    const num = parseInt(digits, 10);
    if (digits && num < MIN_AMOUNT) {
      setError(`Minimum top-up amount is ₹${MIN_AMOUNT}`);
    } else {
      setError(null);
      if (num) setSelectedAmount(num);
    }
  };

  const displayAmount = isCustom ? (parseInt(customInput, 10) || 0) : selectedAmount;
  const isValid = !isCustom || (!error && !!customInput && parseInt(customInput, 10) >= MIN_AMOUNT);

  return (
    <View style={[styles.addCard, { backgroundColor: colors.card }]}>
      <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>Add Money</Text>

      <View style={styles.amountRow}>
        {PRESET_AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            onPress={() => handlePresetSelect(amt)}
            style={[
              styles.amountChip,
              {
                backgroundColor: !isCustom && selectedAmount === amt ? Colors.primary : colors.background,
                borderColor: !isCustom && selectedAmount === amt ? Colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[Typography.captionBold, { color: !isCustom && selectedAmount === amt ? Colors.white : colors.textSub }]}>
              ₹{amt}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={handleCustomSelect}
          style={[
            styles.amountChip,
            {
              backgroundColor: isCustom ? Colors.primary : colors.background,
              borderColor: isCustom ? Colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[Typography.captionBold, { color: isCustom ? Colors.white : colors.textSub }]}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {isCustom && (
        <View style={styles.customInputWrapper}>
          <Text style={[Typography.h3, { color: colors.text, position: 'absolute', left: 14, zIndex: 1 }]}>₹</Text>
          <TextInput
            style={[
              styles.customInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: error ? Colors.error : colors.border,
              },
            ]}
            placeholder={`Min ₹${MIN_AMOUNT}`}
            placeholderTextColor={colors.textSub}
            keyboardType="numeric"
            value={customInput}
            onChangeText={handleCustomChange}
            autoFocus
          />
        </View>
      )}

      {error && (
        <Text style={[Typography.caption, { color: Colors.error, marginBottom: 10 }]}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: isValid ? Colors.primary : colors.border }]}
        disabled={!isValid}
      >
        <MaterialIcons name="add" size={18} color={Colors.white} />
        <Text style={[Typography.label, { color: Colors.white, marginLeft: 6 }]}>
          Add ₹{displayAmount}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  amountChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: BorderRadius.md, borderWidth: 1.5, alignItems: 'center' },
  customInputWrapper: { position: 'relative', justifyContent: 'center', marginBottom: 10 },
  customInput: {
    padding: 14,
    paddingLeft: 34,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: 'bold',
  },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: BorderRadius.md },
});

import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Spacing, Typography, Colors } from '../../theme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  error?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, error }: OTPInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.container}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
      />
      <View style={styles.dots}>
        {digits.map((digit, idx) => {
          const isFilled = idx < value.length;
          const isCurrent = idx === value.length;
          return (
            <View
              key={idx}
              style={[
                styles.cell,
                {
                  backgroundColor: colors.card,
                  borderColor: error
                    ? Colors.error
                    : isCurrent
                    ? Colors.primary
                    : isFilled
                    ? Colors.primaryLight
                    : colors.border,
                  borderWidth: isCurrent ? 2 : 1.5,
                },
              ]}
            >
              <Text style={[Typography.h3, { color: colors.text }]}>
                {digit || ''}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  dots: { flexDirection: 'row', gap: Spacing.sm },
  cell: {
    width: 50,
    height: 58,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

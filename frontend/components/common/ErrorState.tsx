import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing } from '../../theme';
import Button from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={[Typography.h4, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>
        Oops!
      </Text>
      <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginBottom: 24 }]}>
        {message}
      </Text>
      {onRetry ? (
        <Button label="Try Again" onPress={onRetry} size="md" fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emoji: { fontSize: 56, marginBottom: Spacing.base },
});

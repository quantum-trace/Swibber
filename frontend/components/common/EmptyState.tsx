import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing } from '../../theme';
import Button from './Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({
  emoji = '📭',
  title,
  subtitle,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginBottom: 24 }]}>
          {subtitle}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <Button label={ctaLabel} onPress={onCta} size="md" fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emoji: { fontSize: 64, marginBottom: Spacing.base },
});

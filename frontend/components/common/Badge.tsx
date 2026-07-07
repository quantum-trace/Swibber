import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface BadgeProps {
  count?: number;
  color?: string;
}

export default function Badge({ count = 0, color = Colors.error }: BadgeProps) {
  if (!count || count <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: { ...Typography.captionBold, color: Colors.white, fontSize: 10 },
});

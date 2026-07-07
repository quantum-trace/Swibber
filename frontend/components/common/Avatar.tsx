import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius } from '../../theme';

interface AvatarProps {
  name?: string;
  emoji?: string;
  size?: number;
  style?: ViewStyle;
}

export default function Avatar({ name, emoji, size = 44, style }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const fontSize = size * 0.4;

  return (
    <LinearGradient
      colors={Colors.gradientPrimary as [string, string]}
      style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Text style={{ fontSize, fontWeight: '700', color: Colors.white }}>
        {emoji ?? initials}
      </Text>
    </LinearGradient>
  );
}

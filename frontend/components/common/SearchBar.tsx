import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Colors, Spacing, Typography } from '../../theme';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onClear?: () => void;
  readonly?: boolean;
  style?: ViewStyle;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onPress,
  onClear,
  readonly = false,
  style,
  autoFocus = false,
}: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={readonly ? 0.7 : 1}
      onPress={readonly ? onPress : undefined}
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <MaterialIcons name="search" size={22} color={colors.textMuted} style={{ marginRight: 8 }} />
      {readonly ? (
        <TextInput
          editable={false}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          pointerEvents="none"
          style={[styles.input, Typography.body, { color: colors.text }]}
        />
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          style={[styles.input, Typography.body, { color: colors.text }]}
          returnKeyType="search"
        />
      )}
      {value && onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.base,
    height: 52,
    borderWidth: 1,
  },
  input: { flex: 1 },
});

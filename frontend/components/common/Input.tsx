import React, { useState, memo, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Spacing } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

const INPUT_HEIGHT = 56;

function InputComponent({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword,
  style,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus  = useCallback(() => setIsFocused(true),  []);
  const handleBlur   = useCallback(() => setIsFocused(false), []);
  const toggleShow   = useCallback(() => setShowPassword((p) => !p), []);

  const borderColor = error
    ? '#FF3B30'
    : isFocused
    ? '#4C35E8'
    : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSub }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: colors.card,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon ? (
          <MaterialIcons
            name={leftIcon as any}
            size={20}
            color={isFocused ? '#4C35E8' : colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...rest}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.text,
              // Avoid spreading Typography objects — those can include fontFamily
              // that re-triggers font loading and causes visual flicker on Android.
              fontSize:  16,
              lineHeight: Platform.OS === 'android' ? undefined : 22,
              textAlignVertical: 'center',
            },
            style,
          ]}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={toggleShow}
            style={styles.rightIcon}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <MaterialIcons name={rightIcon as any} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.hint, { color: '#FF3B30' }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export default memo(InputComponent);

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize:     13,
    fontWeight:   '500',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    borderRadius:    BorderRadius.md,
    paddingHorizontal: Spacing.base,
    height:          INPUT_HEIGHT,
    overflow:        'hidden',
  },
  leftIcon: { marginRight: Spacing.sm },
  rightIcon: { marginLeft: Spacing.sm, padding: 4 },
  input: {
    flex:           1,
    paddingVertical: 0,
    // Let height derive from the wrapper — avoid '100%' which
    // can cause layout thrashing and visual flicker on Android.
    height:         INPUT_HEIGHT,
    includeFontPadding: false,
  },
  hint: {
    fontSize:   12,
    marginTop:  4,
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing } from '../../theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
}

export default function Header({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightComponent,
  style,
  transparent = false,
}: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomColor: transparent ? 'transparent' : colors.border,
        },
        style,
      ]}
    >
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.titleContainer}>
        {title ? <Text style={[Typography.h4, { color: colors.text }]} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={[Typography.caption, { color: colors.textSub }]}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{rightComponent ?? <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  right: { minWidth: 40, alignItems: 'flex-end' },
  placeholder: { width: 32 },
});

import React from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Shadows, Spacing, Typography } from '../../theme';
import Badge from '../common/Badge';
import { useAppStore } from '../../store/appStore';

type TabConfig = {
  name: string;
  icon: string;
  label: string;
};

const TAB_CONFIGS: TabConfig[] = [
  { name: 'HomeTab', icon: 'home', label: 'Home' },
  { name: 'ActivityTab', icon: 'receipt-long', label: 'Activity' },
  { name: 'WalletTab', icon: 'account-balance-wallet', label: 'Wallet' },
  { name: 'RideTab', icon: 'directions-car', label: 'Ride' },
  { name: 'FoodTab', icon: 'restaurant', label: 'Eats' },
  { name: 'ParcelTab', icon: 'local-shipping', label: 'Send' },
];

function TabItem({
  config,
  isFocused,
  onPress,
  showBadge,
}: {
  config: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  showBadge?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      style={styles.tabItem}
    >
      <View style={styles.tabContent}>
        {isFocused && (
          <View style={styles.activeIndicator} />
        )}
        <View style={{ position: 'relative' }}>
          <MaterialIcons
            name={config.icon as any}
            size={24}
            color={isFocused ? Colors.primary : '#606078'}
          />
          {showBadge && <Badge count={2} />}
        </View>
        <Text
          style={[
            Typography.captionBold,
            {
              color: isFocused ? Colors.primary : '#606078',
              marginTop: 2,
            },
          ]}
        >
          {config.label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const notificationCount = useAppStore((s) => s.notifications?.length ?? 0);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBar,
          paddingBottom: insets.bottom || Spacing.sm,
          ...Shadows.xl,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIGS.find((c) => c.name === route.name);
        if (!config) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            config={config}
            isFocused={isFocused}
            onPress={onPress}
            showBadge={route.name === 'NotificationsTab' && notificationCount > 0}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabContent: { alignItems: 'center', position: 'relative', paddingHorizontal: 4 },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});

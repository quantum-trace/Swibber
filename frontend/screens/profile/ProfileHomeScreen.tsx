import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useProfileQuery';
import { membershipTierConfigs, MembershipTierEnum, type MembershipTier } from '../../constants/enums';
import { formatCurrency } from '../../utils/formatters';
import Avatar from '../../components/common/Avatar';

type ProfileNav = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

const MENU_ITEMS = [
  { icon: 'person',       label: 'Edit Profile',      screen: 'EditProfile'     as const, desc: 'Name, photo, contact'         },
  { icon: 'place',        label: 'Saved Addresses',   screen: 'SavedAddresses'  as const, desc: 'Home, work & more'             },
  { icon: 'credit-card',  label: 'Payment Methods',   screen: 'PaymentMethods'  as const, desc: 'Cards, UPI, wallet'            },
  { icon: 'settings',     label: 'Settings',          screen: 'Settings'        as const, desc: 'Theme, notifications, privacy' },
  { icon: 'help-outline', label: 'Help & Support',    screen: 'HelpSupport'     as const, desc: 'FAQs, contact us'              },
];

export default function ProfileHomeScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { colors } = useTheme();
  const { user: authUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading, refetch } = useUserProfile();

  // Merge: prefer fresh profile data, fall back to auth-context user
  const user = profile ?? authUser;
  const tierKey = (user?.membershipTier ?? MembershipTierEnum.BRONZE) as MembershipTier;
  const tier = membershipTierConfigs[tierKey] ?? membershipTierConfigs[MembershipTierEnum.BRONZE];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[Typography.body, { color: colors.textSub }]}>Could not load profile. Pull to refresh.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header gradient */}
        <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.headerGrad}>
          <View style={styles.headerContent}>
            <Avatar name={user.name} size={72} />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={[Typography.h3, { color: Colors.white }]}>{user.name}</Text>
              <Text style={[Typography.body, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]}>
                {user.phone ?? user.email ?? ''}
              </Text>
              <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={{ fontSize: 14 }}>{tier.emoji}</Text>
                <Text style={[Typography.captionBold, { color: Colors.white, marginLeft: 4 }]}>{tier.alias}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <MaterialIcons name="edit" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }, Shadows.sm]}>
          {[
            { label: 'Reward Points', value: (user.rewardPoints ?? 0).toLocaleString() },
            { label: 'Wallet',        value: formatCurrency(user.walletBalance ?? 0) },
          ].map(({ label, value }, i) => (
            <React.Fragment key={label}>
              <View style={styles.statItem}>
                <Text style={[Typography.h4, { color: Colors.primary }]}>{value}</Text>
                <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>{label}</Text>
              </View>
              {i === 0 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Membership tier info */}
        <View style={[styles.tierInfoRow, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={{ fontSize: 28 }}>{tier.emoji}</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[Typography.label, { color: colors.text }]}>{tier.alias}</Text>
            <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]}>
              {Math.round(tier.cashbackRate * 100)}% cashback · {(user.rewardPoints ?? 0).toLocaleString()} reward pts
            </Text>
          </View>
          <View style={[styles.tierChip, { backgroundColor: `${tier.color}20`, borderColor: `${tier.color}60` }]}>
            <Text style={[Typography.captionBold, { color: tier.color }]}>{tier.label}</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          {MENU_ITEMS.map(({ icon, label, screen, desc }, i) => (
            <TouchableOpacity
              key={label}
              onPress={() => navigation.navigate(screen)}
              style={[
                styles.menuRow,
                i < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <MaterialIcons name={icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[Typography.label, { color: colors.text }]}>{label}</Text>
                <Text style={[Typography.caption, { color: colors.textSub }]}>{desc}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>Swibber v1.0.0</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <MaterialIcons name="logout" size={16} color={Colors.error} />
            <Text style={[Typography.captionBold, { color: Colors.error, marginLeft: 6 }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: Spacing.xl },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full, marginTop: 6, alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginTop: -16,
    borderRadius: BorderRadius.xl, padding: Spacing.base,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, alignSelf: 'center' },
  tierInfoRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginTop: Spacing.base,
    borderRadius: BorderRadius.xl, padding: Spacing.base,
  },
  tierChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
  },
  menuCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  menuIcon: { width: 42, height: 42, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
  },
  logoutBtn: { flexDirection: 'row', alignItems: 'center' },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import { useAppStore } from '../../store/appStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { membershipTierConfigs, MembershipTierEnum, type MembershipTier } from '../../constants/enums';
import { getGreeting, extractFirstName } from '../../utils/helpers';
import PromoBanner from '../../components/home/PromoBanner';
import Avatar from '../../components/common/Avatar';
import SearchBar from '../../components/common/SearchBar';

const { width } = Dimensions.get('window');

type HomeNav = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

// Static promo content — replace with /promotions API when backend endpoint is added
const PROMO_BANNERS = [
  {
    id: 'first-ride',
    title: 'First Ride Free!',
    subtitle: 'Use code on your first Swibber ride',
    couponCode: 'WELCOME',
    discount: '100% off',
    expiresIn: '7 days',
    gradient: [Colors.primary, '#7B2FBE'] as [string, string],
  },
  {
    id: 'swibber-eats',
    title: 'SwibberEats 20% Off',
    subtitle: 'On your first food order today',
    couponCode: 'EAT20',
    discount: '20% off',
    expiresIn: '24 hrs',
    gradient: ['#FF6B6B', '#FF9500'] as [string, string],
  },
  {
    id: 'parcel-deal',
    title: 'Send Parcels for ₹49',
    subtitle: 'Same-city deliveries this weekend',
    couponCode: 'SEND49',
    discount: '₹49 flat',
    expiresIn: '2 days',
    gradient: ['#00C853', '#00D4FF'] as [string, string],
  },
];

function PromoDot({ active, primaryColor, borderColor, onPress }: {
  active: boolean; primaryColor: string; borderColor: string; onPress?: () => void;
}) {
  const dotWidth = useSharedValue(active ? 20 : 8);
  useEffect(() => { dotWidth.value = withTiming(active ? 20 : 8, { duration: 250 }); }, [active]);
  const animStyle = useAnimatedStyle(() => ({ width: dotWidth.value }));
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View style={[styles.promoDot, { backgroundColor: active ? primaryColor : borderColor }, animStyle]} />
    </TouchableOpacity>
  );
}

function AnimatedRow({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(24);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    y.value = withDelay(delay, withSpring(0, { damping: 18 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { location } = useLocation();
  const insets = useSafeAreaInsets();
  const { notifications, readIds } = useAppStore();
  const unreadCount = notifications.filter((n: any) => !readIds.has(n.id)).length;

  const [promoIndex, setPromoIndex] = useState(0);
  const promoListRef = useRef<FlatList>(null);


  const tierKey = (user?.membershipTier ?? MembershipTierEnum.BRONZE) as MembershipTier;
  const tier = membershipTierConfigs[tierKey] ?? membershipTierConfigs[MembershipTierEnum.BRONZE];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#14103A', 'transparent'] : [`${Colors.primary}12`, 'transparent']}
        style={styles.topGradient}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedRow delay={0}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>
                {getGreeting()} 👋
              </Text>
              <Text style={[Typography.h3, { color: colors.text }]}>
                {user ? extractFirstName(user.name) : 'Welcome'}
              </Text>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={14} color={Colors.primary} />
                <Text style={[Typography.caption, { color: colors.textSub, marginLeft: 2 }]} numberOfLines={1}>
                  {location?.address ?? 'Getting location...'}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.getParent()?.navigate('NotificationsTab')}
              >
                <MaterialIcons name="notifications-none" size={22} color={colors.text} />
                {unreadCount > 0 && <View style={styles.notifDot} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('ProfileTab')}>
                <Avatar name={user?.name} size={42} />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedRow>

        {/* Search */}
        <AnimatedRow delay={100}>
          <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }}>
            <SearchBar
              placeholder="Where do you want to go?"
              readonly
              onPress={() => navigation.navigate('RideStack' as any)}
            />
          </View>
        </AnimatedRow>

        {/* Promo Banners */}
        <AnimatedRow delay={300}>
          <Text style={[Typography.h4, { color: colors.text, paddingHorizontal: Spacing.xl, marginBottom: 14 }]}>
            Offers & Deals 🎁
          </Text>
          <FlatList
            ref={promoListRef}
            data={PROMO_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            snapToInterval={width - 36}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 12 }}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 36));
              if (idx >= 0 && idx < PROMO_BANNERS.length) setPromoIndex(idx);
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={{ width: width - 48 }}>
                <PromoBanner
                  title={item.title}
                  subtitle={item.subtitle}
                  couponCode={item.couponCode}
                  discount={item.discount}
                  expiresIn={item.expiresIn}
                  gradient={item.gradient}
                />
              </View>
            )}
          />
          <View style={styles.promoDotsRow}>
            {PROMO_BANNERS.map((banner, i) => (
              <PromoDot
                key={banner.id}
                active={i === promoIndex}
                primaryColor={banner.gradient[0]}
                borderColor={colors.border}
                onPress={() => promoListRef.current?.scrollToOffset({ offset: i * (width - 36), animated: true })}
              />
            ))}
          </View>
        </AnimatedRow>

        {/* Membership card — navigates to upgrade screen */}
        <AnimatedRow delay={400}>
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.getParent()?.navigate('ProfileTab' as any, { screen: 'MembershipUpgrade' } as any)}
            >
              <LinearGradient
                colors={(tier.gradient ?? [Colors.primary, Colors.secondary]) as [string, string]}
                style={styles.memberCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View>
                  <Text style={[Typography.overline, { color: `${Colors.white}CC` }]}>Membership</Text>
                  <Text style={[Typography.h3, { color: Colors.white }]}>
                    {tier.emoji} {tier.alias}
                  </Text>
                  <Text style={[Typography.body, { color: `${Colors.white}CC`, marginTop: 4 }]}>
                    {(user?.rewardPoints ?? 0).toLocaleString('en-IN')} reward points
                  </Text>
                </View>
                <View style={styles.memberRight}>
                  <Text style={styles.memberEmoji}>💎</Text>
                  <Text style={[Typography.captionBold, { color: Colors.white, marginTop: 4 }]}>
                    {(tier.key as string) === 'platinum' ? 'View Benefits' : 'Upgrade'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AnimatedRow>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  scroll: { paddingTop: 0 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, position: 'relative',
  },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  promoDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: Spacing.xl },
  promoDot: { height: 8, borderRadius: 4 },
  memberCard: {
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  memberRight: { alignItems: 'center' },
  memberEmoji: { fontSize: 36 },
});

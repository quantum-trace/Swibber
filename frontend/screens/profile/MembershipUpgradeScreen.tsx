import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useQueryClient } from '@tanstack/react-query';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useProfileQuery';
import { membershipTierConfigs, MembershipTierEnum, type MembershipTier } from '../../constants/enums';
import { PaymentService } from '../../services/paymentService';
import { apiClient } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import Header from '../../components/common/Header';
import { Config } from '../../constants/config';

type ProfileNav = StackNavigationProp<ProfileStackParamList, 'MembershipUpgrade'>;

const TIERS: MembershipTier[] = [MembershipTierEnum.BRONZE, MembershipTierEnum.GOLD, MembershipTierEnum.PLATINUM];
const TIER_ORDER: Record<string, number> = { bronze: 0, gold: 1, platinum: 2 };

export default function MembershipUpgradeScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { colors } = useTheme();
  const { user: authUser } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();

  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { showDialog } = useDialog();

  const user = profile ?? authUser;
  const rawTier = (user?.membershipTier ?? MembershipTierEnum.BRONZE) as string;
  const membershipExpiresAt = (user as any)?.membershipExpiresAt;
  const isExpired = membershipExpiresAt && new Date() > new Date(membershipExpiresAt);
  const currentTier = (isExpired ? MembershipTierEnum.BRONZE : rawTier) as MembershipTier;
  const currentPoints = user?.rewardPoints ?? 0;

  const isUpgrade = (tier: MembershipTier) => (TIER_ORDER[tier] ?? 0) > (TIER_ORDER[currentTier] ?? 0);
  const hasEnoughPoints = (tier: MembershipTier) => currentPoints >= membershipTierConfigs[tier].pointsRequired;

  const handleUpgrade = async (tier: MembershipTier) => {
    const cfg = membershipTierConfigs[tier];
    if (!cfg.monthlyPrice) return;

    if (!Config.RAZORPAY_KEY_ID) {
      showDialog({ title: 'Unavailable', message: 'Payments are not configured. Please try again later.', type: 'error' });
      return;
    }

    setLoadingTier(tier);
    try {
      const order = await PaymentService.createMembershipOrder(tier, cfg.monthlyPrice);

      const razorpayOptions = {
        key: Config.RAZORPAY_KEY_ID,
        amount: cfg.monthlyPrice * 100,
        currency: 'INR',
        name: 'Swibber',
        description: `${cfg.alias} Membership — 1 Month`,
        order_id: order.orderId,
        prefill: {
          name: user?.name ?? '',
          email: (user as any)?.email ?? '',
          contact: (user as any)?.phone ?? '',
        },
        theme: { color: Colors.primary },
      };

      const response = await RazorpayCheckout.open(razorpayOptions) as any;

      await PaymentService.verifyMembershipPayment({
        razorpayOrderId:   response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        tier,
      });

      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      showDialog({
        title:   `${cfg.emoji} Welcome to ${cfg.alias}!`,
        message: 'Your membership is now active for 30 days. Start enjoying your benefits!',
        type:    'success',
        buttons: [{ text: 'Awesome!', onPress: () => navigation.goBack() }],
      });
    } catch (err: any) {
      const cancelled = err?.code === 0 || err?.description === 'Payment cancelled by user';
      if (!cancelled) {
        showDialog({ title: 'Payment Failed', message: err?.description ?? 'Something went wrong. Please try again.', type: 'error' });
      }
    } finally {
      setLoadingTier(null);
    }
  };

  const handleClaimByPoints = async (tier: MembershipTier) => {
    const cfg = membershipTierConfigs[tier];
    setLoadingTier(`claim_${tier}`);
    try {
      await apiClient.post('/user/membership/claim', { targetTier: tier });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      showDialog({
        title:   `${cfg.emoji} ${cfg.alias} Claimed!`,
        message: `You've unlocked ${cfg.alias} using your reward points. Enjoy your benefits!`,
        type:    'success',
        buttons: [{ text: 'Amazing!', onPress: () => navigation.goBack() }],
      });
    } catch (err: any) {
      showDialog({ title: 'Error', message: err?.response?.data?.message ?? 'Could not claim membership. Try again.', type: 'error' });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Membership Plans" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Points bar */}
        <View style={[styles.pointsBanner, { backgroundColor: colors.card }]}>
          <MaterialIcons name="stars" size={20} color={Colors.warning} />
          <Text style={[Typography.label, { color: colors.text, marginLeft: 8, flex: 1 }]}>
            Your points:{' '}
            <Text style={{ color: Colors.warning }}>{currentPoints.toLocaleString()} pts</Text>
          </Text>
          {isExpired && (
            <View style={[styles.expiredBadge]}>
              <Text style={[Typography.captionBold, { color: Colors.error }]}>Expired</Text>
            </View>
          )}
        </View>

        {/* Tier cards */}
        {TIERS.map((tier) => {
          const cfg = membershipTierConfigs[tier];
          const isCurrent = tier === currentTier;
          const upgrade = isUpgrade(tier);
          const canClaim = upgrade && hasEnoughPoints(tier);
          const loading = loadingTier === tier;
          const loadingClaim = loadingTier === `claim_${tier}`;

          return (
            <LinearGradient
              key={tier}
              colors={cfg.gradient as [string, string]}
              style={[styles.tierCard, isCurrent && styles.currentCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Current plan badge */}
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <MaterialIcons name="check-circle" size={13} color={Colors.white} />
                  <Text style={[Typography.captionBold, { color: Colors.white, marginLeft: 4 }]}>Current Plan</Text>
                </View>
              )}

              {/* Header */}
              <View style={styles.tierHeader}>
                <Text style={{ fontSize: 36 }}>{cfg.emoji}</Text>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[Typography.h3, { color: Colors.white }]}>{cfg.alias}</Text>
                  <Text style={[Typography.body, { color: 'rgba(255,255,255,0.85)', marginTop: 2 }]}>
                    {cfg.monthlyPrice > 0
                      ? `${formatCurrency(cfg.monthlyPrice)}/mo  or  ${cfg.pointsRequired.toLocaleString()} pts`
                      : 'Free — given to everyone'}
                  </Text>
                </View>
              </View>

              {/* Benefits */}
              <View style={styles.benefitsList}>
                {cfg.benefits.map((benefit) => (
                  <View key={benefit} style={styles.benefitRow}>
                    <MaterialIcons name="check-circle" size={15} color="rgba(255,255,255,0.9)" />
                    <Text style={[Typography.body, { color: Colors.white, marginLeft: 8, flex: 1, lineHeight: 20 }]}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* CTA buttons */}
              {upgrade && (
                <View style={styles.ctaRow}>
                  {cfg.monthlyPrice > 0 && (
                    <TouchableOpacity
                      style={[styles.upgradeBtn, canClaim && { marginRight: 8 }]}
                      onPress={() => handleUpgrade(tier)}
                      disabled={loading || loadingClaim}
                    >
                      {loading
                        ? <ActivityIndicator size="small" color={cfg.color} />
                        : <Text style={[Typography.captionBold, { color: cfg.color }]}>
                            Upgrade {formatCurrency(cfg.monthlyPrice)}
                          </Text>
                      }
                    </TouchableOpacity>
                  )}
                  {canClaim && (
                    <TouchableOpacity
                      style={styles.claimBtn}
                      onPress={() => handleClaimByPoints(tier)}
                      disabled={loading || loadingClaim}
                    >
                      {loadingClaim
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <Text style={[Typography.captionBold, { color: Colors.white }]}>
                            Claim with {cfg.pointsRequired.toLocaleString()} pts
                          </Text>
                      }
                    </TouchableOpacity>
                  )}
                  {!canClaim && cfg.monthlyPrice > 0 && (
                    <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)', marginTop: 6 }]}>
                      {cfg.pointsRequired - currentPoints > 0
                        ? `${(cfg.pointsRequired - currentPoints).toLocaleString()} more pts to claim free`
                        : ''}
                    </Text>
                  )}
                </View>
              )}
            </LinearGradient>
          );
        })}

        {/* How to earn points */}
        <View style={[styles.earnCard, { backgroundColor: colors.card }]}>
          <Text style={[Typography.h4, { color: colors.text, marginBottom: 14 }]}>How to earn points</Text>
          {[
            { icon: 'directions-car', text: 'Complete a ride — 1 pt per ₹10 spent' },
            { icon: 'inventory-2',    text: 'Send a parcel — 1 pt per ₹10 spent' },
            { icon: 'fastfood',       text: 'Order food — 1 pt per ₹10 spent' },
          ].map((item) => (
            <View key={item.text} style={styles.earnRow}>
              <View style={[styles.earnIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <MaterialIcons name={item.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={[Typography.body, { color: colors.textSub, marginLeft: 12, flex: 1 }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Comparison table note */}
        <Text style={[Typography.caption, { color: colors.textMuted, textAlign: 'center', marginHorizontal: Spacing.xl, marginTop: Spacing.base }]}>
          Benefits are applied automatically at checkout. Purchased plans renew monthly. Point-based tiers don't expire.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pointsBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.base, marginBottom: Spacing.sm,
    padding: Spacing.base, borderRadius: BorderRadius.xl,
  },
  expiredBadge: {
    backgroundColor: `${Colors.error}15`,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tierCard: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.base,
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    position: 'relative',
  },
  currentCard: { borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.55)' },
  currentBadge: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  benefitsList: { gap: 8, marginBottom: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  upgradeBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 140,
  },
  claimBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  earnCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  earnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  earnIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { useNavigation } from '@react-navigation/native';
import { WalletActionEnum, walletActionConfigs, type WalletAction, EnumAliasService } from '../../constants/enums';
import { useWalletBalance, useWalletTransactions } from '../../hooks/useWalletQuery';
import { useAuth } from '../../hooks/useAuth';
import AddMoneySection from '../../components/wallet/AddMoneySection';
import SendMoneySection from '../../components/wallet/SendMoneySection';
import WithdrawMoneySection from '../../components/wallet/WithdrawMoneySection';
import TransactionItem from '../../components/wallet/TransactionItem';

function AnimatedRow({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  React.useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    y.value = withDelay(delay, withTiming(0, { duration: 400 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function WalletScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeAction, setActiveAction] = useState<WalletAction | null>(WalletActionEnum.ADD_MONEY);

  const {
    data: walletData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance();

  const {
    data: txnData,
    isLoading: txnLoading,
    refetch: refetchTxn,
  } = useWalletTransactions(1);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchTxn()]);
    setRefreshing(false);
  };

  const balance = walletData?.balance ?? 0;
  const rewardPoints = user?.rewardPoints ?? 0;
  const recentTransactions = (txnData?.data ?? []).slice(0, 5);
  const isLoading = balanceLoading && txnLoading;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
      >
        {/* Balance card */}
        <AnimatedRow delay={0}>
          <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.balanceCard}>
            <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>SwibberPay Balance</Text>
            <Text style={[Typography.display1, { color: Colors.white, marginTop: 4 }]}>
              {formatCurrency(balance)}
            </Text>
            <View style={styles.actionBtns}>
              {Object.values(walletActionConfigs).map((config) => (
                <TouchableOpacity
                  key={config.key}
                  style={[styles.quickAction, activeAction === config.key && { opacity: 0.8 }]}
                  onPress={() => setActiveAction(activeAction === config.key ? null : config.key)}
                >
                  <View style={[
                    styles.quickIcon,
                    { backgroundColor: activeAction === config.key ? Colors.white : 'rgba(255,255,255,0.2)' },
                  ]}>
                    <MaterialIcons
                      name={config.icon as any}
                      size={20}
                      color={activeAction === config.key ? Colors.primary : Colors.white}
                    />
                  </View>
                  <Text style={[Typography.captionBold, { color: 'rgba(255,255,255,0.9)', marginTop: 6 }]}>
                    {EnumAliasService.getAlias('walletAction', config.key, config.alias)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </AnimatedRow>

        {/* Rewards points */}
        <AnimatedRow delay={80}>
          <View style={[styles.rewardsCard, { backgroundColor: colors.card }]}>
            <View style={[styles.rewardsIcon, { backgroundColor: `${Colors.warning}15` }]}>
              <MaterialIcons name="stars" size={24} color={Colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.label, { color: colors.text }]}>Reward Points</Text>
              <Text style={[Typography.h4, { color: Colors.warning }]}>{rewardPoints.toLocaleString()} pts</Text>
            </View>
            <TouchableOpacity style={[styles.redeemBtn, { backgroundColor: `${Colors.warning}15` }]}>
              <Text style={[Typography.captionBold, { color: Colors.warning }]}>Redeem</Text>
            </TouchableOpacity>
          </View>
        </AnimatedRow>

        {/* Dynamic Action Section */}
        {activeAction === WalletActionEnum.ADD_MONEY && (
          <AnimatedRow delay={160}><AddMoneySection /></AnimatedRow>
        )}
        {activeAction === WalletActionEnum.SEND && (
          <AnimatedRow delay={160}><SendMoneySection /></AnimatedRow>
        )}
        {activeAction === WalletActionEnum.WITHDRAW && (
          <AnimatedRow delay={160}><WithdrawMoneySection /></AnimatedRow>
        )}

        {/* Transactions */}
        <AnimatedRow delay={240}>
          <View style={styles.txnHeader}>
            <Text style={[Typography.label, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={[Typography.label, { color: Colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
        </AnimatedRow>

        {txnLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : recentTransactions.length > 0 ? (
          recentTransactions.map((txn: any, idx: number) => (
            <AnimatedRow key={txn.id ?? idx} delay={280 + idx * 40}>
              <TransactionItem transaction={txn} />
            </AnimatedRow>
          ))
        ) : (
          <View style={styles.emptyTxn}>
            <Text style={{ fontSize: 48 }}>💸</Text>
            <Text style={[Typography.label, { color: colors.textSub, marginTop: 12 }]}>No transactions yet</Text>
            <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
              Add money to your wallet to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  balanceCard: { margin: Spacing.xl, borderRadius: BorderRadius.xl, padding: Spacing.xl },
  actionBtns: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.xl },
  quickAction: { alignItems: 'center' },
  quickIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  rewardsCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginBottom: Spacing.base,
    padding: Spacing.base, borderRadius: BorderRadius.xl,
  },
  rewardsIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  redeemBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full },
  txnHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginBottom: 10,
  },
  emptyTxn: { alignItems: 'center', paddingTop: 40 },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';

type CompleteNav = StackNavigationProp<RideStackParamList, 'RideComplete'>;
type CompleteRoute = RouteProp<RideStackParamList, 'RideComplete'>;

export default function RideCompleteScreen() {
  const navigation = useNavigation<CompleteNav>();
  const { params } = useRoute<CompleteRoute>();
  const { colors } = useTheme();

  const checkScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const stats = [
    { icon: 'payments', label: 'Fare', value: formatCurrency(params.fare) },
    { icon: 'route', label: 'Distance', value: params.distance },
    { icon: 'access-time', label: 'Duration', value: params.duration },
    { icon: 'account-balance-wallet', label: 'Paid via', value: 'UPI' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack={false} title="Ride Complete" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Success animation */}
        <Animated.View style={[styles.checkContainer, checkStyle]}>
          <LinearGradient colors={Colors.gradientSuccess as [string, string]} style={styles.checkCircle}>
            <MaterialIcons name="check" size={48} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={contentStyle}>
          <Text style={[Typography.display2, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>
            You've arrived! 🎉
          </Text>
          <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginBottom: 32 }]}>
            Thank you for riding with Swibber
          </Text>

          {/* Stats grid */}
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            {stats.map(({ icon, label, value }, i) => (
              <View key={label} style={[styles.statItem, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <MaterialIcons name={icon as any} size={20} color={Colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[Typography.caption, { color: colors.textSub }]}>{label}</Text>
                  <Text style={[Typography.labelLarge, { color: colors.text }]}>{value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Cashback earned */}
          <View style={[styles.cashbackBanner, { backgroundColor: `${Colors.success}15` }]}>
            <Text style={{ fontSize: 24 }}>💰</Text>
            <View style={{ marginLeft: 12 }}>
              <Text style={[Typography.label, { color: Colors.success }]}>₹18 cashback earned!</Text>
              <Text style={[Typography.caption, { color: colors.textSub }]}>Gold member benefit • Added to SwibberPay</Text>
            </View>
          </View>

          <Button
            label="Rate Your Ride"
            onPress={() => navigation.navigate('RideRating', { rideId: params.rideId, driverName: 'Ramesh Patil' })}
            style={{ marginTop: 24 }}
          />
          <Button
            label="Back to Home"
            onPress={() => navigation.popToTop()}
            variant="ghost"
            style={{ marginTop: 8 }}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: 40 },
  checkContainer: { alignItems: 'center', marginVertical: 32 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  statsCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, flex: 1 },
  cashbackBanner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.md },
});

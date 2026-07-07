import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParcelStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';

type CompleteNav = StackNavigationProp<ParcelStackParamList, 'ParcelComplete'>;
type CompleteRoute = RouteProp<ParcelStackParamList, 'ParcelComplete'>;

export default function ParcelCompleteScreen() {
  const navigation = useNavigation<CompleteNav>();
  const { params } = useRoute<CompleteRoute>();
  const { colors } = useTheme();

  const checkScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    contentOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack={false} title="Parcel Delivered" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Success icon */}
        <Animated.View style={[styles.checkBox, checkStyle]}>
          <LinearGradient colors={Colors.gradientParcel as [string, string]} style={styles.checkCircle}>
            <MaterialIcons name="check" size={48} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={contentStyle}>
          <Text style={[Typography.display2, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>
            Delivered! 📦
          </Text>
          <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginBottom: 24 }]}>
            Your parcel has been delivered safely
          </Text>

          {/* Details */}
          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            {[
              { icon: 'receipt', label: 'Parcel ID', value: `#${params.parcelId.slice(-8).toUpperCase()}` },
              { icon: 'schedule', label: 'Delivered at', value: '2:34 PM' },
              { icon: 'account-balance-wallet', label: 'Paid via', value: 'SwibberPay' },
              { icon: 'verified-user', label: 'Status', value: 'Verified' },
            ].map(({ icon, label, value }, i) => (
              <View key={label} style={[styles.detailRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <MaterialIcons name={icon as any} size={18} color={Colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[Typography.caption, { color: colors.textSub }]}>{label}</Text>
                  <Text style={[Typography.label, { color: colors.text }]}>{value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Rating prompt */}
          <View style={[styles.rateCard, { backgroundColor: `${Colors.primary}10` }]}>
            <Text style={{ fontSize: 24 }}>⭐</Text>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[Typography.label, { color: Colors.primary }]}>Rate this delivery</Text>
              <Text style={[Typography.caption, { color: colors.textSub }]}>Help us improve our service</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.primary} />
          </View>

          <Button
            label="Send Another Parcel"
            onPress={() => navigation.popToTop()}
            style={{ marginTop: 16 }}
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
  checkBox: { alignItems: 'center', marginVertical: 32 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  detailsCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  rateCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.md },
});

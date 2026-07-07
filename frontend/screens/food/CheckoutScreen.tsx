import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FoodStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useCart } from '../../hooks/useCart';
import { PaymentMethodEnum } from '../../constants/enums';
import { formatCurrency } from '../../utils/formatters';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useSavedAddresses } from '../../hooks/useProfileQuery';
import { FoodService } from '../../services/foodService';
import { usePayment } from '../../hooks/usePayment';

type CheckoutNav = StackNavigationProp<FoodStackParamList, 'Checkout'>;
type CheckoutRoute = RouteProp<FoodStackParamList, 'Checkout'>;

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutNav>();
  const { params } = useRoute<CheckoutRoute>();
  const { colors } = useTheme();
  const { items, restaurantId, restaurantName, clearCart } = useCart();
  const { data: savedAddresses = [] } = useSavedAddresses();

  const addresses = savedAddresses as any[];
  const firstAddressId = addresses[0]?.id ?? addresses[0]?._id ?? '';

  const PAYMENT_OPTIONS = [
    { key: PaymentMethodEnum.RAZORPAY, label: 'Razorpay', icon: 'credit-card', desc: 'Cards, UPI, Netbanking & more' },
    { key: PaymentMethodEnum.CASH, label: 'Cash on Delivery', icon: 'payments', desc: 'Pay when you receive' },
  ];

  const { openPayment, isLoading: paymentLoading } = usePayment();
  const { showDialog } = useDialog();

  const [selectedAddress, setSelectedAddress] = useState(firstAddressId);
  const [selectedPayment, setSelectedPayment] = useState<string>(PaymentMethodEnum.CASH);
  const [isPlacing, setIsPlacing] = useState(false);

  const isOnlinePayment = selectedPayment === PaymentMethodEnum.RAZORPAY;

  const handlePlace = async () => {
    if (!selectedAddress) {
      showDialog({ title: 'Select Address', message: 'Please choose a delivery address.', type: 'info' });
      return;
    }
    if (!restaurantId) {
      showDialog({ title: 'Empty Cart', message: 'Your cart is empty.', type: 'warning' });
      return;
    }
    setIsPlacing(true);
    try {
      const orderPayload = {
        restaurantId,
        items:         items.map(({ menuItemId, name, price, quantity, addons }) => ({ menuItemId, name, price, quantity, addons })),
        addressId:     selectedAddress,
        paymentMethod: selectedPayment as any,
      };
      const { orderId } = await FoodService.createOrder(orderPayload);

      if (isOnlinePayment) {
        openPayment({
          entityType:  'food',
          entityId:    orderId,
          amount:      params.total,
          description: `Food order from ${restaurantName ?? 'restaurant'}`,
          onSuccess:   () => {
            clearCart();
            navigation.replace('OrderTracking', { orderId });
          },
          onFailure:   () => {
            clearCart();
            navigation.replace('OrderTracking', { orderId });
          },
        });
      } else {
        clearCart();
        navigation.replace('OrderTracking', { orderId });
      }
    } catch (err: any) {
      showDialog({ title: 'Order Failed', message: err?.response?.data?.message ?? 'Failed to place order. Please try again.', type: 'error' });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Checkout" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Delivery address */}
        <View style={styles.sectionTitle}>
          <Text style={[Typography.label, { color: colors.text }]}>Delivery address</Text>
        </View>
        {addresses.length === 0 ? (
          <View style={[styles.optionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[Typography.caption, { color: colors.textSub }]}>No saved addresses. Add one in Profile → Saved Addresses.</Text>
          </View>
        ) : (
          addresses.slice(0, 3).map((addr: any) => {
            const id = addr.id ?? addr._id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setSelectedAddress(id)}
                style={[styles.optionRow, { backgroundColor: colors.card, borderColor: selectedAddress === id ? Colors.primary : colors.border }]}
              >
                <View style={[styles.radio, { borderColor: selectedAddress === id ? Colors.primary : colors.border }]}>
                  {selectedAddress === id && <View style={[styles.radioDot, { backgroundColor: Colors.primary }]} />}
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[Typography.label, { color: colors.text }]}>{addr.label ?? addr.type}</Text>
                  <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]} numberOfLines={2}>{addr.address}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Payment method */}
        <View style={styles.sectionTitle}>
          <Text style={[Typography.label, { color: colors.text }]}>Payment method</Text>
        </View>
        {PAYMENT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setSelectedPayment(opt.key)}
            style={[styles.optionRow, { backgroundColor: colors.card, borderColor: selectedPayment === opt.key ? Colors.primary : colors.border }]}
          >
            <View style={[styles.radio, { borderColor: selectedPayment === opt.key ? Colors.primary : colors.border }]}>
              {selectedPayment === opt.key && <View style={[styles.radioDot, { backgroundColor: Colors.primary }]} />}
            </View>
            <View style={[styles.iconBox, { backgroundColor: `${Colors.primary}15` }]}>
              <MaterialIcons name={opt.icon as any} size={20} color={Colors.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[Typography.label, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[Typography.caption, { color: colors.textSub }]}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Order summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 10 }]}>Order summary</Text>
          <View style={styles.billRow}>
            <Text style={[Typography.body, { color: colors.textSub }]}>Items + delivery + taxes</Text>
            <Text style={[Typography.labelLarge, { color: Colors.primary }]}>{formatCurrency(params.total)}</Text>
          </View>
          <View style={[styles.cashbackRow, { backgroundColor: `${Colors.success}15` }]}>
            <MaterialIcons name="redeem" size={16} color={Colors.success} />
            <Text style={[Typography.caption, { color: Colors.success, marginLeft: 6 }]}>Earn ₹12 SwibberPay cashback on this order</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place order */}
      <View style={[styles.footer, { backgroundColor: colors.surface }, Shadows.lg]}>
        <Button
          label={isPlacing || paymentLoading ? 'Processing…' : `Place Order · ${formatCurrency(params.total)}`}
          onPress={handlePlace}
          isLoading={isPlacing || paymentLoading}
          isDisabled={isPlacing || paymentLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: 10, padding: Spacing.base, borderRadius: BorderRadius.xl, borderWidth: 1.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cashbackRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.base, paddingBottom: 28, paddingHorizontal: Spacing.xl },
});

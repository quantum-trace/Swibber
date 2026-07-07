import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FoodStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatters';
import Header from '../../components/common/Header';
import CartItem from '../../components/food/CartItem';
import Button from '../../components/common/Button';

type CartNav = StackNavigationProp<FoodStackParamList, 'Cart'>;

const PROMO_CODES = ['SWIBBER50', 'FIRST100', 'GOLD20'];

export default function CartScreen() {
  const navigation = useNavigation<CartNav>();
  const { colors } = useTheme();
  const { items, restaurantName, addItem, removeItem, clearCart, subtotal, deliveryFee, taxes, grandTotal, totalItems } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [instructions, setInstructions] = useState('');

  const applyPromo = () => {
    if (PROMO_CODES.includes(promoCode.toUpperCase())) {
      const disc = promoCode.toUpperCase() === 'SWIBBER50' ? 50 : promoCode.toUpperCase() === 'FIRST100' ? 100 : Math.floor(subtotal * 0.2);
      setPromoDiscount(disc);
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
    }
  };

  if (totalItems === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title="Your Cart" />
        <View style={styles.empty}>
          <Text style={{ fontSize: 72 }}>🛒</Text>
          <Text style={[Typography.h3, { color: colors.text, marginTop: 16 }]}>Your cart is empty</Text>
          <Text style={[Typography.body, { color: colors.textSub, marginTop: 8 }]}>Add items from a restaurant</Text>
          <Button label="Explore Restaurants" onPress={() => navigation.goBack()} style={{ marginTop: 24, width: 220 }} />
        </View>
      </View>
    );
  }

  const finalTotal = grandTotal - promoDiscount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Your Cart" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Delivery address */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={18} color={Colors.primary} />
            <Text style={[Typography.label, { color: colors.text, marginLeft: 8 }]}>Delivery to</Text>
          </View>
          <Text style={[Typography.body, { color: colors.textSub, marginTop: 4 }]}>201 Bandra West, Mumbai</Text>
          <TouchableOpacity>
            <Text style={[Typography.captionBold, { color: Colors.primary, marginTop: 4 }]}>Change address →</Text>
          </TouchableOpacity>
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 4 }]}>
            {restaurantName ?? 'Order'}
          </Text>
          {items.map((item) => (
            <CartItem
              key={item.menuItemId}
              name={item.name}
              imageEmoji={item.imageEmoji}
              price={item.price}
              quantity={item.quantity}
              isVeg={item.isVeg}
              onAdd={() => addItem({ menuItemId: item.menuItemId, restaurantId: item.restaurantId, name: item.name, price: item.price, imageEmoji: item.imageEmoji, addons: item.addons, isVeg: item.isVeg }, restaurantName ?? '')}
              onRemove={() => removeItem(item.menuItemId)}
            />
          ))}
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            <Text style={[Typography.captionBold, { color: Colors.primary }]}>+ Add more items</Text>
          </TouchableOpacity>
        </View>

        {/* Cooking instructions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 8 }]}>Cooking instructions</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Any special requests? (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
            style={[styles.instrInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          />
        </View>

        {/* Promo code */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 8 }]}>Promo code</Text>
          {promoApplied ? (
            <View style={[styles.promoApplied, { backgroundColor: `${Colors.success}15` }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="local-offer" size={16} color={Colors.success} />
                <Text style={[Typography.label, { color: Colors.success }]}>{promoCode.toUpperCase()}</Text>
                <Text style={[Typography.caption, { color: Colors.success }]}>- {formatCurrency(promoDiscount)}</Text>
              </View>
              <TouchableOpacity onPress={() => { setPromoApplied(false); setPromoCode(''); setPromoDiscount(0); }}>
                <MaterialIcons name="close" size={16} color={Colors.success} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <TextInput
                value={promoCode}
                onChangeText={(t) => { setPromoCode(t); setPromoError(''); }}
                placeholder="Enter code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                style={[styles.promoInput, { backgroundColor: colors.background, color: colors.text, borderColor: promoError ? Colors.error : colors.border }]}
              />
              <TouchableOpacity onPress={applyPromo} style={[styles.applyBtn, { backgroundColor: Colors.primary }]}>
                <Text style={[Typography.captionBold, { color: Colors.white }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
          {promoError.length > 0 && (
            <Text style={[Typography.caption, { color: Colors.error, marginTop: 4 }]}>{promoError}</Text>
          )}
        </View>

        {/* Bill summary */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, marginBottom: 12 }]}>Bill details</Text>
          {[
            { label: 'Item total', value: formatCurrency(subtotal) },
            { label: 'Delivery fee', value: deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee) },
            { label: 'Taxes & charges', value: formatCurrency(taxes) },
            ...(promoApplied ? [{ label: `Promo (${promoCode.toUpperCase()})`, value: `- ${formatCurrency(promoDiscount)}`, isDiscount: true }] : []),
          ].map(({ label, value, isDiscount }) => (
            <View key={label} style={styles.billRow}>
              <Text style={[Typography.body, { color: colors.textSub }]}>{label}</Text>
              <Text style={[Typography.body, { color: isDiscount ? Colors.success : colors.text }]}>{value}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[Typography.labelLarge, { color: colors.text }]}>To pay</Text>
            <Text style={[Typography.h4, { color: Colors.primary }]}>{formatCurrency(finalTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout button */}
      <View style={[styles.footer, { backgroundColor: colors.surface }, Shadows.lg]}>
        <Button
          label={`Proceed to Checkout • ${formatCurrency(finalTotal)}`}
          onPress={() => navigation.navigate('Checkout', { total: finalTotal })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  instrInput: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.sm, height: 70, textAlignVertical: 'top' },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInput: { flex: 1, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 10 },
  applyBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.md },
  promoApplied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.base, paddingBottom: 28, paddingHorizontal: Spacing.xl },
});

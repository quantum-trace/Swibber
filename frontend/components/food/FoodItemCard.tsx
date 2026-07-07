import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

interface FoodItemCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageEmoji: string;
  isVeg: boolean;
  isPopular?: boolean;
  isBestseller?: boolean;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function FoodItemCard({
  name, description, price, originalPrice, imageEmoji, isVeg,
  isPopular, isBestseller, quantity, onAdd, onRemove,
}: FoodItemCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {/* Left: info */}
      <View style={styles.infoSection}>
        <View style={styles.topRow}>
          <View style={[styles.vegDot, { borderColor: isVeg ? Colors.success : Colors.error }]}>
            <View style={[styles.vegFill, { backgroundColor: isVeg ? Colors.success : Colors.error }]} />
          </View>
          {isBestseller && (
            <View style={[styles.badge, { backgroundColor: `${Colors.warning}20` }]}>
              <Text style={[Typography.captionBold, { color: Colors.warning, fontSize: 9 }]}>BESTSELLER</Text>
            </View>
          )}
          {isPopular && !isBestseller && (
            <View style={[styles.badge, { backgroundColor: `${Colors.primary}20` }]}>
              <Text style={[Typography.captionBold, { color: Colors.primary, fontSize: 9 }]}>POPULAR</Text>
            </View>
          )}
        </View>
        <Text style={[Typography.label, { color: colors.text, marginTop: 6 }]}>{name}</Text>
        <Text style={[Typography.caption, { color: colors.textSub, marginTop: 3 }]} numberOfLines={2}>{description}</Text>
        <View style={styles.priceRow}>
          <Text style={[Typography.labelLarge, { color: colors.text }]}>{formatCurrency(price)}</Text>
          {originalPrice && originalPrice > price && (
            <Text style={[Typography.caption, { color: colors.textMuted, textDecorationLine: 'line-through', marginLeft: 6 }]}>
              {formatCurrency(originalPrice)}
            </Text>
          )}
        </View>
      </View>

      {/* Right: emoji + qty */}
      <View style={styles.rightSection}>
        <View style={[styles.emojiBox, { backgroundColor: colors.background }]}>
          <Text style={styles.emoji}>{imageEmoji}</Text>
        </View>
        {quantity === 0 ? (
          <TouchableOpacity onPress={onAdd} style={[styles.addBtn, { backgroundColor: colors.background, borderColor: Colors.primary }]}>
            <Text style={[Typography.captionBold, { color: Colors.primary }]}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.qtyRow, { backgroundColor: Colors.primary }]}>
            <TouchableOpacity onPress={onRemove} style={styles.qtyBtn}>
              <MaterialIcons name="remove" size={16} color={Colors.white} />
            </TouchableOpacity>
            <Text style={[Typography.captionBold, { color: Colors.white }]}>{quantity}</Text>
            <TouchableOpacity onPress={onAdd} style={styles.qtyBtn}>
              <MaterialIcons name="add" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: Spacing.base, borderBottomWidth: 1, gap: 12 },
  infoSection: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vegDot: { width: 14, height: 14, borderRadius: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegFill: { width: 7, height: 7, borderRadius: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rightSection: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  emojiBox: { width: 80, height: 80, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 42 },
  addBtn: { borderWidth: 1.5, borderRadius: BorderRadius.sm, paddingHorizontal: 18, paddingVertical: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.sm, overflow: 'hidden' },
  qtyBtn: { padding: 6 },
});

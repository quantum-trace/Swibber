import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

interface CartItemProps {
  name: string;
  imageEmoji: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
  customizations?: string;
  onAdd: () => void;
  onRemove: () => void;
}

export default function CartItem({ name, imageEmoji, price, quantity, isVeg, customizations, onAdd, onRemove }: CartItemProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.vegDot, { borderColor: isVeg ? Colors.success : Colors.error }]}>
        <View style={[styles.vegFill, { backgroundColor: isVeg ? Colors.success : Colors.error }]} />
      </View>
      <Text style={styles.emoji}>{imageEmoji}</Text>
      <View style={styles.info}>
        <Text style={[Typography.label, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        {customizations && (
          <Text style={[Typography.caption, { color: colors.textMuted }]} numberOfLines={1}>{customizations}</Text>
        )}
        <Text style={[Typography.labelLarge, { color: colors.text, marginTop: 2 }]}>{formatCurrency(price * quantity)}</Text>
      </View>
      <View style={[styles.qtyRow, { backgroundColor: Colors.primary }]}>
        <TouchableOpacity onPress={onRemove} style={styles.qtyBtn}>
          <MaterialIcons name={quantity === 1 ? 'delete-outline' : 'remove'} size={15} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.captionBold, { color: Colors.white, minWidth: 16, textAlign: 'center' }]}>{quantity}</Text>
        <TouchableOpacity onPress={onAdd} style={styles.qtyBtn}>
          <MaterialIcons name="add" size={15} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, gap: 10 },
  vegDot: { width: 13, height: 13, borderRadius: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegFill: { width: 6, height: 6, borderRadius: 3 },
  emoji: { fontSize: 28, width: 36, textAlign: 'center' },
  info: { flex: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.sm, overflow: 'hidden' },
  qtyBtn: { padding: 5 },
});

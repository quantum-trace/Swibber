import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useWalletBalance } from '../../hooks/useWalletQuery';
import { formatCurrency } from '../../utils/formatters';

const SAVED_METHODS = [
  { id: '1', type: 'upi', label: 'arjun@okaxis', icon: 'payment', color: Colors.primary },
  { id: '2', type: 'card', label: 'HDFC •••• 4321', icon: 'credit-card', color: Colors.secondary },
  { id: '3', type: 'card', label: 'SBI •••• 8877', icon: 'credit-card', color: Colors.accent },
];

export default function PaymentMethodsScreen() {
  const { colors } = useTheme();
  const [defaultMethod, setDefaultMethod] = useState('1');
  const { data: walletData } = useWalletBalance();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Payment Methods" />
      <FlatList
        data={SAVED_METHODS}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* SwibberPay wallet */}
            <View style={[styles.walletCard, { backgroundColor: Colors.primary }]}>
              <View>
                <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>SwibberPay Balance</Text>
                <Text style={[Typography.h2, { color: Colors.white, marginTop: 4 }]}>{formatCurrency(walletData?.balance ?? 0)}</Text>
              </View>
              <TouchableOpacity style={[styles.addMoneyBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialIcons name="add" size={16} color={Colors.white} />
                <Text style={[Typography.captionBold, { color: Colors.white, marginLeft: 4 }]}>Add Money</Text>
              </TouchableOpacity>
            </View>

            <Text style={[Typography.label, { color: colors.textSub, marginBottom: 10 }]}>SAVED METHODS</Text>
            <Button label="+ Link New Payment Method" variant="outline" style={{ marginBottom: Spacing.base }} onPress={() => {}} />
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setDefaultMethod(item.id)}
            style={[styles.methodCard, { backgroundColor: colors.card, borderColor: defaultMethod === item.id ? Colors.primary : 'transparent' }, Shadows.sm]}
          >
            <View style={[styles.methodIcon, { backgroundColor: `${item.color}15` }]}>
              <MaterialIcons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.label, { color: colors.text }]}>{item.label}</Text>
              {defaultMethod === item.id && (
                <Text style={[Typography.caption, { color: Colors.primary }]}>Default payment method</Text>
              )}
            </View>
            <View style={styles.methodActions}>
              {defaultMethod === item.id && (
                <View style={[styles.defaultDot, { backgroundColor: Colors.primary }]}>
                  <MaterialIcons name="check" size={12} color={Colors.white} />
                </View>
              )}
              <TouchableOpacity style={{ padding: 4 }}>
                <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.xl, paddingBottom: 40 },
  walletCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  addMoneyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  methodCard: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: 12, borderWidth: 1.5 },
  methodIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  methodActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});

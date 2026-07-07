import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';
import { TransactionTypeEnum } from '../../constants/enums';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: {
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
  };
}

const TRANSACTION_ICONS: Record<string, string> = {
  [TransactionTypeEnum.CREDIT]: 'arrow-downward',
  [TransactionTypeEnum.DEBIT]: 'arrow-upward',
  [TransactionTypeEnum.REFUND]: 'replay',
  [TransactionTypeEnum.CASHBACK]: 'loyalty',
};

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const { colors } = useTheme();
  
  const isCredit = 
    transaction.type === TransactionTypeEnum.CREDIT || 
    transaction.type === TransactionTypeEnum.CASHBACK || 
    transaction.type === TransactionTypeEnum.REFUND;

  return (
    <View style={[styles.txnRow, { backgroundColor: colors.card }]}>
      <View style={[styles.txnIcon, { backgroundColor: isCredit ? `${Colors.success}15` : `${Colors.error}10` }]}>
        <MaterialIcons
          name={TRANSACTION_ICONS[transaction.type] as any}
          size={18}
          color={isCredit ? Colors.success : Colors.error}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[Typography.label, { color: colors.text }]}>{transaction.description}</Text>
        <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          {formatRelativeTime(transaction.date)}
        </Text>
      </View>
      <Text style={[Typography.labelLarge, { color: isCredit ? Colors.success : Colors.error }]}>
        {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: 10,
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

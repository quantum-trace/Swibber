import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import TransactionItem from '../../components/wallet/TransactionItem';
import { TransactionFilterEnum, transactionFilterConfigs, EnumAliasService, TransactionTypeEnum } from '../../constants/enums';
import { useWalletTransactions } from '../../hooks/useWalletQuery';
import { ActivityIndicator } from 'react-native';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [filter, setFilter] = useState<string>(TransactionFilterEnum.ALL);

  const { data: txnData, isLoading } = useWalletTransactions(1);
  const allTransactions: any[] = txnData?.data ?? [];

  const filteredTransactions = allTransactions.filter((t: any) => {
    if (filter === TransactionFilterEnum.CREDIT) {
      return t.type === TransactionTypeEnum.CREDIT || t.type === TransactionTypeEnum.CASHBACK || t.type === TransactionTypeEnum.REFUND;
    }
    if (filter === TransactionFilterEnum.DEBIT) {
      return t.type === TransactionTypeEnum.DEBIT;
    }
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: colors.text, marginLeft: 16 }]}>All Transactions</Text>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.values(transactionFilterConfigs)}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              style={[
                styles.filterBtn,
                { 
                  backgroundColor: filter === item.key ? Colors.primary : colors.card,
                  borderColor: filter === item.key ? Colors.primary : colors.border
                }
              ]}
            >
              <Text style={[
                Typography.captionBold, 
                { color: filter === item.key ? Colors.white : colors.textSub }
              ]}>
                {EnumAliasService.getAlias('transactionFilter', item.key, item.alias)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item: any) => item.id ?? item._id}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48 }}>💸</Text>
              <Text style={[Typography.label, { color: colors.textSub, marginTop: 12 }]}>No transactions found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginBottom: Spacing.lg,
  },
  filterList: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
});

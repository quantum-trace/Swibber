import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDialog } from '../../context/DialogContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useSavedAddresses, useDeleteAddress } from '../../hooks/useProfileQuery';
import { AddressTypeEnum, addressTypeConfigs } from '../../constants/enums';

type SavedAddressesNav = StackNavigationProp<ProfileStackParamList, 'SavedAddresses'>;

const ADDRESS_ICONS: Record<string, string> = {
  [AddressTypeEnum.HOME]:  'home',
  [AddressTypeEnum.WORK]:  'work',
  [AddressTypeEnum.OTHER]: 'place',
};

export default function SavedAddressesScreen() {
  const navigation = useNavigation<SavedAddressesNav>();
  const { colors }     = useTheme();
  const { showDialog } = useDialog();
  const { data: addresses = [], isLoading } = useSavedAddresses();
  const deleteAddress = useDeleteAddress();

  const removeAddress = (id: string) => {
    showDialog({
      title:   'Delete Address',
      message: 'Remove this address?',
      type:    'confirm',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAddress.mutate(id) },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Saved Addresses" />
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
      <FlatList
        data={addresses}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            label="+ Add New Address"
            variant="outline"
            style={{ marginBottom: Spacing.base }}
            onPress={() => navigation.navigate('AddAddress', {})}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={[styles.iconBox, { backgroundColor: `${Colors.primary}15` }]}>
              <MaterialIcons name={ADDRESS_ICONS[item.type] as any ?? 'place'} size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.label, { color: colors.text }]}>{item.label}</Text>
              <Text style={[Typography.caption, { color: colors.textSub, marginTop: 3 }]} numberOfLines={2}>{item.address}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('AddAddress', {
                  editAddress: { id: item.id, type: item.type, label: item.label ?? '', address: item.address, lat: item.lat, lng: item.lng },
                })}
              >
                <MaterialIcons name="edit" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => removeAddress(item.id)}>
                <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 52 }}>📍</Text>
            <Text style={[Typography.h4, { color: colors.text, marginTop: 12 }]}>No saved addresses</Text>
            <Text style={[Typography.body, { color: colors.textSub, marginTop: 6 }]}>Add your home and work addresses for quick booking</Text>
          </View>
        }
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.xl, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
});

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useLocation } from '../../hooks/useLocation';
import { usePlacesAutocomplete } from '../../hooks/usePlacesAutocomplete';
import { PlacesService, type PlaceResult } from '../../services/maps/places.service';
import { useAddAddress, useUpdateAddress } from '../../hooks/useProfileQuery';
import { AddressTypeEnum } from '../../constants/enums';

type Nav   = StackNavigationProp<ProfileStackParamList, 'AddAddress'>;
type Route = RouteProp<ProfileStackParamList, 'AddAddress'>;

const ADDRESS_TYPES = [
  { key: AddressTypeEnum.HOME,  label: 'Home',  emoji: '🏠' },
  { key: AddressTypeEnum.WORK,  label: 'Work',  emoji: '💼' },
  { key: AddressTypeEnum.OTHER, label: 'Other', emoji: '📍' },
];

interface SelectedLocation {
  display: string;
  full:    string;
  lat:     number;
  lng:     number;
}

export default function AddAddressScreen() {
  const navigation          = useNavigation<Nav>();
  const { params }          = useRoute<Route>();
  const { colors }          = useTheme();
  const { location }        = useLocation();
  const addAddress          = useAddAddress();
  const updateAddress       = useUpdateAddress();

  const editAddress = params?.editAddress;
  const isEdit      = !!editAddress;

  const [addrType,    setAddrType]    = useState<string>(editAddress?.type  ?? AddressTypeEnum.HOME);
  const [label,       setLabel]       = useState(editAddress?.label ?? '');
  const [searchText,  setSearchText]  = useState(editAddress?.address ?? '');
  const [selected,    setSelected]    = useState<SelectedLocation | null>(
    editAddress
      ? { display: editAddress.address, full: editAddress.address, lat: editAddress.lat, lng: editAddress.lng }
      : null,
  );
  const [resolving, setResolving] = useState(false);

  const searchRef = useRef<TextInput>(null);

  const { results, isLoading, saveSearch } = usePlacesAutocomplete(selected ? '' : searchText, {
    userLat:    location?.lat,
    userLng:    location?.lng,
    debounceMs: 350,
  });

  const showResults = !selected && searchText.length >= 2 && results.length > 0;

  const handleSelectPlace = useCallback(async (place: PlaceResult) => {
    Keyboard.dismiss();
    setResolving(true);
    try {
      const details = await PlacesService.getPlaceDetails(place.placeId);
      await saveSearch(place, details.lat, details.lng);
      setSearchText(place.mainText);
      setSelected({ display: place.mainText, full: place.description, lat: details.lat, lng: details.lng });
    } catch {
      setSearchText(place.mainText);
      setSelected({ display: place.mainText, full: place.description, lat: 0, lng: 0 });
    } finally {
      setResolving(false);
    }
  }, [saveSearch]);

  const handleCurrentLocation = useCallback(() => {
    if (!location) return;
    const addr = location.address ?? 'Current Location';
    setSearchText(addr);
    setSelected({ display: addr, full: addr, lat: location.lat, lng: location.lng });
  }, [location]);

  const handleSave = async () => {
    if (!selected) return;
    const defaultLabel = ADDRESS_TYPES.find((t) => t.key === addrType)?.label ?? 'Address';
    const payload = {
      type:    addrType,
      label:   label.trim() || defaultLabel,
      address: selected.full,
      lat:     selected.lat,
      lng:     selected.lng,
    };
    if (isEdit && editAddress) {
      await updateAddress.mutateAsync({ id: editAddress.id, ...payload });
    } else {
      await addAddress.mutateAsync(payload);
    }
    navigation.goBack();
  };

  const isSaving = addAddress.isPending || updateAddress.isPending;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title={isEdit ? 'Edit Address' : 'Add Address'} />

        <FlatList
          data={showResults ? results : []}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View>
              {/* Type selector */}
              <Text style={[Typography.label, { color: colors.textSub, marginBottom: 10 }]}>Address type</Text>
              <View style={styles.typeRow}>
                {ADDRESS_TYPES.map((t) => {
                  const active = addrType === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setAddrType(t.key)}
                      style={[
                        styles.typeChip,
                        {
                          borderColor:     active ? Colors.primary : colors.border,
                          backgroundColor: active ? `${Colors.primary}15` : colors.card,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                      <Text style={[Typography.captionBold, { color: active ? Colors.primary : colors.text, marginTop: 4 }]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom label */}
              <View style={{ marginTop: Spacing.base }}>
                <Input
                  label="Label (optional)"
                  value={label}
                  onChangeText={setLabel}
                  placeholder={ADDRESS_TYPES.find((t) => t.key === addrType)?.label ?? 'e.g. Mom\'s Place'}
                  leftIcon="label"
                />
              </View>

              {/* Location section */}
              <Text style={[Typography.label, { color: colors.textSub, marginBottom: 10, marginTop: 4 }]}>Location</Text>

              {/* Current location chip */}
              {location && (
                <TouchableOpacity
                  style={[styles.currentLocBtn, { backgroundColor: `${Colors.success}15` }]}
                  onPress={handleCurrentLocation}
                >
                  <MaterialIcons name="my-location" size={16} color={Colors.success} />
                  <Text style={[Typography.label, { color: Colors.success, marginLeft: 6 }]}>Use current location</Text>
                </TouchableOpacity>
              )}

              {/* Search box */}
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.card, borderColor: selected ? Colors.success : colors.border },
                  Shadows.sm,
                ]}
              >
                <MaterialIcons
                  name={selected ? 'check-circle' : 'search'}
                  size={18}
                  color={selected ? Colors.success : colors.textMuted}
                />
                <TextInput
                  ref={searchRef}
                  style={[Typography.body as object, { flex: 1, color: colors.text, marginLeft: 8 }]}
                  value={searchText}
                  onChangeText={(t) => { setSearchText(t); setSelected(null); }}
                  placeholder="Search for a location..."
                  placeholderTextColor={colors.textMuted}
                />
                {(isLoading || resolving) && <ActivityIndicator size="small" color={Colors.primary} />}
                {!isLoading && !resolving && searchText.length > 0 && !selected && (
                  <TouchableOpacity onPress={() => { setSearchText(''); setSelected(null); }}>
                    <MaterialIcons name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected address confirmation */}
              {selected && (
                <View style={[styles.selectedRow, { backgroundColor: `${Colors.success}10`, borderColor: `${Colors.success}30` }]}>
                  <MaterialIcons name="location-on" size={18} color={Colors.success} />
                  <Text style={[Typography.caption, { color: Colors.success, marginLeft: 8, flex: 1 }]} numberOfLines={2}>
                    {selected.full}
                  </Text>
                </View>
              )}

              {showResults && (
                <Text style={[Typography.label, { color: colors.textSub, marginTop: 16, marginBottom: 8, fontSize: 11 }]}>
                  SEARCH RESULTS
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectPlace(item)}
              style={[styles.resultRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.resultIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <MaterialIcons name="location-on" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[Typography.label, { color: colors.text }]} numberOfLines={1}>{item.mainText}</Text>
                <Text style={[Typography.caption, { color: colors.textSub }]} numberOfLines={1}>{item.secondaryText}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        <View style={[styles.footer, { backgroundColor: colors.surface }, Shadows.lg]}>
          <Button
            label={isEdit ? 'Update Address' : 'Save Address'}
            onPress={handleSave}
            isLoading={isSaving}
            isDisabled={!selected || isSaving}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  scrollContent:  { padding: Spacing.xl, paddingBottom: 120 },
  typeRow:        { flexDirection: 'row', gap: 10 },
  typeChip:       { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: BorderRadius.xl, borderWidth: 1.5 },
  currentLocBtn:  {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: 12,
  },
  searchBox:      {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: BorderRadius.xl, borderWidth: 1.5,
  },
  selectedRow:    {
    flexDirection: 'row', alignItems: 'flex-start',
    marginTop: 8, padding: 10,
    borderRadius: BorderRadius.md, borderWidth: 1,
  },
  resultRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5 },
  resultIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.base, paddingBottom: 28, paddingHorizontal: Spacing.xl },
});

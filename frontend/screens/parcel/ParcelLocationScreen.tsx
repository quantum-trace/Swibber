import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Keyboard,
} from 'react-native';
import { Map, Camera, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParcelStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useLocation } from '../../hooks/useLocation';
import { usePlacesAutocomplete } from '../../hooks/usePlacesAutocomplete';
import { PlacesService, type PlaceResult, type RecentSearch } from '../../services/maps/places.service';
import { useSavedAddresses } from '../../hooks/useProfileQuery';
import { addressTypeConfigs } from '../../constants/enums';
import { formatAddress } from '../../utils/addressFormatter';
import { LocationPin } from '../../components/maps/LocationPin';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [72.877, 19.076];

type LocationNav   = StackNavigationProp<ParcelStackParamList, 'ParcelLocation'>;
type LocationRoute = RouteProp<ParcelStackParamList, 'ParcelLocation'>;

type ActiveField = 'pickup' | 'dropoff';

interface ResolvedLocation {
  display: string;
  full:    string;
  lat:     number;
  lng:     number;
}

export default function ParcelLocationScreen() {
  const navigation = useNavigation<LocationNav>();
  const { params } = useRoute<LocationRoute>();
  const { colors } = useTheme();
  const { location } = useLocation();

  // ── Address state ────────────────────────────────────────────────
  const [pickupText,     setPickupText]     = useState('');
  const [dropoffText,    setDropoffText]    = useState('');
  const [activeField,    setActiveField]    = useState<ActiveField>('pickup');
  const [resolvedPickup, setResolvedPickup] = useState<ResolvedLocation | null>(null);
  const [resolvedDropoff,setResolvedDropoff]= useState<ResolvedLocation | null>(null);
  const [resolving,      setResolving]      = useState(false);

  // ── Map state (Phase 2) ──────────────────────────────────────────
  const [confirmPhase, setConfirmPhase] = useState(false);
  const [isGeocoding,  setIsGeocoding]  = useState(false);

  const pickupRef      = useRef<TextInput>(null);
  const dropoffRef     = useRef<TextInput>(null);
  const cameraRef      = useRef<CameraRef>(null);
  const geocodeIdRef   = useRef(0);
  const geoIsBusy      = useRef(false);
  const geocodeCache   = useRef<Record<string, string>>({});

  const canProceed  = pickupText.length > 0 && dropoffText.length > 0;
  const activeQuery = activeField === 'pickup' ? pickupText : dropoffText;

  const { results, recentSearches, isLoading, saveSearch } = usePlacesAutocomplete(activeQuery, {
    userLat:    location?.lat,
    userLng:    location?.lng,
    debounceMs: 350,
  });

  const { data: savedAddresses = [] } = useSavedAddresses();

  // Pre-fill pickup from GPS on first mount
  useEffect(() => {
    if (location && !resolvedPickup && pickupText === '') {
      const addr = location.address ?? 'Current Location';
      setPickupText(addr);
      setResolvedPickup({ display: addr, full: addr, lat: location.lat, lng: location.lng });
      setActiveField('dropoff');
      setTimeout(() => dropoffRef.current?.focus(), 300);
    }
  }, [location]);

  // Fires once after map fully settles — geocode every settle (initial + user drags)
  const doGeocode = useCallback(async (event: any) => {
    const id = ++geocodeIdRef.current;
    try {
      // MapLibre v11: NativeSyntheticEvent<ViewStateChangeEvent>
      // center is [lng, lat] at event.nativeEvent.center
      const center = event?.nativeEvent?.center as [number, number] | undefined;
      if (!center || !Number.isFinite(center[0]) || !Number.isFinite(center[1])) {
        return;
      }
      const [lng, lat] = center;
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const cached = geocodeCache.current[key];
      if (cached) {
        if (geocodeIdRef.current !== id) return;
        setPickupText(cached);
        setResolvedPickup({ display: cached, full: cached, lat, lng });
        return;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SwibberApp/1.0' } },
      );
      const data = await res.json();
      if (geocodeIdRef.current !== id) return;
      const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      geocodeCache.current[key] = address;
      setPickupText(address);
      setResolvedPickup({ display: address, full: address, lat, lng });
    } catch {
      // keep previous on error
    } finally {
      if (geocodeIdRef.current === id) {
        geoIsBusy.current = false;
        setIsGeocoding(false);
      }
    }
  }, []);

  // Fires every frame during drag — only show the spinner, geocode happens on onRegionDidChange
  const handleRegionIsChanging = useCallback(() => {
    if (!geoIsBusy.current) { geoIsBusy.current = true; setIsGeocoding(true); }
  }, []);

  const commitPlace = useCallback((resolved: ResolvedLocation, field: ActiveField) => {
    if (field === 'pickup') {
      setPickupText(resolved.display);
      setResolvedPickup(resolved);
      setActiveField('dropoff');
      setTimeout(() => dropoffRef.current?.focus(), 200);
    } else {
      setDropoffText(resolved.display);
      setResolvedDropoff(resolved);
      Keyboard.dismiss();
    }
  }, []);

  const handleSelectPlace = useCallback(async (place: PlaceResult) => {
    Keyboard.dismiss();
    setResolving(true);
    try {
      const details = await PlacesService.getPlaceDetails(place.placeId);
      await saveSearch(place, details.lat, details.lng);
      commitPlace(
        { display: place.mainText, full: place.description, lat: details.lat, lng: details.lng },
        activeField,
      );
    } catch {
      commitPlace({ display: place.mainText, full: place.description, lat: 0, lng: 0 }, activeField);
    } finally {
      setResolving(false);
    }
  }, [activeField, commitPlace, saveSearch]);

  const handleSelectRecent = useCallback((recent: RecentSearch) => {
    commitPlace(
      { display: recent.mainText, full: recent.description, lat: recent.lat ?? 0, lng: recent.lng ?? 0 },
      activeField,
    );
  }, [activeField, commitPlace]);

  const handleSelectSaved = useCallback((addr: any) => {
    commitPlace(
      { display: addr.label ?? addr.address, full: addr.address, lat: addr.lat ?? 0, lng: addr.lng ?? 0 },
      activeField,
    );
  }, [activeField, commitPlace]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!location) return;
    const addr = location.address ?? 'Current Location';
    commitPlace({ display: addr, full: addr, lat: location.lat, lng: location.lng }, activeField);
  }, [location, activeField, commitPlace]);

  const enterConfirmPhase = () => {
    Keyboard.dismiss();
    setConfirmPhase(true);
  };

  const editPickup = () => {
    setConfirmPhase(false);
    setPickupText('');
    setResolvedPickup(null);
    setActiveField('pickup');
    setTimeout(() => pickupRef.current?.focus(), 150);
  };

  const editDropoff = () => {
    setConfirmPhase(false);
    setDropoffText('');
    setResolvedDropoff(null);
    setActiveField('dropoff');
    setTimeout(() => dropoffRef.current?.focus(), 150);
  };

  const handleBook = () => {
    navigation.navigate('ParcelDetails', {
      pickup:       resolvedPickup?.display  ?? pickupText,
      pickupFull:   resolvedPickup?.full     ?? pickupText,
      dropoff:      resolvedDropoff?.display ?? dropoffText,
      dropoffFull:  resolvedDropoff?.full    ?? dropoffText,
      selectedType: params?.selectedType,
      pickupLat:    resolvedPickup?.lat,
      pickupLng:    resolvedPickup?.lng,
      dropLat:      resolvedDropoff?.lat,
      dropLng:      resolvedDropoff?.lng,
    });
  };

  const showingResults = activeQuery.length >= 2 && results.length > 0;
  const showingRecent  = !showingResults && recentSearches.length > 0;
  const showingSaved   = !showingResults && !showingRecent && (savedAddresses as any[]).length > 0;
  const listData: any[] = showingResults ? results : showingRecent ? recentSearches : showingSaved ? (savedAddresses as any[]) : [];

  const pickupMapCenter: [number, number] = resolvedPickup
    ? [resolvedPickup.lng, resolvedPickup.lat]
    : location
    ? [location.lng, location.lat]
    : DEFAULT_CENTER;

  // ── Phase 2: Map pin confirmation ────────────────────────────────
  if (confirmPhase) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          showBack
          title="Pin Your Pickup"
          onBack={() => setConfirmPhase(false)}
        />

        {/* Compact address card */}
        <View style={[styles.compactCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <TouchableOpacity style={styles.compactRow} onPress={editPickup} activeOpacity={0.7}>
            <View style={[styles.pinDot, { backgroundColor: Colors.success }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[Typography.captionBold, { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>PICKUP</Text>
              {isGeocoding ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color={Colors.success} />
                  <Text style={[Typography.caption, { color: colors.textSub }]}>Locating…</Text>
                </View>
              ) : (
                <Text style={[Typography.body, { color: colors.text }]} numberOfLines={2}>
                  {resolvedPickup?.full ?? pickupText}
                </Text>
              )}
            </View>
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.compactConnector}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.connectorDot, { backgroundColor: colors.border }]} />
            ))}
          </View>

          <TouchableOpacity style={styles.compactRow} onPress={editDropoff} activeOpacity={0.7}>
            <View style={[styles.pinDot, { backgroundColor: Colors.error }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[Typography.captionBold, { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>DROP-OFF</Text>
              <Text style={[Typography.body, { color: colors.text }]} numberOfLines={2}>
                {resolvedDropoff?.full ?? dropoffText}
              </Text>
            </View>
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <Map
            style={StyleSheet.absoluteFill}
            mapStyle={MAP_STYLE}
            onRegionIsChanging={handleRegionIsChanging}
            onRegionDidChange={doGeocode}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{ center: pickupMapCenter, zoom: 16 }}
            />
            <UserLocation visible animated />
            {resolvedDropoff?.lat && resolvedDropoff?.lng && (
              <LocationPin
                id="dropoff-pin"
                lat={resolvedDropoff.lat}
                lng={resolvedDropoff.lng}
                color={Colors.error}
              />
            )}
          </Map>

          {/* Floating hint */}
          <View style={styles.mapHintRow} pointerEvents="none">
            <View style={[styles.mapHint, { backgroundColor: colors.card }, Shadows.sm]}>
              <MaterialIcons name="open-with" size={14} color={Colors.primary} />
              <Text style={[Typography.captionBold, { color: colors.text, marginLeft: 6 }]}>
                Drag map to fine-tune pickup
              </Text>
            </View>
          </View>

          {/* Map pin overlay — dot+stem, stem tip sits at map center */}
          <View style={styles.pinOverlay} pointerEvents="none">
            <View style={[styles.pinDotCenter, { backgroundColor: Colors.primary }]} />
            <View style={[styles.pinStem, { backgroundColor: Colors.primary }]} />
          </View>
          <View style={styles.pinShadowOverlay} pointerEvents="none">
            <View style={styles.pinShadowDot} />
          </View>
        </View>

        {/* Book button */}
        <View style={[styles.footer, { backgroundColor: colors.surface }, Shadows.lg]}>
          <Button label="Set Package Details →" onPress={handleBook} />
        </View>
      </View>
    );
  }

  // ── Phase 1: Address input ────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Pickup & Drop" />

      {/* Address inputs */}
      <View style={[styles.inputCard, { backgroundColor: colors.card }, Shadows.sm]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.inputRow, { backgroundColor: colors.background }, activeField === 'pickup' && styles.inputRowGreen]}
          onPress={() => { setActiveField('pickup'); setTimeout(() => pickupRef.current?.focus(), 100); }}
        >
          <View style={[styles.pinDot, { backgroundColor: Colors.success }]} />
          <TextInput
            ref={pickupRef}
            value={pickupText}
            onChangeText={(t) => { setPickupText(t); if (resolvedPickup) setResolvedPickup(null); }}
            onFocus={() => setActiveField('pickup')}
            placeholder="Pickup location"
            placeholderTextColor={colors.textMuted}
            style={[styles.textInput, { color: colors.text }]}
            returnKeyType="next"
            onSubmitEditing={() => { setActiveField('dropoff'); dropoffRef.current?.focus(); }}
          />
          {activeField === 'pickup' && isLoading && (
            <ActivityIndicator size="small" color={colors.textMuted} />
          )}
          {activeField === 'pickup' && !isLoading && pickupText.length > 0 && (
            <TouchableOpacity onPress={() => { setPickupText(''); setResolvedPickup(null); }}>
              <MaterialIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.connector}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.connectorDot, { backgroundColor: colors.border }]} />
          ))}
        </View>

        <View
          style={[styles.inputRow, { backgroundColor: colors.background }, activeField === 'dropoff' && styles.inputRowRed]}
        >
          <View style={[styles.pinDot, { backgroundColor: Colors.error }]} />
          <TextInput
            ref={dropoffRef}
            value={dropoffText}
            onChangeText={(t) => { setDropoffText(t); if (resolvedDropoff) setResolvedDropoff(null); }}
            onFocus={() => setActiveField('dropoff')}
            placeholder="Drop-off location"
            placeholderTextColor={colors.textMuted}
            style={[styles.textInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {resolving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : activeField === 'dropoff' && isLoading ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : activeField === 'dropoff' && dropoffText.length > 0 ? (
            <TouchableOpacity onPress={() => { setDropoffText(''); setResolvedDropoff(null); }}>
              <MaterialIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* GPS chip */}
      {location && (
        <TouchableOpacity
          style={[styles.currentLocBtn, { backgroundColor: `${Colors.success}15` }]}
          onPress={handleUseCurrentLocation}
        >
          <MaterialIcons name="my-location" size={16} color={Colors.success} />
          <Text style={[Typography.label, { color: Colors.success, marginLeft: 6 }]}>
            Use current location{activeField === 'pickup' ? ' for pickup' : ' for drop-off'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Results list */}
      <FlatList
        data={listData}
        keyExtractor={(item: any, i) => item.placeId ?? item._id ?? String(i)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          listData.length > 0 ? (
            <Text style={[Typography.label, { color: colors.textSub, marginBottom: 8, fontSize: 11, letterSpacing: 0.6 }]}>
              {showingResults ? 'RESULTS' : showingRecent ? 'RECENT' : 'SAVED PLACES'}
            </Text>
          ) : null
        }
        renderItem={({ item }: { item: any }) => {
          if (showingResults) {
            const place = item as PlaceResult;
            return (
              <TouchableOpacity
                onPress={() => handleSelectPlace(place)}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.iconBox, { backgroundColor: `${Colors.primary}15` }]}>
                  <MaterialIcons name="location-on" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.label, { color: colors.text }]} numberOfLines={1}>{place.mainText}</Text>
                  <Text style={[Typography.caption, { color: colors.textSub }]} numberOfLines={1}>{formatAddress(place.secondaryText)}</Text>
                </View>
                <MaterialIcons name="north-east" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          }
          if (showingRecent) {
            const recent = item as RecentSearch;
            return (
              <TouchableOpacity
                onPress={() => handleSelectRecent(recent)}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.iconBox, { backgroundColor: `${Colors.accent}15` }]}>
                  <MaterialIcons name="history" size={20} color={Colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.label, { color: colors.text }]} numberOfLines={1}>{recent.mainText}</Text>
                  <Text style={[Typography.caption, { color: colors.textSub }]} numberOfLines={1}>{formatAddress(recent.secondaryText)}</Text>
                </View>
              </TouchableOpacity>
            );
          }
          const addr = item as any;
          const addrConfig = addressTypeConfigs[addr.type as keyof typeof addressTypeConfigs];
          return (
            <TouchableOpacity
              onPress={() => handleSelectSaved(addr)}
              style={[styles.row, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${Colors.primary}15` }]}>
                <Text style={{ fontSize: 20 }}>{addrConfig?.emoji ?? '📍'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.label, { color: colors.text }]}>{addr.label ?? addrConfig?.label}</Text>
                <Text style={[Typography.caption, { color: colors.textSub }]} numberOfLines={1}>{formatAddress(addr.address)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Confirm locations button — appears when both fields filled */}
      {canProceed && (
        <View style={[styles.footer, { backgroundColor: colors.surface }, Shadows.lg]}>
          <Button label="Confirm Locations →" onPress={enterConfirmPhase} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  // Phase 1
  inputCard:        { marginHorizontal: Spacing.xl, marginVertical: Spacing.base, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  inputRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: 'transparent' },
  inputRowGreen:    { borderColor: Colors.success },
  inputRowRed:      { borderColor: Colors.error },
  pinDot:           { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  textInput:        { flex: 1, paddingVertical: 2, fontSize: 15 },
  connector:        { flexDirection: 'column', alignItems: 'center', marginLeft: 19, gap: 3, paddingVertical: 4 },
  connectorDot:     { width: 2, height: 4, borderRadius: 1 },
  currentLocBtn:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  list:             { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: 120 },
  row:              { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  iconBox:          { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer:           { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.base, paddingBottom: 28, paddingHorizontal: Spacing.xl },
  // Phase 2
  compactCard:      { marginHorizontal: Spacing.xl, marginVertical: Spacing.sm, borderRadius: BorderRadius.xl, overflow: 'hidden', paddingVertical: 4 },
  compactRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  compactConnector: { flexDirection: 'column', alignItems: 'center', marginLeft: 25, gap: 3, paddingVertical: 2 },
  mapContainer:     { flex: 1, overflow: 'hidden' },
  mapHintRow:       { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  mapHint:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  // Pin overlay — dot sits above center, stem tip lands at 50% (map center coord)
  pinOverlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%', alignItems: 'center', justifyContent: 'flex-end' },
  pinShadowOverlay:{ position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' },
  pinDotCenter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  pinStem:      { width: 2.5, height: 14 },
  pinShadowDot: { width: 8, height: 4, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)' },
});

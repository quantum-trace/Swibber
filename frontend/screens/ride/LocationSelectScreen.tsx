import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, TextInput, Keyboard,
} from 'react-native';
import { Map, Camera, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import { usePlacesAutocomplete } from '../../hooks/usePlacesAutocomplete';
import { PlacesService, type PlaceResult, type RecentSearch } from '../../services/maps/places.service';
import { useSavedAddresses } from '../../hooks/useProfileQuery';
import { addressTypeConfigs } from '../../constants/enums';
import { formatAddress } from '../../utils/addressFormatter';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { LocationPin } from '../../components/maps/LocationPin';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [72.877, 19.076];

type LocationNav = StackNavigationProp<RideStackParamList, 'LocationSelect'>;

type ActiveField = 'pickup' | 'destination';

interface SelectedLocation {
  address: string;
  lat: number;
  lng: number;
}

export default function LocationSelectScreen() {
  const navigation = useNavigation<LocationNav>();
  const { colors } = useTheme();
  const { location } = useLocation();

  // ── Address state ────────────────────────────────────────────────
  const [pickupText, setPickupText]   = useState(location?.address ?? 'Current Location');
  const [destText,   setDestText]     = useState('');
  const [activeField, setActiveField] = useState<ActiveField>('destination');
  const [pickedPickup, setPickedPickup] = useState<SelectedLocation | null>(
    location ? { address: location.address ?? 'Current Location', lat: location.lat, lng: location.lng } : null,
  );
  const [pickedDest, setPickedDest] = useState<SelectedLocation | null>(null);
  const [resolving,  setResolving]  = useState(false);

  // ── Map state (Phase 2) ──────────────────────────────────────────
  const [confirmPhase, setConfirmPhase] = useState(false);
  const [isGeocoding,  setIsGeocoding]  = useState(false);

  const destInputRef   = useRef<TextInput>(null);
  const pickupInputRef = useRef<TextInput>(null);
  const cameraRef      = useRef<CameraRef>(null);
  const geocodeIdRef   = useRef(0);
  const geoIsBusy      = useRef(false);
  const geocodeCache   = useRef<Record<string, string>>({});

  const canProceed  = pickupText.length > 0 && destText.length > 0;
  const activeQuery = activeField === 'destination' ? destText : pickupText;

  const { results, recentSearches, isLoading, saveSearch } = usePlacesAutocomplete(activeQuery, {
    userLat: location?.lat,
    userLng: location?.lng,
    debounceMs: 350,
  });

  const { data: savedAddresses = [] } = useSavedAddresses();

  useEffect(() => {
    if (location && !pickedPickup) {
      setPickupText(location.address ?? 'Current Location');
      setPickedPickup({ address: location.address ?? 'Current Location', lat: location.lat, lng: location.lng });
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
        setPickedPickup({ address: cached, lat, lng });
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
      setPickedPickup({ address, lat, lng });
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

  const handleSelectPlace = useCallback(async (place: PlaceResult) => {
    setResolving(true);
    Keyboard.dismiss();
    try {
      const details = await PlacesService.getPlaceDetails(place.placeId);
      await saveSearch(place, details.lat, details.lng);

      if (activeField === 'destination') {
        setDestText(place.mainText);
        setPickedDest({ address: place.description, lat: details.lat, lng: details.lng });
        if (!pickedPickup) {
          setActiveField('pickup');
          setTimeout(() => pickupInputRef.current?.focus(), 200);
        }
      } else {
        setPickupText(place.mainText);
        setPickedPickup({ address: place.description, lat: details.lat, lng: details.lng });
        if (!pickedDest) {
          setActiveField('destination');
          setTimeout(() => destInputRef.current?.focus(), 200);
        }
      }
    } catch {
      if (activeField === 'destination') {
        setDestText(place.mainText);
        setPickedDest({ address: place.description, lat: 0, lng: 0 });
      }
    } finally {
      setResolving(false);
    }
  }, [activeField, pickedPickup, pickedDest, saveSearch]);

  const handleSelectRecent = useCallback((recent: RecentSearch) => {
    if (activeField === 'destination') {
      setDestText(recent.mainText);
      setPickedDest({ address: recent.description, lat: recent.lat ?? 0, lng: recent.lng ?? 0 });
    } else {
      setPickupText(recent.mainText);
      setPickedPickup({ address: recent.description, lat: recent.lat ?? 0, lng: recent.lng ?? 0 });
    }
  }, [activeField]);

  const handleSavedAddress = useCallback((addr: any) => {
    if (activeField === 'destination') {
      setDestText(addr.label ?? addr.address);
      setPickedDest({ address: addr.label ?? addr.address, lat: addr.lat, lng: addr.lng });
    } else {
      setPickupText(addr.label ?? addr.address);
      setPickedPickup({ address: addr.label ?? addr.address, lat: addr.lat, lng: addr.lng });
    }
  }, [activeField]);

  const enterConfirmPhase = () => {
    Keyboard.dismiss();
    setConfirmPhase(true);
  };

  const editPickup = () => {
    setConfirmPhase(false);
    setPickupText('');
    setPickedPickup(null);
    setActiveField('pickup');
    setTimeout(() => pickupInputRef.current?.focus(), 150);
  };

  const editDest = () => {
    setConfirmPhase(false);
    setDestText('');
    setPickedDest(null);
    setActiveField('destination');
    setTimeout(() => destInputRef.current?.focus(), 150);
  };

  const handleBook = () => {
    navigation.navigate('VehicleSelect', {
      pickup:      pickedPickup?.address ?? pickupText,
      destination: pickedDest?.address   ?? destText,
      pickupLat:   pickedPickup?.lat,
      pickupLng:   pickedPickup?.lng,
      destLat:     pickedDest?.lat,
      destLng:     pickedDest?.lng,
    });
  };

  const showingResults = activeQuery.length >= 2 && results.length > 0;
  const showingRecent  = !showingResults && recentSearches.length > 0;
  const showingSaved   = !showingResults && savedAddresses.length > 0;
  const listData: any[] = showingResults ? results : showingRecent ? recentSearches : showingSaved ? (savedAddresses as any[]) : [];

  const pickupMapCenter: [number, number] = pickedPickup
    ? [pickedPickup.lng, pickedPickup.lat]
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
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[Typography.captionBold, { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>PICKUP</Text>
              {isGeocoding ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color={Colors.success} />
                  <Text style={[Typography.caption, { color: colors.textSub }]}>Locating…</Text>
                </View>
              ) : (
                <Text style={[Typography.body, { color: colors.text }]} numberOfLines={2}>
                  {pickedPickup?.address ?? pickupText}
                </Text>
              )}
            </View>
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.compactDivider}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.connectorDot, { backgroundColor: colors.border }]} />
            ))}
          </View>

          <TouchableOpacity style={styles.compactRow} onPress={editDest} activeOpacity={0.7}>
            <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[Typography.captionBold, { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>DESTINATION</Text>
              <Text style={[Typography.body, { color: colors.text }]} numberOfLines={2}>
                {pickedDest?.address ?? destText}
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
            {pickedDest?.lat && pickedDest?.lng && (
              <LocationPin
                id="dest-pin"
                lat={pickedDest.lat}
                lng={pickedDest.lng}
                color={Colors.primary}
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

          {/* Map pin overlay — dot+stem, stem tip lands at map center */}
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
          <Button label="Book Ride →" onPress={handleBook} />
        </View>
      </View>
    );
  }

  // ── Phase 1: Address input ────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Set Location" />

      {/* Input section */}
      <View style={[styles.inputCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
        {/* Pickup */}
        <TouchableOpacity
          style={[styles.inputRow, activeField === 'pickup' && { borderColor: Colors.success, borderWidth: 1.5 }, { backgroundColor: colors.background }]}
          onPress={() => { setActiveField('pickup'); setTimeout(() => pickupInputRef.current?.focus(), 100); }}
          activeOpacity={0.9}
        >
          <View style={[styles.dot, { backgroundColor: Colors.success }]} />
          <TextInput
            ref={pickupInputRef}
            style={[Typography.body as object, { color: colors.text, flex: 1 }]}
            value={pickupText}
            onChangeText={(t) => { setPickupText(t); setPickedPickup(null); }}
            placeholder="Pickup location"
            placeholderTextColor={colors.textMuted}
            onFocus={() => setActiveField('pickup')}
            returnKeyType="next"
            onSubmitEditing={() => { setActiveField('destination'); destInputRef.current?.focus(); }}
          />
          {activeField === 'pickup' && isLoading && (
            <ActivityIndicator size="small" color={colors.textMuted} />
          )}
          {activeField === 'pickup' && !isLoading && pickupText.length > 0 && (
            <TouchableOpacity onPress={() => { setPickupText(''); setPickedPickup(null); }}>
              <MaterialIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Destination */}
        <View
          style={[styles.inputRow, activeField === 'destination' && { borderColor: Colors.primary, borderWidth: 1.5 }, { backgroundColor: colors.background }]}
        >
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <TextInput
            ref={destInputRef}
            style={[Typography.body as object, { color: colors.text, flex: 1 }]}
            value={destText}
            onChangeText={(t) => { setDestText(t); setPickedDest(null); }}
            placeholder="Where to?"
            placeholderTextColor={colors.textMuted}
            autoFocus
            onFocus={() => setActiveField('destination')}
            returnKeyType="search"
          />
          {resolving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : activeField === 'destination' && isLoading ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : destText.length > 0 ? (
            <TouchableOpacity onPress={() => { setDestText(''); setPickedDest(null); }}>
              <MaterialIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Use current location chip */}
      {location && activeField === 'pickup' && (
        <TouchableOpacity
          style={[styles.currentLocBtn, { backgroundColor: `${Colors.success}15` }]}
          onPress={() => {
            const addr = location.address ?? 'Current Location';
            setPickupText(addr);
            setPickedPickup({ address: addr, lat: location.lat, lng: location.lng });
            setActiveField('destination');
            setTimeout(() => destInputRef.current?.focus(), 100);
          }}
        >
          <MaterialIcons name="my-location" size={16} color={Colors.success} />
          <Text style={[Typography.label, { color: Colors.success, marginLeft: 6 }]}>Use current location</Text>
        </TouchableOpacity>
      )}

      {/* Results list */}
      <FlatList
        data={listData}
        keyExtractor={(item: any, i) => item.placeId ?? item._id ?? String(i)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {showingResults && <Text style={[Typography.label, { color: colors.textSub, marginBottom: 8 }]}>RESULTS</Text>}
            {showingRecent  && <Text style={[Typography.label, { color: colors.textSub, marginBottom: 8 }]}>RECENT</Text>}
            {showingSaved && !showingRecent && <Text style={[Typography.label, { color: colors.textSub, marginBottom: 8 }]}>SAVED PLACES</Text>}
          </>
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
              onPress={() => handleSavedAddress(addr)}
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

      {/* Confirm button — appears when both fields filled */}
      {canProceed && (
        <View style={[styles.footer, { backgroundColor: colors.surface }, Shadows.lg]}>
          <Button label="Confirm Locations →" onPress={enterConfirmPhase} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  // Phase 1
  inputCard:      { margin: Spacing.base, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'transparent',
  },
  dot:            { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  divider:        { height: 1, marginHorizontal: 14 },
  currentLocBtn:  {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.base, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start',
  },
  list:           { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 120 },
  row:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  iconBox:        { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.base, paddingBottom: 28, paddingHorizontal: Spacing.base },
  // Phase 2
  compactCard:    { marginHorizontal: Spacing.base, marginVertical: Spacing.sm, borderRadius: BorderRadius.xl, overflow: 'hidden', paddingVertical: 4 },
  compactRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  compactDivider: { flexDirection: 'column', alignItems: 'center', marginLeft: 24, gap: 3, paddingVertical: 2 },
  connectorDot:   { width: 2, height: 4, borderRadius: 1 },
  mapContainer:   { flex: 1, overflow: 'hidden' },
  mapHintRow:     { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  mapHint:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  // Pin overlay — dot sits above center, stem tip lands at 50% (map center coord)
  pinOverlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%', alignItems: 'center', justifyContent: 'flex-end' },
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

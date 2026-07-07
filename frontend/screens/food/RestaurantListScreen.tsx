import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FoodStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useDebounce } from '../../hooks/useDebounce';
import { useRestaurants } from '../../hooks/useFoodQuery';
import Header from '../../components/common/Header';
import RestaurantCard from '../../components/food/RestaurantCard';
import { ListSkeleton } from '../../components/common/SkeletonLoader';

type ListNav = StackNavigationProp<FoodStackParamList, 'RestaurantList'>;
type ListRoute = RouteProp<FoodStackParamList, 'RestaurantList'>;

const FILTERS = ['All', 'Veg', 'Under ₹200', 'Free delivery', 'Open now', 'Rating 4+'];

export default function RestaurantListScreen() {
  const navigation = useNavigation<ListNav>();
  const { params } = useRoute<ListRoute>();
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  const { data: rawAllRestaurants, isLoading, refetch } = useRestaurants(undefined, debouncedQuery || undefined);
  const allRestaurants = Array.isArray(rawAllRestaurants) ? rawAllRestaurants : [];

  useEffect(() => {
    if (params?.searchFocus) setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filtered = allRestaurants.filter((r: any) => {
    return activeFilter === 'All' ? true :
      activeFilter === 'Open now'       ? r.isOpen :
      activeFilter === 'Free delivery'  ? r.deliveryFee === 0 :
      activeFilter === 'Rating 4+'      ? r.rating >= 4 :
      true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Restaurants" showBack />

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search restaurants or food..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialIcons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyExtractor={(f) => f}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveFilter(item)}
            style={[styles.chip, { backgroundColor: activeFilter === item ? Colors.primary : colors.card, borderColor: activeFilter === item ? Colors.primary : colors.border }]}
          >
            <Text style={[Typography.captionBold, { color: activeFilter === item ? Colors.white : colors.textSub }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <ListSkeleton count={4} style={{ paddingHorizontal: Spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <RestaurantCard
              {...item}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 52 }}>🔍</Text>
              <Text style={[Typography.h4, { color: colors.text, marginTop: 12 }]}>No results found</Text>
              <Text style={[Typography.body, { color: colors.textSub, marginTop: 6 }]}>Try different keywords</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginVertical: Spacing.base, padding: Spacing.base, borderRadius: BorderRadius.full, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1 },
  filterRow: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80 },
});

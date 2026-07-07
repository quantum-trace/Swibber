import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FoodStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { CuisineTypeEnum, type CuisineType } from '../../constants/enums';
import { useRestaurants } from '../../hooks/useFoodQuery';
import Header from '../../components/common/Header';
import RestaurantCard from '../../components/food/RestaurantCard';
import Button from '../../components/common/Button';
import { useCart } from '../../hooks/useCart';

type FoodNav = StackNavigationProp<FoodStackParamList, 'FoodHome'>;

const CUISINE_FILTERS = [
  { key: 'all', label: 'All', emoji: '🍽️' },
  { key: CuisineTypeEnum.NORTH_INDIAN, label: 'North Indian', emoji: '🍛' },
  { key: CuisineTypeEnum.SOUTH_INDIAN, label: 'South Indian', emoji: '🥞' },
  { key: CuisineTypeEnum.CHINESE, label: 'Chinese', emoji: '🍜' },
  { key: CuisineTypeEnum.PIZZA, label: 'Pizza', emoji: '🍕' },
  { key: CuisineTypeEnum.BURGER, label: 'Burger', emoji: '🍔' },
  { key: CuisineTypeEnum.BIRYANI, label: 'Biryani', emoji: '🍚' },
  { key: CuisineTypeEnum.DESSERTS, label: 'Desserts', emoji: '🍰' },
];

const SORT_OPTIONS = ['Relevance', 'Rating', 'Delivery time', 'Price (Low to High)'];

function AnimatedRow({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  React.useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    y.value = withDelay(delay, withTiming(0, { duration: 400 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function FoodHomeScreen() {
  const navigation = useNavigation<FoodNav>();
  const { colors } = useTheme();
  const [activeCuisine, setActiveCuisine] = useState('all');
  const [activeSort, setActiveSort] = useState('Relevance');
  const [refreshing, setRefreshing] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const { totalItems, subtotal } = useCart();

  const cuisineFilter = activeCuisine === 'all' ? null : activeCuisine as CuisineType;
  const { data: rawRestaurants, isLoading, refetch } = useRestaurants(cuisineFilter);
  const restaurants = Array.isArray(rawRestaurants) ? rawRestaurants : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Food Delivery" showBack />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <AnimatedRow delay={0}>
          <LinearGradient colors={Colors.gradientFood as [string, string]} style={styles.heroBanner}>
            <View>
              <Text style={[Typography.h3, { color: Colors.white }]}>Hungry? 🍽️</Text>
              <Text style={[Typography.body, { color: 'rgba(255,255,255,0.8)', marginTop: 4 }]}>
                30–40 min delivery to your door
              </Text>
            </View>
            <Text style={{ fontSize: 60 }}>🚀</Text>
          </LinearGradient>
        </AnimatedRow>

        {/* Search bar */}
        <AnimatedRow delay={80}>
          <TouchableOpacity
            onPress={() => navigation.navigate('RestaurantList', { searchFocus: true })}
            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialIcons name="search" size={20} color={colors.textMuted} />
            <Text style={[Typography.body, { color: colors.textMuted, marginLeft: 10 }]}>
              Search restaurants or dishes...
            </Text>
          </TouchableOpacity>
        </AnimatedRow>

        {/* Cuisine filters */}
        <AnimatedRow delay={160}>
          <FlatList
            data={CUISINE_FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            keyExtractor={(i) => i.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveCuisine(item.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: activeCuisine === item.key ? Colors.primary : colors.card,
                    borderColor: activeCuisine === item.key ? Colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                <Text style={[Typography.captionBold, { color: activeCuisine === item.key ? Colors.white : colors.textSub, marginLeft: 5 }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </AnimatedRow>

        {/* Sort + count row */}
        <AnimatedRow delay={220}>
          <View style={styles.sortRow}>
            <Text style={[Typography.label, { color: colors.textSub }]}>
              {restaurants.length} restaurants
            </Text>
            <TouchableOpacity
              onPress={() => setShowSortSheet(!showSortSheet)}
              style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialIcons name="sort" size={16} color={Colors.primary} />
              <Text style={[Typography.captionBold, { color: Colors.primary, marginLeft: 4 }]}>{activeSort}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {showSortSheet && (
            <View style={[styles.sortSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => { setActiveSort(opt); setShowSortSheet(false); }}
                  style={[styles.sortOption, { borderBottomColor: colors.border }]}
                >
                  <Text style={[Typography.body, { color: opt === activeSort ? Colors.primary : colors.text }]}>{opt}</Text>
                  {opt === activeSort && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </AnimatedRow>

        {/* Restaurants */}
        <View style={[styles.listPadding, { paddingBottom: totalItems > 0 ? 100 : 40 }]}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : restaurants.length === 0 ? (
            <AnimatedRow delay={280}>
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 56 }}>🍽️</Text>
                <Text style={[Typography.h4, { color: colors.text, marginTop: 12 }]}>No restaurants found</Text>
                <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginTop: 6 }]}>
                  Try a different cuisine filter
                </Text>
              </View>
            </AnimatedRow>
          ) : (
            restaurants.map((r: any, idx: number) => (
              <AnimatedRow key={r.id ?? r._id} delay={280 + idx * 60}>
                <RestaurantCard
                  {...r}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id ?? r._id })}
                />
              </AnimatedRow>
            ))
          )}
        </View>
      </ScrollView>

      {/* Cart bar */}
      {totalItems > 0 && (
        <View style={[styles.cartBar, { backgroundColor: colors.surface }, Shadows.lg]}>
          <View>
            <Text style={[Typography.captionBold, { color: colors.textSub }]}>{totalItems} item{totalItems > 1 ? 's' : ''}</Text>
            <Text style={[Typography.labelLarge, { color: colors.text }]}>₹{subtotal}</Text>
          </View>
          <Button
            label="View Cart →"
            onPress={() => navigation.navigate('Cart')}
            style={{ flex: 0, paddingHorizontal: 28 }}
            size="sm"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBanner: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchBar: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.full, borderWidth: 1 },
  filterList: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: 8 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, gap: 4 },
  sortSheet: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 12, ...Shadows.md },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  listPadding: { paddingHorizontal: Spacing.xl },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  cartBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingBottom: 28, paddingHorizontal: Spacing.xl },
});

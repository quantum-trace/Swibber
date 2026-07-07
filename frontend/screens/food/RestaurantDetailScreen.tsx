import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FoodStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useCart } from '../../hooks/useCart';
import { useRestaurantDetail } from '../../hooks/useFoodQuery';
import Header from '../../components/common/Header';
import FoodItemCard from '../../components/food/FoodItemCard';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import Button from '../../components/common/Button';

type DetailNav = StackNavigationProp<FoodStackParamList, 'RestaurantDetail'>;
type DetailRoute = RouteProp<FoodStackParamList, 'RestaurantDetail'>;

export default function RestaurantDetailScreen() {
  const navigation = useNavigation<DetailNav>();
  const { params } = useRoute<DetailRoute>();
  const { colors } = useTheme();
  const { items, addItem, removeItem, totalItems, subtotal } = useCart();

  const [activeCategory, setActiveCategory] = useState('');
  const { data: restaurant, isLoading } = useRestaurantDetail(params.restaurantId);

  const groupedMenu = React.useMemo(() => {
    const menu = (restaurant as any)?.menu ?? [];
    const map = new Map<string, any[]>();
    menu.forEach((item: any) => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [restaurant]);

  useEffect(() => {
    if (!isLoading && groupedMenu.length > 0 && !activeCategory) {
      setActiveCategory(groupedMenu[0].category);
    }
  }, [isLoading, groupedMenu]);

  const getItemQty = (itemId: string) => items.find((i) => i.menuItemId === itemId)?.quantity ?? 0;

  const activeItems = groupedMenu.find((c) => c.category === activeCategory)?.items ?? [];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title="" />
        <CardSkeleton style={{ margin: Spacing.xl }} />
        <CardSkeleton style={{ margin: Spacing.xl, marginTop: 0 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero */}
      <LinearGradient colors={Colors.gradientFood as [string, string]} style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>{restaurant.imageEmoji}</Text>
      </LinearGradient>

      {/* Info card */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Text style={[Typography.h3, { color: colors.text }]}>{restaurant.name}</Text>
        <Text style={[Typography.body, { color: colors.textSub, marginTop: 2 }]}>{restaurant.cuisineLabel}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: Colors.success }]}>
            <MaterialIcons name="star" size={12} color={Colors.white} />
            <Text style={[Typography.captionBold, { color: Colors.white, marginLeft: 3 }]}>{restaurant.rating}</Text>
          </View>
          <Text style={[Typography.caption, { color: colors.textSub }]}>({restaurant.reviewCount} reviews)</Text>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <MaterialIcons name="access-time" size={13} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textSub }]}>{restaurant.deliveryTime}</Text>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <MaterialIcons name="delivery-dining" size={13} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textSub }]}>
            {restaurant.deliveryFee === 0 ? 'Free delivery' : `₹${restaurant.deliveryFee}`}
          </Text>
        </View>
      </View>

      {/* Category tabs */}
      <FlatList
        data={groupedMenu}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catTabs}
        keyExtractor={(m) => m.category}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveCategory(item.category)}
            style={[styles.catTab, { borderBottomColor: activeCategory === item.category ? Colors.primary : 'transparent', borderBottomWidth: 2 }]}
          >
            <Text style={[Typography.label, { color: activeCategory === item.category ? Colors.primary : colors.textSub }]}>
              {item.category}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Items */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: totalItems > 0 ? 100 : 40 }}>
        <View style={[{ backgroundColor: colors.card, marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden' }, Shadows.sm]}>
          {activeItems.map((item) => (
            <FoodItemCard
              key={item.id}
              {...item}
              quantity={getItemQty(item.id)}
              onAdd={() => addItem({ menuItemId: item.id, restaurantId: restaurant.id, name: item.name, price: item.price, imageEmoji: item.imageEmoji, addons: item.addons ?? [], isVeg: item.isVeg }, restaurant.name)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
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
  hero: { height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroEmoji: { fontSize: 72 },
  backBtn: { position: 'absolute', top: 48, left: 20, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  infoCard: { marginHorizontal: Spacing.xl, marginTop: -20, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full },
  dot: { width: 3, height: 3, borderRadius: 2 },
  catTabs: { paddingHorizontal: Spacing.xl, paddingVertical: 12, gap: 4 },
  catTab: { paddingHorizontal: 14, paddingVertical: 8, marginRight: 4 },
  cartBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingBottom: 28, paddingHorizontal: Spacing.xl },
});

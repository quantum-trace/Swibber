import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { usePressScale } from '../../animations/scaleAnimation';
import Animated from 'react-native-reanimated';

interface RestaurantCardProps {
  id: string;
  name: string;
  cuisineLabel: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  imageEmoji: string;
  isOpen: boolean;
  tags?: string[];
  isFeatured?: boolean;
  onPress: () => void;
}

export default function RestaurantCard({
  name, cuisineLabel, rating, reviewCount, deliveryTime, deliveryFee,
  minimumOrder, imageEmoji, isOpen, tags, isFeatured, onPress,
}: RestaurantCardProps) {
  const hasPromo = tags && tags.length > 0 ? tags[0] : undefined;
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[styles.card, { backgroundColor: colors.card }, Shadows.md]}
      >
        {/* Hero image */}
        <View style={styles.imageBox}>
          <LinearGradient colors={Colors.gradientFood as [string, string]} style={styles.imageBg}>
            <Text style={styles.emoji}>{imageEmoji}</Text>
          </LinearGradient>
          {!isOpen && (
            <View style={styles.closedOverlay}>
              <Text style={[Typography.label, { color: Colors.white }]}>Closed</Text>
            </View>
          )}
          {isFeatured && (
            <View style={[styles.featuredBadge, { backgroundColor: Colors.primary }]}>
              <Text style={[Typography.captionBold, { color: Colors.white }]}>Featured</Text>
            </View>
          )}
          {hasPromo && (
            <View style={[styles.promoBadge, { backgroundColor: Colors.warning }]}>
              <Text style={[Typography.captionBold, { color: Colors.white }]}>{hasPromo}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[Typography.labelLarge, { color: colors.text, flex: 1 }]} numberOfLines={1}>{name}</Text>
            <View style={[styles.ratingChip, { backgroundColor: Colors.success }]}>
              <MaterialIcons name="star" size={10} color={Colors.white} />
              <Text style={[Typography.captionBold, { color: Colors.white, marginLeft: 2 }]}>{rating}</Text>
            </View>
          </View>
          <Text style={[Typography.caption, { color: colors.textSub, marginTop: 2 }]} numberOfLines={1}>
            {cuisineLabel}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={12} color={colors.textMuted} />
              <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 3 }]}>{deliveryTime}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <MaterialIcons name="delivery-dining" size={12} color={colors.textMuted} />
              <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 3 }]}>
                {deliveryFee === 0 ? 'Free delivery' : `₹${deliveryFee}`}
              </Text>
            </View>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <Text style={[Typography.caption, { color: colors.textMuted }]}>₹{minimumOrder} min</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: 16 },
  imageBox: { height: 160, position: 'relative' },
  imageBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 64 },
  closedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  featuredBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  promoBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  info: { padding: Spacing.base },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: BorderRadius.full },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 3, height: 3, borderRadius: 2 },
});

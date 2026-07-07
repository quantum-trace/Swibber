import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 28,
  onChange,
  readonly = false,
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const handlePress = (star: number) => {
    if (readonly || !onChange) return;
    onChange(star);
  };

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const filled = star <= rating;
        const half = !filled && star - 0.5 <= rating;
        const iconName = filled ? 'star' : half ? 'star-half' : 'star-outline';
        return (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            disabled={readonly}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <MaterialIcons
              name={iconName as any}
              size={size}
              color={filled || half ? '#FFD700' : Colors.dark.textMuted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

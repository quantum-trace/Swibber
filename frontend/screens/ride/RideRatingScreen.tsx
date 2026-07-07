import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RideStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import Header from '../../components/common/Header';
import StarRating from '../../components/common/StarRating';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';

type RatingNav = StackNavigationProp<RideStackParamList, 'RideRating'>;
type RatingRoute = RouteProp<RideStackParamList, 'RideRating'>;

const TIP_OPTIONS = [0, 20, 40, 60];
const QUICK_TAGS = ['Great driving', 'Friendly', 'On time', 'Clean car', 'Safe ride', 'Helped with bags'];

export default function RideRatingScreen() {
  const navigation = useNavigation<RatingNav>();
  const { params } = useRoute<RatingRoute>();
  const { colors } = useTheme();

  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsDone(true);
    setIsSubmitting(false);
    setTimeout(() => navigation.popToTop(), 1500);
  };

  if (isDone) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 80 }}>⭐</Text>
        <Text style={[Typography.h2, { color: colors.text, marginTop: 16 }]}>Thanks for rating!</Text>
        <Text style={[Typography.body, { color: colors.textSub }]}>Your feedback helps drivers improve</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Rate Your Ride" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Driver info */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Avatar name={params.driverName} size={72} />
          <Text style={[Typography.h3, { color: colors.text, marginTop: 12 }]}>{params.driverName}</Text>
          <Text style={[Typography.body, { color: colors.textSub }]}>How was your ride?</Text>
        </View>

        {/* Stars */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <StarRating rating={rating} size={40} onChange={setRating} />
          {rating > 0 && (
            <Text style={[Typography.label, { color: Colors.primary, marginTop: 8 }]}>
              {['', 'Terrible', 'Bad', 'Okay', 'Good', 'Amazing!'][rating]}
            </Text>
          )}
        </View>

        {/* Quick tags */}
        {rating >= 4 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[Typography.label, { color: colors.textSub, marginBottom: 10 }]}>WHAT STOOD OUT?</Text>
            <View style={styles.tagsWrap}>
              {QUICK_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tag, { borderColor: selectedTags.includes(tag) ? Colors.primary : colors.border, backgroundColor: selectedTags.includes(tag) ? `${Colors.primary}15` : colors.card }]}
                >
                  <Text style={[Typography.captionBold, { color: selectedTags.includes(tag) ? Colors.primary : colors.textSub }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tip */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[Typography.label, { color: colors.textSub, marginBottom: 10 }]}>TIP DRIVER (OPTIONAL)</Text>
          <View style={styles.tipRow}>
            {TIP_OPTIONS.map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => setTip(amount)}
                style={[styles.tipBtn, { borderColor: tip === amount ? Colors.primary : colors.border, backgroundColor: tip === amount ? `${Colors.primary}15` : colors.card }]}
              >
                <Text style={[Typography.label, { color: tip === amount ? Colors.primary : colors.textSub }]}>
                  {amount === 0 ? 'None' : `₹${amount}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment */}
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Any additional feedback? (optional)"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          style={[styles.comment, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        />

        <Button
          label={tip > 0 ? `Submit & Tip ₹${tip}` : 'Submit Rating'}
          onPress={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={rating === 0}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: 40 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  tipRow: { flexDirection: 'row', gap: 10 },
  tipBtn: { flex: 1, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1.5, alignItems: 'center' },
  comment: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.base, height: 100, textAlignVertical: 'top' },
});

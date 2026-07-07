import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { FoodStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import Header from '../../components/common/Header';
import StarRating from '../../components/common/StarRating';
import Button from '../../components/common/Button';

type CompleteNav = StackNavigationProp<FoodStackParamList, 'OrderComplete'>;
type CompleteRoute = RouteProp<FoodStackParamList, 'OrderComplete'>;

export default function OrderCompleteScreen() {
  const navigation = useNavigation<CompleteNav>();
  const { params } = useRoute<CompleteRoute>();
  const { colors } = useTheme();

  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const checkScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    contentOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
  }, []);

  const handleSubmitRating = async () => {
    setSubmitted(true);
    setTimeout(() => navigation.popToTop(), 1500);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 72 }}>🙏</Text>
        <Text style={[Typography.h3, { color: colors.text, marginTop: 16 }]}>Thanks for your feedback!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack={false} title="Order Complete" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Success icon */}
        <Animated.View style={[styles.checkBox, checkStyle]}>
          <Text style={{ fontSize: 80 }}>🎉</Text>
        </Animated.View>

        <Animated.View style={contentStyle}>
          <Text style={[Typography.display2, { color: colors.text, textAlign: 'center' }]}>Food delivered!</Text>
          <Text style={[Typography.body, { color: colors.textSub, textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>
            We hope you enjoyed your meal
          </Text>

          {/* Cashback */}
          <View style={[styles.cashbackCard, { backgroundColor: `${Colors.success}15` }]}>
            <Text style={{ fontSize: 28 }}>💰</Text>
            <View style={{ marginLeft: 12 }}>
              <Text style={[Typography.label, { color: Colors.success }]}>₹12 cashback earned!</Text>
              <Text style={[Typography.caption, { color: colors.textSub }]}>Added to SwibberPay wallet</Text>
            </View>
          </View>

          {/* Order id */}
          <View style={[styles.orderRow, { backgroundColor: colors.card }]}>
            <Text style={[Typography.caption, { color: colors.textSub }]}>Order ID</Text>
            <Text style={[Typography.label, { color: colors.text }]}>#{params.orderId.slice(-8).toUpperCase()}</Text>
          </View>

          {/* Rating section */}
          <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
            <Text style={[Typography.label, { color: colors.text, marginBottom: 16 }]}>Rate your experience</Text>

            <Text style={[Typography.body, { color: colors.textSub, marginBottom: 8 }]}>Food quality</Text>
            <StarRating rating={foodRating} size={32} onChange={setFoodRating} />

            <Text style={[Typography.body, { color: colors.textSub, marginTop: 16, marginBottom: 8 }]}>Delivery experience</Text>
            <StarRating rating={deliveryRating} size={32} onChange={setDeliveryRating} />

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us more... (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={[styles.commentInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            />
          </View>

          <Button
            label="Submit & Back to Home"
            onPress={handleSubmitRating}
            isDisabled={foodRating === 0}
            style={{ marginTop: 16 }}
          />
          <Button
            label="Skip"
            onPress={() => navigation.popToTop()}
            variant="ghost"
            style={{ marginTop: 8 }}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: 40 },
  checkBox: { alignItems: 'center', marginVertical: 24 },
  cashbackCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.md, marginBottom: 12 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.md, marginBottom: 12 },
  ratingCard: { borderRadius: BorderRadius.xl, padding: Spacing.base },
  commentInput: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.sm, height: 80, textAlignVertical: 'top', marginTop: 12 },
});

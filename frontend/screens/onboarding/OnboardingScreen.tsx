import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { StorageService } from '../../services/storageService';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import Button from '../../components/common/Button';

const { width } = Dimensions.get('window');

type OnboardingNav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string[];
  accentColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Ride Anywhere',
    description: 'Book bikes, autos, and premium cabs instantly.\nSafe, fast, and always reliable.',
    emoji: '🚗',
    gradient: ['#0A0A1A', '#1A0A3A'],
    accentColor: Colors.primary,
  },
  {
    id: '2',
    title: 'Food Delivered Fast',
    description: 'Order from your favourite restaurants\nin minutes, right to your door.',
    emoji: '🍔',
    gradient: ['#1A0A08', '#2A1008'],
    accentColor: '#FF9500',
  },
  {
    id: '3',
    title: 'Send Anything',
    description: 'Fast parcel and courier delivery anytime.\nTrusted riders, real-time tracking.',
    emoji: '📦',
    gradient: ['#001A10', '#002A18'],
    accentColor: Colors.success,
  },
];

function SlideItem({
  slide,
  index,
  scrollX,
}: {
  slide: OnboardingSlide;
  index: number;
  scrollX: SharedValue<number>;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const emojiStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [40, 0, 40], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    return { transform: [{ scale }, { translateY }], opacity };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.emojiContainer, { backgroundColor: `${slide.accentColor}20` }, emojiStyle]}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <View style={[styles.emojiGlow, { backgroundColor: slide.accentColor }]} />
      </Animated.View>

      <Animated.View style={textStyle}>
        <Text style={[styles.slideTitle, { color: Colors.white }]}>{slide.title}</Text>
        <Text style={[styles.slideDesc, { color: `${Colors.white}80` }]}>{slide.description}</Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNav>();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index !== undefined && viewableItems[0]?.index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  const goToAuth = async () => {
    await StorageService.markOnboardingDone();
    navigation.replace('Auth' as any);
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      goToAuth();
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={SLIDES[currentIndex].gradient as [string, string]}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip button */}
      <TouchableOpacity onPress={goToAuth} style={styles.skipBtn}>
        <Text style={[Typography.label, { color: `${Colors.white}80` }]}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SlideItem slide={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {SLIDES.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? SLIDES[currentIndex].accentColor : `${Colors.white}40`,
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        {isLast ? (
          <>
            <Button label="Get Started 🚀" onPress={goToAuth} gradient={Colors.gradientPrimary} />
            <TouchableOpacity onPress={goToAuth} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={[Typography.label, { color: `${Colors.white}60` }]}>Already have an account? Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Button label="Next" onPress={goNext} gradient={[SLIDES[currentIndex].accentColor, Colors.primaryDark]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  skipBtn: { position: 'absolute', top: 60, right: Spacing.xl, zIndex: 10, padding: Spacing.sm },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingTop: 80 },
  emojiContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  emoji: { fontSize: 96 },
  emojiGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.15 },
  slideTitle: { ...Typography.display2, textAlign: 'center', marginBottom: 16 },
  slideDesc: { ...Typography.bodyLarge, textAlign: 'center', lineHeight: 28 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  ctaContainer: { paddingHorizontal: Spacing.xl, paddingBottom: 48 },
});

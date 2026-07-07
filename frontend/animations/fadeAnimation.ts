import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export const useFadeIn = (duration = 400, delay = 0) => {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const fadeIn = () => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
    );
  };

  const fadeOut = (cb?: () => void) => {
    opacity.value = withTiming(0, { duration: duration / 2 }, (finished) => {
      if (finished && cb) cb();
    });
  };

  return { opacity, animatedStyle, fadeIn, fadeOut };
};

export const useFadeInUp = (duration = 500, delay = 0, translateY = 24) => {
  const opacity = useSharedValue(0);
  const translateYVal = useSharedValue(translateY);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateYVal.value }],
  }));

  const animate = () => {
    const cfg = { duration, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(delay, withTiming(1, cfg));
    translateYVal.value = withDelay(delay, withTiming(0, cfg));
  };

  return { animatedStyle, animate };
};

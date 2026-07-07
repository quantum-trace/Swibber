import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const SPRING = { damping: 20, stiffness: 180, mass: 0.8 };

export const useSlideUp = (fromY = 300) => {
  const translateY = useSharedValue(fromY);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const slideUp = () => {
    translateY.value = withSpring(0, SPRING);
  };

  const slideDown = (cb?: () => void) => {
    translateY.value = withTiming(fromY, { duration: 300, easing: Easing.in(Easing.quad) }, (f) => {
      if (f && cb) cb();
    });
  };

  return { animatedStyle, slideUp, slideDown, translateY };
};

export const useSlideIn = (fromX = 400) => {
  const translateX = useSharedValue(fromX);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const slideIn = () => {
    translateX.value = withSpring(0, SPRING);
  };

  const slideOut = (direction: 'left' | 'right' = 'right', cb?: () => void) => {
    const target = direction === 'right' ? fromX : -fromX;
    translateX.value = withTiming(target, { duration: 300 }, (f) => {
      if (f && cb) cb();
    });
  };

  return { animatedStyle, slideIn, slideOut };
};

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const PRESS_SPRING = { damping: 15, stiffness: 300, mass: 0.6 };

export const usePressScale = (toScale = 0.95) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(toScale, PRESS_SPRING);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, PRESS_SPRING);
  };

  return { animatedStyle, onPressIn, onPressOut };
};

export const useSuccessBounce = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const triggerSuccess = (onDone?: () => void) => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    if (onDone) setTimeout(onDone, 600);
  };

  return { animatedStyle, triggerSuccess };
};

export const usePulse = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulse = () => {
    scale.value = withSequence(
      withTiming(1.08, { duration: 150 }),
      withTiming(0.96, { duration: 150 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  };

  return { animatedStyle, pulse };
};

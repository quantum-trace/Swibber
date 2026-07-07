import { useEffect } from 'react';
import { useFadeInUp } from '../animations/fadeAnimation';
import { usePressScale } from '../animations/scaleAnimation';

export const useScreenEntrance = (delay = 0) => {
  const { animatedStyle, animate } = useFadeInUp(500, delay);
  useEffect(() => {
    animate();
  }, [animate]);
  return animatedStyle;
};

export const useCardPress = (scale = 0.97) => {
  return usePressScale(scale);
};

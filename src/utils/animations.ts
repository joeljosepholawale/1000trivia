import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Advanced Animation Utilities
 * Provides reusable animation patterns and haptic feedback
 */

// Haptic Feedback
export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

// Animation Presets
export const animations = {
  // Bounce animation for success states
  bounce: (animatedValue: Animated.Value) => {
    return Animated.sequence([
      Animated.spring(animatedValue, {
        toValue: 1.2,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);
  },

  // Shake animation for errors
  shake: (animatedValue: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]);
  },

  // Pulse animation for notifications
  pulse: (animatedValue: Animated.Value, duration: number = 1000) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: duration / 2,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
  },

  // Slide in from different directions
  slideIn: {
    fromLeft: (animatedValue: Animated.Value, distance: number = 100) => {
      return Animated.timing(animatedValue, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    },
    fromRight: (animatedValue: Animated.Value, distance: number = 100) => {
      return Animated.timing(animatedValue, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    },
    fromBottom: (animatedValue: Animated.Value, distance: number = 100) => {
      return Animated.timing(animatedValue, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    },
  },

  // Fade with scale
  fadeInScale: (fadeAnim: Animated.Value, scaleAnim: Animated.Value) => {
    return Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);
  },

  // Shimmer loading effect
  shimmer: (animatedValue: Animated.Value) => {
    return Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  },

  // Press animation (scale down)
  press: (animatedValue: Animated.Value) => {
    return Animated.spring(animatedValue, {
      toValue: 0.95,
      friction: 3,
      useNativeDriver: true,
    });
  },

  // Release animation (scale back)
  release: (animatedValue: Animated.Value) => {
    return Animated.spring(animatedValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    });
  },

  // Confetti celebration
  celebrate: (animatedValues: Animated.Value[]) => {
    return Animated.stagger(
      50,
      animatedValues.map((anim) =>
        Animated.sequence([
          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            delay: 1000,
            useNativeDriver: true,
          }),
        ])
      )
    );
  },
};

// Combined animation + haptic patterns
export const feedbackAnimations = {
  success: async (animatedValue: Animated.Value) => {
    await haptics.success();
    animations.bounce(animatedValue).start();
  },

  error: async (animatedValue: Animated.Value) => {
    await haptics.error();
    animations.shake(animatedValue).start();
  },

  buttonPress: async (animatedValue: Animated.Value) => {
    await haptics.light();
    animations.press(animatedValue).start();
  },

  buttonRelease: async (animatedValue: Animated.Value) => {
    animations.release(animatedValue).start();
  },
};

// Custom hooks for common animation patterns
export const useAnimatedValue = (initialValue: number = 0) => {
  const animatedValue = new Animated.Value(initialValue);
  return animatedValue;
};

export const useSequenceAnimation = (
  animations: Animated.CompositeAnimation[]
) => {
  const start = () => {
    Animated.sequence(animations).start();
  };

  return { start };
};

export const useParallelAnimation = (
  animations: Animated.CompositeAnimation[]
) => {
  const start = () => {
    Animated.parallel(animations).start();
  };

  return { start };
};

// Timing presets
export const timings = {
  instant: 0,
  fast: 200,
  normal: 400,
  slow: 600,
  verySlow: 1000,
};

// Easing presets
export const easings = {
  smooth: Easing.bezier(0.4, 0.0, 0.2, 1),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
  linear: Easing.linear,
  easeIn: Easing.ease,
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
};

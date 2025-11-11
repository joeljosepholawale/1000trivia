import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, Easing, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  style?: TextStyle;
  easing?: Animated.EasingFunction;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  suffix = '',
  prefix = '',
  decimals = 0,
  style,
  easing = Easing.out(Easing.cubic),
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: animValue }) => {
      const formattedValue = decimals > 0
        ? animValue.toFixed(decimals)
        : Math.round(animValue).toString();
      
      setDisplayValue(`${prefix}${formattedValue}${suffix}`);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration, decimals, prefix, suffix, easing, animatedValue]);

  return (
    <Animated.Text style={style}>
      {displayValue}
    </Animated.Text>
  );
};

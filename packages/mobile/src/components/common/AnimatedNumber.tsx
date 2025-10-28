import React, { useEffect, useRef } from 'react';
import { Text, Animated, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  style?: TextStyle;
  easing?: Animated.TimingAnimationConfig['easing'];
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  suffix = '',
  prefix = '',
  decimals = 0,
  style,
  easing = Animated.Easing.out(Animated.Easing.cubic),
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef<string>('0');

  useEffect(() => {
    animatedValue.addListener(({ value: animValue }) => {
      const formattedValue = decimals > 0
        ? animValue.toFixed(decimals)
        : Math.round(animValue).toString();
      
      displayValue.current = `${prefix}${formattedValue}${suffix}`;
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeAllListeners();
    };
  }, [value, duration, decimals, prefix, suffix]);

  return (
    <Animated.Text style={style}>
      {animatedValue.interpolate({
        inputRange: [0, value],
        outputRange: [0, value],
        extrapolate: 'clamp',
      }).__getValue()
        ? `${prefix}${decimals > 0 ? animatedValue.__getValue().toFixed(decimals) : Math.round(animatedValue.__getValue())}${suffix}`
        : `${prefix}0${suffix}`}
    </Animated.Text>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { theme } from '@/styles/theme';

export interface CountdownTimerProps {
  seconds: number;
  size?: number;
  color?: string;
  warningColor?: string;
  warningThreshold?: number;
  onComplete?: () => void;
  showProgress?: boolean;
  strokeWidth?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  seconds,
  size = 80,
  color = theme.colors.primary[500],
  warningColor = theme.colors.error[500],
  warningThreshold = 5,
  onComplete,
  showProgress = true,
  strokeWidth = 6,
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const progress = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    setTimeLeft(seconds);
    progress.setValue(1);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Animate progress
        Animated.timing(progress, {
          toValue: newTime / seconds,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        // Pulse animation when time is low
        if (newTime <= warningThreshold) {
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, seconds, warningThreshold, onComplete]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const isWarning = timeLeft <= warningThreshold;
  const currentColor = isWarning ? warningColor : color;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: pulse }],
        },
      ]}
    >
      {showProgress && (
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.gray[200]}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
      )}
      
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.timeText,
            { color: currentColor, fontSize: size * 0.3 },
            isWarning && styles.warningText,
          ]}
        >
          {timeLeft}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  warningText: {
    textShadowColor: 'rgba(239, 68, 68, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

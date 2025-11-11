import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/styles/theme';

export interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  gradient?: boolean;
  gradientColors?: string[];
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = theme.colors.primary[500],
  gradient = false,
  gradientColors = [theme.colors.primary[400], theme.colors.primary[600]],
  animated = true,
  showLabel = false,
  label,
  backgroundColor = theme.colors.gray[200],
  style,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    if (animated) {
      Animated.spring(animatedProgress, {
        toValue: clampedProgress,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    } else {
      animatedProgress.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={styles.label}>
          {label || `${Math.round(clampedProgress)}%`}
        </Text>
      )}
      <View style={[styles.track, { height, backgroundColor }]}>
        <Animated.View
          style={[
            styles.progressContainer,
            {
              width: progressWidth,
              height,
            },
          ]}
        >
          {gradient ? (
            <LinearGradient
              colors={gradientColors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progress}
            />
          ) : (
            <View style={[styles.progress, { backgroundColor: color }]} />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  track: {
    width: '100%',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressContainer: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progress: {
    flex: 1,
    borderRadius: theme.borderRadius.full,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/styles/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = theme.borderRadius.md,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.gray[200],
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <SkeletonLoader width="60%" height={24} style={styles.marginBottom} />
      <SkeletonLoader width="100%" height={16} style={styles.marginBottom} />
      <SkeletonLoader width="80%" height={16} style={styles.marginBottom} />
      <View style={styles.row}>
        <SkeletonLoader width={60} height={60} borderRadius={theme.borderRadius.full} />
        <View style={styles.column}>
          <SkeletonLoader width="70%" height={16} style={styles.marginBottom} />
          <SkeletonLoader width="50%" height={14} />
        </View>
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ items?: number; style?: ViewStyle }> = ({
  items = 5,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: items }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <SkeletonLoader width={48} height={48} borderRadius={theme.borderRadius.md} />
          <View style={styles.listItemContent}>
            <SkeletonLoader width="70%" height={16} style={styles.marginBottom} />
            <SkeletonLoader width="40%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SkeletonAvatar: React.FC<{ size?: number; style?: ViewStyle }> = ({
  size = 48,
  style,
}) => {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={theme.borderRadius.full}
      style={style}
    />
  );
};

export const SkeletonButton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return <SkeletonLoader width="100%" height={48} borderRadius={theme.borderRadius.lg} style={style} />;
};

export const SkeletonText: React.FC<{
  lines?: number;
  width?: string;
  style?: ViewStyle;
}> = ({ lines = 3, width = '100%', style }) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 ? '60%' : width}
          height={16}
          style={styles.textLine}
        />
      ))}
    </View>
  );
};

// Shimmer effect variant
export const ShimmerLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = theme.borderRadius.md,
  style,
}) => {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateXInterpolate = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.gray[200],
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX: translateXInterpolate }],
        }}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.5)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[6],
    marginBottom: theme.spacing[4],
    ...theme.shadows.sm,
  },
  marginBottom: {
    marginBottom: theme.spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    marginTop: theme.spacing[4],
  },
  column: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  listItemContent: {
    flex: 1,
  },
  textLine: {
    marginBottom: theme.spacing[2],
  },
});

export type {
  SkeletonLoaderProps,
};

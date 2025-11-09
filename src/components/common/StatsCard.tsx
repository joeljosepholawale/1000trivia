import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/styles/theme';
import { Card } from './Card';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialIcons.glyphMap;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  gradient?: boolean;
  gradientColors?: string[];
  style?: ViewStyle;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = theme.colors.primary[500],
  gradient = false,
  gradientColors = [theme.colors.primary[400], theme.colors.primary[600]],
  style,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return theme.colors.success[500];
      case 'down':
        return theme.colors.error[500];
      default:
        return theme.colors.gray[500];
    }
  };

  return (
    <Card variant="elevated" padding={4} style={[styles.card, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {gradient ? (
            <LinearGradient colors={gradientColors} style={styles.iconGradient}>
              <MaterialIcons name={icon} size={24} color={theme.colors.white} />
            </LinearGradient>
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: color }]}>
              <MaterialIcons name={icon} size={24} color={theme.colors.white} />
            </View>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
          
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <MaterialIcons
                name={getTrendIcon()}
                size={16}
                color={getTrendColor()}
              />
              <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing[3],
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  value: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[1],
  },
  trendValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing[1],
  },
});

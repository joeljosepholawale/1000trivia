import React from 'react';
import {View, StyleSheet, ViewStyle, TouchableOpacity} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors} from '@/styles/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: [string, string, ...string[]];
  onPress?: () => void;
  elevated?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  gradient = false,
  gradientColors = ['#FFFFFF', '#F9F9F9'],
  onPress,
  elevated = true,
  variant = 'default',
  padding,
}) => {
  const variantStyles = {
    default: {},
    primary: {borderColor: colors.primary, borderWidth: 1},
    secondary: {borderColor: colors.secondary, borderWidth: 1},
    success: {borderColor: colors.success, borderWidth: 1},
    warning: {borderColor: colors.warning, borderWidth: 1},
    error: {borderColor: colors.error, borderWidth: 1},
  };

  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    variantStyles[variant],
    padding !== undefined && {padding},
    style,
  ];

  if (gradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.8 : 1}
        style={cardStyle}
      >
        <LinearGradient
          colors={gradientColors}
          style={[styles.gradient, padding !== undefined && {padding}]}
        >
          {children}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
  },
});

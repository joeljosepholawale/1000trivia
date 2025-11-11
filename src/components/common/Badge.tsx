import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof MaterialIcons.glyphMap;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  rounded = false,
  style,
  textStyle,
}) => {
  const badgeStyles = [
    styles.badge,
    styles[`badge_${size}`],
    styles[`badge_${variant}`],
    rounded && styles.rounded,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    styles[`text_${variant}`],
    textStyle,
  ];

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 18;
      default:
        return 14;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary[700];
      case 'secondary':
        return theme.colors.secondary[700];
      case 'success':
        return theme.colors.success[700];
      case 'warning':
        return theme.colors.warning[700];
      case 'error':
        return theme.colors.error[700];
      case 'info':
        return theme.colors.info[700];
      default:
        return theme.colors.gray[700];
    }
  };

  return (
    <View style={badgeStyles}>
      {icon && (
        <MaterialIcons
          name={icon}
          size={getIconSize()}
          color={getIconColor()}
          style={styles.icon}
        />
      )}
      <Text style={textStyles}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  badge_sm: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
  },
  badge_md: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.base,
  },
  badge_lg: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
  },
  badge_primary: {
    backgroundColor: theme.colors.primary[100],
  },
  badge_secondary: {
    backgroundColor: theme.colors.secondary[100],
  },
  badge_success: {
    backgroundColor: theme.colors.success[100],
  },
  badge_warning: {
    backgroundColor: theme.colors.warning[100],
  },
  badge_error: {
    backgroundColor: theme.colors.error[100],
  },
  badge_info: {
    backgroundColor: theme.colors.info[100],
  },
  badge_neutral: {
    backgroundColor: theme.colors.gray[100],
  },
  rounded: {
    borderRadius: theme.borderRadius.full,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  text_sm: {
    fontSize: theme.typography.fontSize.xs,
  },
  text_md: {
    fontSize: theme.typography.fontSize.sm,
  },
  text_lg: {
    fontSize: theme.typography.fontSize.base,
  },
  text_primary: {
    color: theme.colors.primary[700],
  },
  text_secondary: {
    color: theme.colors.secondary[700],
  },
  text_success: {
    color: theme.colors.success[700],
  },
  text_warning: {
    color: theme.colors.warning[700],
  },
  text_error: {
    color: theme.colors.error[700],
  },
  text_info: {
    color: theme.colors.info[700],
  },
  text_neutral: {
    color: theme.colors.gray[700],
  },
  icon: {
    marginRight: theme.spacing[1],
  },
});

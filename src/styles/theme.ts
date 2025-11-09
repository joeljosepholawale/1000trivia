// Modern Design System inspired by popular apps (Duolingo, Kahoot, TikTok)
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Color Palette - Modern, vibrant, and engaging
export const colors = {
  // Primary Brand Colors (Purple/Blue gradient theme)
  primary: {
    50: '#F0F4FF',
    100: '#E0E9FF',
    200: '#C7D8FF',
    300: '#A3BFFF',
    400: '#7A9DFF',
    500: '#5B7CFF', // Main primary
    600: '#4A63D9',
    700: '#3A4EB3',
    800: '#2B3A8C',
    900: '#1D2866',
  },
  
  // Secondary Colors (Vibrant accent)
  secondary: {
    50: '#FFF4E6',
    100: '#FFE4CC',
    200: '#FFC999',
    300: '#FFAD66',
    400: '#FF9233',
    500: '#FF7700', // Main secondary
    600: '#E66D00',
    700: '#CC6200',
    800: '#B35700',
    900: '#994D00',
  },
  
  // Success Colors
  success: {
    50: '#E8F8F0',
    100: '#D1F2E1',
    200: '#A3E5C3',
    300: '#75D8A5',
    400: '#47CB87',
    500: '#10B759', // Main success
    600: '#0D9247',
    700: '#0A6E35',
    800: '#074923',
    900: '#042511',
  },
  
  // Error Colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Warning Colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Info Colors
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main info
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Neutral/Gray Colors
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Special Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Game-specific
  gameGold: '#FFD700',
  gameSilver: '#C0C0C0',
  gameBronze: '#CD7F32',
  
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F5',
    dark: '#18181B',
    card: '#FFFFFF',
    cardHover: '#F9FAFB',
  },
  
  // Text
  text: {
    primary: '#18181B',
    secondary: '#52525B',
    tertiary: '#A1A1AA',
    disabled: '#D4D4D8',
    inverse: '#FFFFFF',
  },
  
  // Borders
  border: {
    light: '#F4F4F5',
    default: '#E4E4E7',
    dark: '#D4D4D8',
  },
  
  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.7)',
  },
};

// Typography System
export const typography = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    black: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
};

// Spacing System (based on 4px grid)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

// Border Radius
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadows
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
};

// Layout
export const layout = {
  screen: {
    width,
    height,
  },
  container: {
    paddingHorizontal: spacing[4],
  },
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
};

// Animation Durations
export const animations = {
  duration: {
    fastest: 150,
    fast: 200,
    normal: 300,
    slow: 400,
    slowest: 600,
  },
  easing: {
    linear: [0, 0, 1, 1] as const,
    ease: [0.25, 0.1, 0.25, 1] as const,
    easeIn: [0.42, 0, 1, 1] as const,
    easeOut: [0, 0, 0.58, 1] as const,
    easeInOut: [0.42, 0, 0.58, 1] as const,
    spring: [0.5, 1.5, 0.5, 1] as const,
  },
};

// Z-Index Scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Component Variants
export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary[500],
      color: colors.white,
    },
    secondary: {
      backgroundColor: colors.secondary[500],
      color: colors.white,
    },
    outline: {
      backgroundColor: colors.transparent,
      borderColor: colors.primary[500],
      color: colors.primary[500],
    },
    ghost: {
      backgroundColor: colors.transparent,
      color: colors.primary[500],
    },
    success: {
      backgroundColor: colors.success[500],
      color: colors.white,
    },
    danger: {
      backgroundColor: colors.error[500],
      color: colors.white,
    },
  },
  badge: {
    primary: {
      backgroundColor: colors.primary[100],
      color: colors.primary[700],
    },
    success: {
      backgroundColor: colors.success[100],
      color: colors.success[700],
    },
    warning: {
      backgroundColor: colors.warning[100],
      color: colors.warning[700],
    },
    error: {
      backgroundColor: colors.error[100],
      color: colors.error[700],
    },
    info: {
      backgroundColor: colors.info[100],
      color: colors.info[700],
    },
  },
};

// Export complete theme
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  animations,
  zIndex,
  components,
};

export type Theme = typeof theme;
export default theme;

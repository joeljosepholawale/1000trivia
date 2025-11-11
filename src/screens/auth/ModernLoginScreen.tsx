import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

interface ModernLoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
}

export const ModernLoginScreen: React.FC<ModernLoginScreenProps> = ({
  onLogin,
  onNavigateToRegister,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
        delay: 300,
      }),
    ]).start();
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-Mail ist ungültig';
    }

    if (!password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[700], theme.colors.primary[900]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header with Logo */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[theme.colors.white, theme.colors.gray[50]]}
                  style={styles.logoGradient}
                >
                  <MaterialIcons name="emoji-events" size={60} color={theme.colors.primary[500]} />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>1000 Ravier</Text>
              <Text style={styles.tagline}>Teste dein Wissen, gewinne groß!</Text>
            </Animated.View>

            {/* Login Form Card */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Card variant="elevated" padding={6} style={styles.card}>
                <Text style={styles.welcomeText}>Willkommen zurück!</Text>
                <Text style={styles.subtitle}>Melde dich an, um fortzufahren</Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="email"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="E-Mail Adresse"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Passwort"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Forgot Password */}
                <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Passwort vergessen?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <Button
                  onPress={handleLogin}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  gradient
                  style={styles.loginButton}
                >
                  Anmelden
                </Button>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ODER</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtons}>
                  <TouchableOpacity style={styles.socialButton}>
                    <MaterialIcons name="g-translate" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <MaterialIcons name="apple" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <MaterialIcons name="facebook" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Register Link */}
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>Noch kein Konto? </Text>
                  <TouchableOpacity onPress={onNavigateToRegister}>
                    <Text style={styles.registerLink}>Jetzt registrieren</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </Animated.View>

            {/* Decorative Elements */}
            <View style={styles.decorativeElements}>
              <Animated.View
                style={[
                  styles.floatingCircle,
                  styles.circle1,
                  {
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.1],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.floatingCircle,
                  styles.circle2,
                  {
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.15],
                    }),
                  },
                ]}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing[6],
    paddingTop: theme.spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[10],
  },
  logoContainer: {
    marginBottom: theme.spacing[4],
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  appName: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
    marginBottom: theme.spacing[2],
    letterSpacing: 1,
  },
  tagline: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.white,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[8],
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing[4],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  inputIcon: {
    marginRight: theme.spacing[3],
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  passwordInput: {
    paddingRight: theme.spacing[12],
  },
  eyeIcon: {
    position: 'absolute',
    right: theme.spacing[4],
    padding: theme.spacing[2],
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error[500],
    marginTop: theme.spacing[1],
    marginLeft: theme.spacing[2],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing[6],
  },
  forgotPasswordText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  loginButton: {
    marginBottom: theme.spacing[6],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.default,
  },
  dividerText: {
    marginHorizontal: theme.spacing[4],
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  registerLink: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.bold,
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  floatingCircle: {
    position: 'absolute',
    backgroundColor: theme.colors.white,
    borderRadius: 9999,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    left: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -50,
    right: -75,
  },
});

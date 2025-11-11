import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialIcons} from '@expo/vector-icons';
import {colors} from '@/styles/colors';
import {Fonts} from '@/styles/fonts';

const {width, height} = Dimensions.get('window');

export const AnimatedSplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#4c1d95', '#6366f1', '#8b5cf6']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
    >
      {/* Floating Particles Background */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.random() * 0.3],
                }),
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}
      >
        {/* Modern Logo Icon with Multiple Layers */}
        <View style={styles.logoContainer}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="psychology" size={90} color="#6366f1" />
            </View>
          </View>
          <View style={styles.accentCircle1} />
          <View style={styles.accentCircle2} />
        </View>

        {/* App Name with Modern Typography */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{translateY: slideAnim}],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>1000</Text>
            <Text style={styles.titleAccent}>Ravier</Text>
          </View>
          <View style={styles.subtitleWrapper}>
            <MaterialIcons name="bolt" size={16} color="#fbbf24" />
            <Text style={styles.subtitle}>Ultimate Trivia Challenge</Text>
            <MaterialIcons name="bolt" size={16} color="#fbbf24" />
          </View>
        </Animated.View>

        {/* Modern Loading Bar */}
        <Animated.View style={[styles.loadingContainer, {opacity: fadeAnim}]}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading your experience...</Text>
        </Animated.View>
      </Animated.View>

      {/* Version Text */}
      <Text style={styles.version}>v1.0.0</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 50,
    position: 'relative',
  },
  iconCircleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  accentCircle1: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fbbf24',
    opacity: 0.8,
  },
  accentCircle2: {
    position: 'absolute',
    bottom: -5,
    left: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ec4899',
    opacity: 0.8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 48,
    fontFamily: Fonts.extraBold,
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 6,
  },
  titleAccent: {
    fontSize: 48,
    fontFamily: Fonts.extraBold,
    color: '#fbbf24',
    letterSpacing: 2,
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 6,
  },
  subtitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#fff',
    opacity: 0.95,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    width: width * 0.65,
    alignItems: 'center',
  },
  loadingBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  version: {
    position: 'absolute',
    bottom: 50,
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
});

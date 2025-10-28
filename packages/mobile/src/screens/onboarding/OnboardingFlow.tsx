/**
 * Onboarding Flow
 * Welcome screens for new users with tutorial and practice
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_KEY = '@onboarding_completed';

interface OnboardingScreenData {
  id: string;
  title: string;
  description: string;
  image?: string;
  emoji: string;
}

const ONBOARDING_SCREENS: OnboardingScreenData[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei 1000Ravier!',
    description: 'Das beste Kartenspiel für unterwegs. Spiele mit Freunden oder fordere dich selbst heraus!',
    emoji: '🎴',
  },
  {
    id: 'how-to-play',
    title: 'So funktioniert\'s',
    description: 'Lerne die Grundlagen des Spiels kennen. Wir führen dich durch deine erste Runde!',
    emoji: '🎮',
  },
  {
    id: 'achievements',
    title: 'Erfolge freischalten',
    description: 'Sammle Erfolge, verdiene Credits und steige im Rang auf!',
    emoji: '🏆',
  },
  {
    id: 'challenges',
    title: 'Tägliche Herausforderungen',
    description: 'Jeden Tag neue Aufgaben und Belohnungen. Halte deine Serie am Leben!',
    emoji: '⚡',
  },
  {
    id: 'ready',
    title: 'Bereit zum Spielen?',
    description: 'Du bist startklar! Lass uns deine erste Partie beginnen.',
    emoji: '🚀',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SCREENS.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      onComplete(); // Complete anyway
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
      },
    }
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Skip Button */}
      {currentIndex < ONBOARDING_SCREENS.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Überspringen
          </Text>
        </TouchableOpacity>
      )}

      {/* Screens */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
      >
        {ONBOARDING_SCREENS.map((screen) => (
          <View key={screen.id} style={styles.screen}>
            <View style={styles.content}>
              {/* Emoji/Image */}
              <View style={styles.imageContainer}>
                <Text style={styles.emoji}>{screen.emoji}</Text>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {screen.title}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {screen.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {ONBOARDING_SCREENS.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Next/Get Started Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {currentIndex === ONBOARDING_SCREENS.length - 1
            ? 'Los geht\'s!'
            : 'Weiter'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 400,
  },
  imageContainer: {
    marginBottom: 48,
  },
  emoji: {
    fontSize: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    height: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    marginHorizontal: 20,
    marginBottom: 48,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

/**
 * Check if onboarding has been completed
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Reset onboarding (for testing)
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}

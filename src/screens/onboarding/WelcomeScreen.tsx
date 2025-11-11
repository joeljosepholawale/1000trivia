import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { Button } from '@/components/common/Button';
import { Fonts } from '@/styles/fonts';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: '1000 Questions',
    description: 'Challenge yourself with thousands of curated trivia questions across multiple categories',
    icon: 'psychology',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: '2',
    title: 'Real Cash Prizes',
    description: 'Win actual money! Top performers earn real cash prizes and rewards',
    icon: 'payments',
    gradient: ['#8b5cf6', '#a855f7'],
  },
  {
    id: '3',
    title: 'Live Leaderboards',
    description: 'Compete with players worldwide. Track your rank and climb to the top!',
    icon: 'leaderboard',
    gradient: ['#a855f7', '#ec4899'],
  },
  {
    id: '4',
    title: 'Start Playing Free',
    description: 'Join now and get free credits to start your trivia journey!',
    icon: 'stars',
    gradient: ['#ec4899', '#f43f5e'],
  },
];

export const WelcomeScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <LinearGradient colors={item.gradient} style={styles.iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.iconCircle}>
              <MaterialIcons name={item.icon} size={100} color="#fff" />
            </View>
            {/* Decorative dots */}
            <View style={styles.decorativeDot1} />
            <View style={styles.decorativeDot2} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

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
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      {/* Pagination */}
      {renderPagination()}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex === slides.length - 1 ? (
          <Button
            onPress={onFinish}
            variant="primary"
            size="lg"
            fullWidth
            gradient
          >
            Get Started!
          </Button>
        ) : (
          <Button
            onPress={handleNext}
            variant="primary"
            size="lg"
            fullWidth
            icon={<MaterialIcons name="arrow-forward" size={24} color={theme.colors.white} />}
            iconPosition="right"
          >
            Next
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  skipButton: {
    position: 'absolute',
    top: theme.spacing[4],
    right: theme.spacing[4],
    zIndex: 10,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  skipText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontFamily: Fonts.semiBold,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  iconContainer: {
    marginBottom: theme.spacing[12],
  },
  iconGradient: {
    width: 260,
    height: 260,
    borderRadius: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...theme.shadows.xl,
  },
  iconCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeDot1: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
    opacity: 0.9,
  },
  decorativeDot2: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    opacity: 0.8,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: Fonts.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  description: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: Fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.lg * 1.5,
    paddingHorizontal: theme.spacing[4],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[6],
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary[500],
    marginHorizontal: theme.spacing[1],
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
  },
});

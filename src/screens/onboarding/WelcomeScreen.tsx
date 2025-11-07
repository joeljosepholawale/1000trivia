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
    title: '🧠 Test Your Knowledge',
    description: 'Answer thousands of exciting questions from all knowledge areas',
    icon: 'quiz',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: '2',
    title: '💰 Win Real Money',
    description: 'Earn points and exchange them for actual cash prizes',
    icon: 'attach-money',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    title: '🏆 Compete & Conquer',
    description: 'Battle your way to the top of the leaderboard and become champion',
    icon: 'emoji-events',
    gradient: ['#4facfe', '#00f2fe'],
  },
  {
    id: '4',
    title: '🎁 Daily Rewards',
    description: 'Get free credits every day and watch ads for bonus rewards',
    icon: 'redeem',
    gradient: ['#43e97b', '#38f9d7'],
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
              <MaterialIcons name={item.icon} size={120} color={theme.colors.white} />
            </View>
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
          <Text style={styles.skipText}>Überspringen</Text>
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
            Los geht's!
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
            Weiter
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
    fontWeight: theme.typography.fontWeight.semibold,
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
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  iconCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  description: {
    fontSize: theme.typography.fontSize.lg,
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

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  StatusBar,
  Pressable,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = 20;

interface GameMode {
  id: string;
  type: 'FREE' | 'CHALLENGE' | 'TOURNAMENT' | 'SUPER_TOURNAMENT';
  name: string;
  subtitle: string;
  questions: number;
  entryFee: string;
  prizePool: string;
  gradient: string[];
  icon: keyof typeof MaterialIcons.glyphMap;
  participants: number;
  timeLeft: string;
  featured?: boolean;
}

const gameModes: GameMode[] = [
  {
    id: '1',
    type: 'FREE',
    name: 'Weekly Free Play',
    subtitle: 'Play for free and win!',
    questions: 1000,
    entryFee: 'Free',
    prizePool: '$100',
    gradient: ['#10B981', '#059669'],
    icon: 'play-circle-filled',
    participants: 1247,
    timeLeft: '3d 14h',
    featured: true,
  },
  {
    id: '2',
    type: 'CHALLENGE',
    name: 'Monthly Challenge',
    subtitle: 'Intense competition',
    questions: 100,
    entryFee: '$10',
    prizePool: '$1,000',
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'whatshot',
    participants: 342,
    timeLeft: '12d 8h',
  },
  {
    id: '3',
    type: 'TOURNAMENT',
    name: 'Grand Tournament',
    subtitle: 'For experienced players',
    questions: 1000,
    entryFee: '1000 Credits',
    prizePool: '$10,000',
    gradient: ['#3B82F6', '#2563EB'],
    icon: 'emoji-events',
    participants: 89,
    timeLeft: '18d 5h',
  },
  {
    id: '4',
    type: 'SUPER_TOURNAMENT',
    name: 'Super Championship',
    subtitle: 'Ultimate challenge',
    questions: 1000,
    entryFee: '10000 Credits',
    prizePool: '$100,000',
    gradient: ['#FFD700', '#FFA500', '#FF8C00'],
    icon: 'military-tech',
    participants: 12,
    timeLeft: '25d 3h',
  },
];

interface Props {
  onJoinMode: (modeId: string) => void;
  onBack: () => void;
}

export const EnhancedGameModeSelectionScreen: React.FC<Props> = ({ onJoinMode, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const currentMode = gameModes[currentIndex];

  const renderCard = (mode: GameMode, index: number) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={mode.id}
        style={[
          styles.cardWrapper,
          { transform: [{ scale }], opacity },
        ]}
      >
        <LinearGradient
          colors={mode.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {mode.featured && (
            <View style={styles.featuredBadge}>
              <MaterialIcons name="star" size={12} color="#FFF" />
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          )}

          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <MaterialIcons name={mode.icon} size={64} color="rgba(255,255,255,0.9)" />
            </View>

            <Text style={styles.modeName}>{mode.name}</Text>
            <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="help" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{mode.questions} Q's</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{mode.participants}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="schedule" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{mode.timeLeft}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      <LinearGradient
        colors={['#1F2937', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Choose Game Mode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Carousel */}
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { 
              useNativeDriver: false,
              listener: (event: any) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING));
                setCurrentIndex(index);
              },
            }
          )}
          scrollEventThrottle={16}
        >
          {gameModes.map((mode, index) => renderCard(mode, index))}
        </Animated.ScrollView>

        {/* Bottom Details */}
        <Animated.View style={[styles.bottomPanel, { opacity: fadeAnim }]}>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Entry Fee</Text>
                <Text style={styles.detailValue}>{currentMode.entryFee}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Prize Pool</Text>
                <Text style={styles.detailValue}>{currentMode.prizePool}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.joinButton,
                { opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => onJoinMode(currentMode.id)}
            >
              <LinearGradient
                colors={currentMode.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.joinGradient}
              >
                <Text style={styles.joinText}>Join Now</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {gameModes.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
    paddingVertical: 40,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  card: {
    borderRadius: 24,
    height: SCREEN_HEIGHT * 0.45,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  modeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  bottomPanel: {
    padding: 20,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  joinText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
});

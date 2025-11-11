import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  rank?: number;
  creditsEarned?: number;
  onHome: () => void;
  onPlayAgain: () => void;
  onShare?: () => void;
}

export const EnhancedGameResultsScreen: React.FC<Props> = ({
  score,
  totalQuestions,
  correctAnswers,
  timeSpent,
  rank,
  creditsEarned,
  onHome,
  onPlayAgain,
  onShare,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnims = useRef([...Array(20)].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    // Trophy animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Content fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Confetti animation
    confettiAnims.forEach((anim, index) => {
      const delay = index * 50;
      const duration = 2000 + Math.random() * 1000;
      
      Animated.parallel([
        Animated.timing(anim.y, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.x, {
          toValue: (Math.random() - 0.5) * 200,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();
    });
  }, []);

  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const isWinner = rank && rank <= 3;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={isWinner ? ['#FFD700', '#FFA500', '#FF8C00'] : ['#3B82F6', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        {/* Confetti */}
        {confettiAnims.map((anim, index) => {
          const rotate = anim.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });
          const translateY = anim.y.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 600],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  left: `${(index % 10) * 10}%`,
                  transform: [
                    { translateX: anim.x },
                    { translateY },
                    { rotate },
                  ],
                },
              ]}
            />
          );
        })}

        {/* Trophy/Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <MaterialIcons
            name={isWinner ? 'emoji-events' : 'check-circle'}
            size={120}
            color="#FFF"
          />
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{isWinner ? 'Victory!' : 'Well Done!'}</Text>
          <Text style={styles.subtitle}>
            {isWinner ? `You ranked #${rank}!` : 'Great effort!'}
          </Text>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.mainStat}>
              <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
              <Text style={styles.scoreLabel}>Points</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{correctAnswers}/{totalQuestions}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{percentage}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.floor(timeSpent / 60)}m</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
            </View>

            {creditsEarned && creditsEarned > 0 && (
              <View style={styles.creditsEarned}>
                <MaterialIcons name="monetization-on" size={24} color="#FFD700" />
                <Text style={styles.creditsText}>+{creditsEarned} Credits</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onShare && (
              <Pressable style={styles.shareButton} onPress={onShare}>
                <MaterialIcons name="share" size={24} color="#3B82F6" />
              </Pressable>
            )}

            <Pressable style={styles.secondaryButton} onPress={onHome}>
              <Text style={styles.secondaryButtonText}>Home</Text>
            </Pressable>

            <Pressable style={styles.primaryButton} onPress={onPlayAgain}>
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>Play Again</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  iconContainer: {
    marginBottom: 32,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    marginBottom: 24,
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
  mainStat: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  creditsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  creditsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});

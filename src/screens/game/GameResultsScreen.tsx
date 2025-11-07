import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';

import {RootState, AppDispatch} from '@/store';
import {resetGameState} from '@/store/slices/gameSlice';
import {loadLeaderboard, loadUserRank} from '@/store/slices/leaderboardSlice';
import {GameStackParamList} from '@/navigation/GameNavigator';
import {colors} from '@/styles/colors';
import {LoadingScreen} from '@/components/LoadingScreen';

type NavigationProp = NativeStackNavigationProp<GameStackParamList, 'GameResults'>;
type RouteProp = NativeStackScreenProps<GameStackParamList, 'GameResults'>['route'];

export const GameResultsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  
  const {sessionId, finalScore, rank} = route.params;
  
  const {sessionStats} = useSelector((state: RootState) => state.game);
  const {userRank, isLoading} = useSelector((state: RootState) => state.leaderboard);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const scaleAnimation = new Animated.Value(0);
  const fadeAnimation = new Animated.Value(0);

  useEffect(() => {
    loadResultData();
    animateResults();
    
    // Show confetti for good performance
    const accuracy = sessionStats.totalQuestions > 0 
      ? (sessionStats.correctAnswers / sessionStats.totalQuestions) * 100 
      : 0;
    
    if (accuracy >= 70 || (rank && rank <= 10)) {
      setShowConfetti(true);
    }
  }, []);

  const loadResultData = async () => {
    try {
      await Promise.all([
        dispatch(loadLeaderboard()),
        dispatch(loadUserRank()),
      ]);
    } catch (error) {
      console.error('Failed to load result data:', error);
    }
  };

  const animateResults = () => {
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePlayAgain = () => {
    dispatch(resetGameState());
    navigation.navigate('GameModeSelection');
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('LeaderboardTab' as never);
  };

  const handleGoHome = () => {
    dispatch(resetGameState());
    navigation.navigate('HomeTab' as never);
  };

  const getPerformanceMessage = () => {
    const accuracy = sessionStats.totalQuestions > 0 
      ? (sessionStats.correctAnswers / sessionStats.totalQuestions) * 100 
      : 0;

    if (accuracy >= 90) return { message: "Outstanding! 🎉", color: colors.success };
    if (accuracy >= 80) return { message: "Excellent! 👏", color: colors.primary };
    if (accuracy >= 70) return { message: "Great job! 👍", color: colors.secondary };
    if (accuracy >= 60) return { message: "Good effort! 😊", color: colors.warning };
    return { message: "Keep practicing! 💪", color: colors.textSecondary };
  };

  const getRankMessage = () => {
    if (!rank) return null;
    
    if (rank === 1) return { message: "🏆 Champion!", color: colors.accent };
    if (rank <= 3) return { message: "🥉 Top 3!", color: colors.secondary };
    if (rank <= 10) return { message: "🔝 Top 10!", color: colors.primary };
    if (rank <= 50) return { message: "📈 Top 50!", color: colors.success };
    return { message: `#${rank}`, color: colors.textSecondary };
  };

  const accuracy = sessionStats.totalQuestions > 0 
    ? Math.round((sessionStats.correctAnswers / sessionStats.totalQuestions) * 100) 
    : 0;

  const performance = getPerformanceMessage();
  const rankInfo = getRankMessage();

  if (isLoading && !userRank) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Confetti Effect */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            <Text style={styles.confetti}>🎉 🎊 ✨ 🌟 🎉</Text>
          </View>
        )}

        {/* Main Results Card */}
        <Animated.View 
          style={[
            styles.resultsCard,
            {
              transform: [{scale: scaleAnimation}],
              opacity: fadeAnimation,
            }
          ]}
        >
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.scoreValue}>{finalScore}</Text>
            <Text style={[styles.performanceMessage, {color: performance.color}]}>
              {performance.message}
            </Text>
          </View>

          {rankInfo && (
            <View style={styles.rankContainer}>
              <MaterialIcons name="leaderboard" size={24} color={rankInfo.color} />
              <Text style={[styles.rankText, {color: rankInfo.color}]}>
                {rankInfo.message}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Stats Section */}
        <Animated.View style={[styles.statsCard, {opacity: fadeAnimation}]}>
          <Text style={styles.statsTitle}>Performance Summary</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="quiz" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{sessionStats.answeredQuestions}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text style={styles.statValue}>{sessionStats.correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="percent" size={24} color={colors.secondary} />
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  {
                    width: `${accuracy}%`,
                    backgroundColor: performance.color,
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{accuracy}% Accuracy</Text>
          </View>
        </Animated.View>

        {/* Leaderboard Position */}
        {userRank && (
          <Animated.View style={[styles.leaderboardCard, {opacity: fadeAnimation}]}>
            <View style={styles.leaderboardHeader}>
              <MaterialIcons name="emoji-events" size={24} color={colors.accent} />
              <Text style={styles.leaderboardTitle}>Leaderboard Position</Text>
            </View>
            
            <View style={styles.leaderboardStats}>
              <View style={styles.leaderboardStat}>
                <Text style={styles.leaderboardStatValue}>#{userRank.position}</Text>
                <Text style={styles.leaderboardStatLabel}>Your Rank</Text>
              </View>
              
              <View style={styles.leaderboardStat}>
                <Text style={styles.leaderboardStatValue}>{userRank.totalParticipants}</Text>
                <Text style={styles.leaderboardStatLabel}>Total Players</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.viewLeaderboardButton} onPress={handleViewLeaderboard}>
              <Text style={styles.viewLeaderboardText}>View Full Leaderboard</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View style={[styles.actionsContainer, {opacity: fadeAnimation}]}>
          <TouchableOpacity style={styles.primaryButton} onPress={handlePlayAgain}>
            <MaterialIcons name="refresh" size={20} color={colors.textWhite} />
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewLeaderboard}>
            <MaterialIcons name="leaderboard" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Leaderboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <MaterialIcons name="home" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Home</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Encouragement Message */}
        <View style={styles.encouragementContainer}>
          <Text style={styles.encouragementText}>
            {accuracy >= 80 
              ? "Amazing performance! Keep up the great work!" 
              : "Great effort! Practice makes perfect - try again to improve your score!"
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  confetti: {
    fontSize: 24,
    textAlign: 'center',
  },
  resultsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  performanceMessage: {
    fontSize: 18,
    fontWeight: '600',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  leaderboardCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  leaderboardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  leaderboardStat: {
    alignItems: 'center',
  },
  leaderboardStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
  },
  leaderboardStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  viewLeaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    gap: 8,
  },
  viewLeaderboardText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  encouragementContainer: {
    padding: 20,
    marginBottom: 20,
  },
  encouragementText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
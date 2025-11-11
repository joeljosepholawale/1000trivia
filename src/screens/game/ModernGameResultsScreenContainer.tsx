import React, {useEffect} from 'react';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {Share, Alert} from 'react-native';
import {RootState, AppDispatch} from '@/store';
import {GameStackParamList} from '@/navigation/GameNavigator';
import {ModernGameResultsScreen} from './ModernGameResultsScreen';
import {resetGameState} from '@/store/slices/gameSlice';
import {notifyGameResults} from '@/services/notifications';

type NavigationProp = NativeStackNavigationProp<GameStackParamList, 'GameResults'>;
type RouteProps = RouteProp<GameStackParamList, 'GameResults'>;

export const ModernGameResultsScreenContainer = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const dispatch = useDispatch<AppDispatch>();

  const {sessionId, finalScore, rank} = route.params;
  const {sessionStats, currentSession} = useSelector((state: RootState) => state.game);

  // Send notification about game results
  useEffect(() => {
    const earnedCredits = calculateEarnedCredits();
    notifyGameResults(finalScore, rank, earnedCredits);
  }, [finalScore, rank]);

  // Calculate stats
  const totalQuestions = sessionStats.totalQuestions || 10;
  const correctAnswers = sessionStats.correctAnswers;
  const incorrectAnswers = sessionStats.answeredQuestions - correctAnswers;
  const skippedAnswers = totalQuestions - sessionStats.answeredQuestions;
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  // Calculate time taken (if available in session)
  const timeTaken = currentSession?.completedAt && currentSession?.startedAt
    ? Math.floor((new Date(currentSession.completedAt).getTime() - new Date(currentSession.startedAt).getTime()) / 1000)
    : 0;

  // Calculate earned credits based on performance
  const calculateEarnedCredits = () => {
    // Base credits for completion
    let credits = 10;
    
    // Bonus for accuracy
    if (accuracy >= 90) credits += 50;
    else if (accuracy >= 80) credits += 30;
    else if (accuracy >= 70) credits += 20;
    else if (accuracy >= 60) credits += 10;
    
    // Bonus for rank (if in top 10)
    if (rank && rank <= 10) {
      credits += (11 - rank) * 5; // Top 1 gets 50 bonus, top 10 gets 5 bonus
    }
    
    return credits;
  };

  const stats = {
    score: finalScore,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    skippedAnswers,
    timeTaken,
    accuracy,
    rank,
    earnedCredits: calculateEarnedCredits(),
  };

  const handlePlayAgain = () => {
    // Reset game state and go back to mode selection
    dispatch(resetGameState());
    navigation.navigate('GameModeSelection');
  };

  const handleViewLeaderboard = () => {
    // Navigate to leaderboard (may need to go to main tab)
    dispatch(resetGameState());
    navigation.getParent()?.navigate('Leaderboard');
  };

  const handleBackToHome = () => {
    // Reset game state and go to home
    dispatch(resetGameState());
    navigation.getParent()?.navigate('Home');
  };

  const handleShare = async () => {
    try {
      const message = `🎮 I just scored ${finalScore} points in 1000 Ravier!\n` +
        `📊 Accuracy: ${accuracy}%\n` +
        `✅ Correct: ${correctAnswers}/${totalQuestions}\n` +
        (rank ? `🏆 Rank: #${rank}\n` : '') +
        `\nCan you beat my score?`;

      const result = await Share.share({
        message,
      });

      if (result.action === Share.sharedAction) {
        // Results shared successfully
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share results');
    }
  };

  return (
    <ModernGameResultsScreen
      stats={stats}
      isNewHighScore={false} // TODO: Track and compare with user's best score
      onPlayAgain={handlePlayAgain}
      onViewLeaderboard={handleViewLeaderboard}
      onBackToHome={handleBackToHome}
      onShare={handleShare}
    />
  );
};

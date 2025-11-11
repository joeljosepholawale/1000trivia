import React, {useEffect, useState, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Alert, ActivityIndicator, View, StyleSheet} from 'react-native';
import {RootState, AppDispatch} from '@/store';
import {GameStackParamList} from '@/navigation/GameNavigator';
import {getNextQuestion, submitAnswer, endSession, resetGameState} from '@/store/slices/gameSlice';
import {ModernGameplayScreen} from './ModernGameplayScreen';

type NavigationProp = NativeStackNavigationProp<GameStackParamList, 'Gameplay'>;
type RouteProps = RouteProp<GameStackParamList, 'Gameplay'>;

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export const ModernGameplayScreenContainer = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const dispatch = useDispatch<AppDispatch>();

  const {sessionId, modeId} = route.params;
  const {currentSession, currentQuestion, currentQuestionIndex, sessionStats, isLoading} = useSelector(
    (state: RootState) => state.game
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  // Load first question on mount
  useEffect(() => {
    loadQuestion();
  }, [sessionId]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const result = await dispatch(getNextQuestion(sessionId)).unwrap();
      
      // Add question to list
      const newQuestion: Question = {
        id: result.question.id,
        text: result.question.text,
        options: result.question.options.map(opt => opt.text),
        correctAnswer: result.question.correctAnswer || result.question.options[result.question.correctOptionIndex || 0].text,
      };
      
      setQuestions(prev => [...prev, newQuestion]);
      setStartTime(Date.now());
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load question';
      Alert.alert('Error', errorMessage, [
        {text: 'Retry', onPress: loadQuestion},
        {text: 'End Game', onPress: handleEndSession, style: 'cancel'},
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const currentQ = questions[questions.length - 1];
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Find the selected option ID (for now, use the answer text)
      const selectedOptionId = currentQ.options.indexOf(answer).toString();

      // Submit answer to backend
      const result = await dispatch(
        submitAnswer({
          sessionId,
          questionId: currentQ.id,
          selectedOptionId,
          timeSpent,
        })
      ).unwrap();

      // Check if session is complete
      if (result.sessionComplete) {
        // Navigate to results
        setTimeout(() => {
          handleEndSession();
        }, 1500);
      } else {
        // Load next question
        setTimeout(() => {
          loadQuestion();
        }, 1500);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // For now, treat skip as loading next question
    loadQuestion();
  };

  const handleTimeUp = () => {
    // Auto-submit with no answer
    handleAnswerSelect('');
  };

  const handleQuit = () => {
    handleEndSession();
  };

  const handleEndSession = async () => {
    try {
      const result = await dispatch(endSession(sessionId)).unwrap();
      
      // Navigate to results screen
      navigation.replace('GameResults', {
        sessionId,
        finalScore: result.finalScore,
        rank: result.rank,
      });
    } catch (error: any) {
      // Silently handle session end error
      navigation.goBack();
    }
  };

  // Show loading state while fetching first question
  if (loading && questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Get current question
  const currentQ = questions[questions.length - 1];
  if (!currentQ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ModernGameplayScreen
      questions={questions}
      currentQuestionIndex={questions.length - 1}
      totalQuestions={sessionStats.totalQuestions || 10}
      timePerQuestion={30}
      score={sessionStats.score}
      correctAnswers={sessionStats.correctAnswers}
      onAnswerSelect={handleAnswerSelect}
      onSkip={handleSkip}
      onTimeUp={handleTimeUp}
      onQuit={handleQuit}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

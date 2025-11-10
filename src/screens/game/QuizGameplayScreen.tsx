import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import {apiClient} from '@/services/api/client';

type Question = {
  id: string;
  text: string;  // Backend returns 'text' not 'question'
  options: string[];
  correctAnswer?: number;  // May not be sent to client
  timeLimit: number;
};

type GameSession = {
  sessionId: string;
  questions: Question[];
  currentQuestionIndex: number;
};

export const QuizGameplayScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {gameModeId} = route.params as {gameModeId: string};

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    startGameSession();
  }, []);

  useEffect(() => {
    if (!loading && session && !showResult) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, session, showResult, session?.currentQuestionIndex]);

  const startGameSession = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/game/start', {
        gameModeId,
      });

      if (response.success && response.data) {
        // Check if questions are available
        if (!response.data.questions || response.data.questions.length === 0) {
          Alert.alert('Error', 'No questions available. Please try again later.');
          navigation.goBack();
          return;
        }
        
        setSession({
          sessionId: response.data.sessionId,
          questions: response.data.questions,
          currentQuestionIndex: 0,
        });
        setTimeRemaining(response.data.questions[0]?.timeLimit || 30);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to start game');
        navigation.goBack();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to start game session');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    if (!showResult) {
      submitAnswer(null);
    }
  };

  const submitAnswer = async (answerIndex: number | null) => {
    if (!session) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];

    try {
      // Submit answer to backend to check if correct
      const response = await apiClient.post('/game/answer', {
        sessionId: session.sessionId,
        questionId: currentQuestion.id,
        answer: answerIndex !== null ? currentQuestion.options[answerIndex] : null,
        timeSpent: currentQuestion.timeLimit - timeRemaining,
      });

      setShowResult(true);
      
      // Backend tells us if correct
      if (response.success && response.data?.isCorrect) {
        setCorrectAnswers((prev) => prev + 1);
        setScore((prev) => prev + 10);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to submit answer');
      return;
    }

    setTimeout(() => {
      if (session.currentQuestionIndex + 1 < session.questions.length) {
        // Next question
        const nextIndex = session.currentQuestionIndex + 1;
        setSession({
          ...session,
          currentQuestionIndex: nextIndex,
        });
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeRemaining(session.questions[nextIndex]?.timeLimit || 30);
      } else {
        // Game complete
        completeGame();
      }
    }, 2000);
  };

  const completeGame = async () => {
    if (!session) return;

    try {
      const response = await apiClient.post('/game/complete', {
        sessionId: session.sessionId,
      });

      if (response.success && response.data) {
        Alert.alert(
          'Game Complete!',
          `Score: ${score}\nCorrect: ${correctAnswers}/${session.questions.length}\nEarnings: ${response.data.earnings} credits`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('HomeTab' as never),
            },
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to complete game');
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult || selectedAnswer !== null) return;
    setSelectedAnswer(index);
    submitAnswer(index);
  };

  const handleQuit = () => {
    Alert.alert(
      'Quit Game?',
      'Are you sure you want to quit? Your progress will be lost.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Starting game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return null;
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
          <MaterialIcons name="close" size={24} color="#dc2626" />
        </TouchableOpacity>
        <View style={styles.scoreContainer}>
          <MaterialIcons name="stars" size={20} color="#f59e0b" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, {width: `${progress}%`}]} />
      </View>

      {/* Question Counter */}
      <Text style={styles.questionCounter}>
        Question {session.currentQuestionIndex + 1} of {session.questions.length}
      </Text>

      {/* Timer */}
      <LinearGradient
        colors={timeRemaining <= 5 ? ['#dc2626', '#ef4444'] : ['#6366f1', '#8b5cf6']}
        style={styles.timerContainer}
      >
        <MaterialIcons name="timer" size={24} color="#fff" />
        <Text style={styles.timerText}>{timeRemaining}s</Text>
      </LinearGradient>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
      </View>

      {/* Answer Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          let backgroundColor = '#fff';
          let borderColor = '#e5e7eb';
          let textColor = '#111827';

          // Highlight selected answer
          if (index === selectedAnswer && !showResult) {
            backgroundColor = '#ede9fe';
            borderColor = '#6366f1';
          }
          // After submission, show if selected answer was correct or wrong
          if (showResult && index === selectedAnswer) {
            // We'll update this when we get the result from backend
            backgroundColor = '#f3f4f6';  // Gray for now
            borderColor = '#9ca3af';
          }

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                {backgroundColor, borderColor},
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={showResult || selectedAnswer !== null}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionCircle, {borderColor}]}>
                  <Text style={[styles.optionLetter, {color: textColor}]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[styles.optionText, {color: textColor}]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <MaterialIcons name="check-circle" size={20} color="#16a34a" />
          <Text style={styles.statText}>{correctAnswers} correct</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="cancel" size={20} color="#dc2626" />
          <Text style={styles.statText}>
            {session.currentQuestionIndex - correctAnswers} wrong
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  questionCounter: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  questionContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '600',
  },
});

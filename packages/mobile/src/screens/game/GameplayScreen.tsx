import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';

import {RootState, AppDispatch} from '@/store';
import {
  getNextQuestion,
  submitAnswer,
  pauseSession,
  updateTimeRemaining,
  selectAnswer,
} from '@/store/slices/gameSlice';
import {GameStackParamList} from '@/navigation/GameNavigator';
import {colors} from '@/styles/colors';
import {LoadingScreen} from '@/components/LoadingScreen';
import type {Question} from '@1000ravier/shared';

type NavigationProp = NativeStackNavigationProp<GameStackParamList, 'Gameplay'>;
type RouteProp = NativeStackScreenProps<GameStackParamList, 'Gameplay'>['route'];

const {width} = Dimensions.get('window');

export const GameplayScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  
  const {sessionId, modeId} = route.params;
  
  const {
    currentSession,
    currentQuestion,
    currentQuestionIndex,
    timeRemaining,
    sessionStats,
    userAnswers,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.game);
  
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimation = useRef(new Animated.Value(1)).current;

  // Handle back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handlePauseGame();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [])
  );

  useEffect(() => {
    if (!currentQuestion && currentSession) {
      loadNextQuestion();
    }
  }, [currentSession]);

  useEffect(() => {
    if (currentQuestion && timeRemaining > 0) {
      startTimer();
      startProgressAnimation();
      setQuestionStartTime(Date.now());
      setSelectedOptionId(null);
      setShowFeedback(false);
      setFeedbackData(null);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion]);

  useEffect(() => {
    if (timeRemaining === 0 && currentQuestion && !isSubmitting) {
      handleTimeUp();
    }
  }, [timeRemaining]);

  const loadNextQuestion = async () => {
    if (!currentSession) return;
    
    try {
      await dispatch(getNextQuestion(currentSession.id)).unwrap();
    } catch (error: any) {
      if (error.includes('completed') || error.includes('finished')) {
        // Session is complete, navigate to results
        navigation.replace('GameResults', {
          sessionId: currentSession.id,
          finalScore: sessionStats.score,
        });
      } else {
        Alert.alert('Error', error || 'Failed to load question');
      }
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      dispatch(updateTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        return newTime;
      }));
    }, 1000);
  };

  const startProgressAnimation = () => {
    progressAnimation.setValue(1);
    
    Animated.timing(progressAnimation, {
      toValue: 0,
      duration: timeRemaining * 1000,
      useNativeDriver: false,
    }).start();
  };

  const handleAnswerSelect = (optionId: string) => {
    if (showFeedback || isSubmitting) return;
    
    setSelectedOptionId(optionId);
    dispatch(selectAnswer({
      questionId: currentQuestion!.id,
      selectedOptionId: optionId,
    }));
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedOptionId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    try {
      const result = await dispatch(submitAnswer({
        sessionId: currentSession!.id,
        questionId: currentQuestion.id,
        selectedOptionId,
        timeSpent,
      })).unwrap();
      
      // Show feedback
      setFeedbackData({
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      });
      setShowFeedback(true);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Auto-advance after showing feedback
      setTimeout(() => {
        if (result.sessionComplete) {
          navigation.replace('GameResults', {
            sessionId: currentSession!.id,
            finalScore: result.currentScore,
          });
        } else {
          loadNextQuestion();
        }
      }, 3000);
      
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to submit answer');
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = async () => {
    if (isSubmitting) return;
    
    // Auto-submit with no answer
    if (currentQuestion) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      
      try {
        const result = await dispatch(submitAnswer({
          sessionId: currentSession!.id,
          questionId: currentQuestion.id,
          selectedOptionId: selectedOptionId || '', // Empty if no selection
          timeSpent,
        })).unwrap();
        
        setFeedbackData({
          isCorrect: false,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
        });
        setShowFeedback(true);
        
        setTimeout(() => {
          if (result.sessionComplete) {
            navigation.replace('GameResults', {
              sessionId: currentSession!.id,
              finalScore: result.currentScore,
            });
          } else {
            loadNextQuestion();
          }
        }, 3000);
        
      } catch (error: any) {
        Alert.alert('Error', error || 'Failed to handle time up');
      }
    }
  };

  const handlePauseGame = () => {
    Alert.alert(
      'Pause Game',
      'Do you want to pause this game? You can resume later.',
      [
        {text: 'Continue Playing', style: 'cancel'},
        {
          text: 'Pause Game',
          style: 'destructive',
          onPress: async () => {
            try {
              if (currentSession) {
                await dispatch(pauseSession(currentSession.id));
              }
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to pause game');
            }
          },
        },
      ]
    );
  };

  const renderOption = (option: Question['options'][0], index: number) => {
    const isSelected = selectedOptionId === option.id;
    const isCorrect = showFeedback && feedbackData?.correctAnswer === option.id;
    const isWrong = showFeedback && isSelected && !isCorrect;
    
    let optionStyle = styles.option;
    let textStyle = styles.optionText;
    
    if (showFeedback) {
      if (isCorrect) {
        optionStyle = [styles.option, styles.correctOption];
        textStyle = [styles.optionText, styles.correctOptionText];
      } else if (isWrong) {
        optionStyle = [styles.option, styles.wrongOption];
        textStyle = [styles.optionText, styles.wrongOptionText];
      } else {
        optionStyle = [styles.option, styles.disabledOption];
        textStyle = [styles.optionText, styles.disabledOptionText];
      }
    } else if (isSelected) {
      optionStyle = [styles.option, styles.selectedOption];
      textStyle = [styles.optionText, styles.selectedOptionText];
    }
    
    return (
      <TouchableOpacity
        key={option.id}
        style={optionStyle}
        onPress={() => handleAnswerSelect(option.id)}
        disabled={showFeedback || isSubmitting}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionLetter}>
            <Text style={textStyle}>
              {String.fromCharCode(65 + index)}
            </Text>
          </View>
          <Text style={[textStyle, styles.optionTextContent]}>
            {option.text}
          </Text>
          {showFeedback && isCorrect && (
            <MaterialIcons name="check-circle" size={24} color={colors.success} />
          )}
          {showFeedback && isWrong && (
            <MaterialIcons name="cancel" size={24} color={colors.error} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !currentQuestion) {
    return <LoadingScreen />;
  }

  if (!currentQuestion || !currentSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color={colors.error} />
          <Text style={styles.errorText}>Failed to load question</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNextQuestion}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePauseGame} style={styles.pauseButton}>
          <MaterialIcons name="pause" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.progressInfo}>
          <Text style={styles.questionNumber}>
            {currentQuestionIndex + 1} / {sessionStats.totalQuestions}
          </Text>
          <Text style={styles.score}>Score: {sessionStats.score}</Text>
        </View>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <View style={styles.timerBar}>
          <Animated.View
            style={[
              styles.timerFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: timeRemaining > 10 ? colors.primary : colors.error,
              },
            ]}
          />
        </View>
        <Text style={[
          styles.timerText,
          timeRemaining <= 10 && styles.timerTextUrgent,
        ]}>
          {timeRemaining}s
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => renderOption(option, index))}
      </View>

      {/* Feedback */}
      {showFeedback && feedbackData && (
        <View style={styles.feedbackContainer}>
          <View style={[
            styles.feedbackCard,
            feedbackData.isCorrect ? styles.correctFeedback : styles.wrongFeedback,
          ]}>
            <View style={styles.feedbackHeader}>
              <MaterialIcons 
                name={feedbackData.isCorrect ? "check-circle" : "cancel"} 
                size={24} 
                color={feedbackData.isCorrect ? colors.success : colors.error} 
              />
              <Text style={[
                styles.feedbackTitle,
                feedbackData.isCorrect ? styles.correctFeedbackText : styles.wrongFeedbackText,
              ]}>
                {feedbackData.isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
            {feedbackData.explanation && (
              <Text style={styles.feedbackExplanation}>
                {feedbackData.explanation}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Submit Button */}
      {!showFeedback && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedOptionId || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAnswer}
            disabled={!selectedOptionId || isSubmitting}
          >
            <Text style={[
              styles.submitButtonText,
              (!selectedOptionId || isSubmitting) && styles.submitButtonTextDisabled,
            ]}>
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pauseButton: {
    padding: 8,
  },
  progressInfo: {
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  score: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timerContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  timerBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  timerFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  timerTextUrgent: {
    color: colors.error,
  },
  questionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  option: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  correctOption: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  wrongOption: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectedOptionText: {
    color: colors.primary,
  },
  correctOptionText: {
    color: colors.success,
  },
  wrongOptionText: {
    color: colors.error,
  },
  disabledOptionText: {
    color: colors.textLight,
  },
  optionTextContent: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  feedbackCard: {
    borderRadius: 12,
    padding: 16,
  },
  correctFeedback: {
    backgroundColor: colors.successLight,
  },
  wrongFeedback: {
    backgroundColor: colors.errorLight,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  correctFeedbackText: {
    color: colors.success,
  },
  wrongFeedbackText: {
    color: colors.error,
  },
  feedbackExplanation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  submitButtonTextDisabled: {
    color: colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { ProgressBar } from '@/components/common/ProgressBar';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface ModernGameplayScreenProps {
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  timePerQuestion?: number;
  score: number;
  correctAnswers: number;
  onAnswerSelect: (answer: string) => void;
  onSkip: () => void;
  onTimeUp: () => void;
  onQuit: () => void;
}

export const ModernGameplayScreen: React.FC<ModernGameplayScreenProps> = ({
  questions,
  currentQuestionIndex,
  totalQuestions,
  timePerQuestion = 25,
  score,
  correctAnswers,
  onAnswerSelect,
  onSkip,
  onTimeUp,
  onQuit,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const questionAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  useEffect(() => {
    // Animate question entrance
    questionAnim.setValue(0);
    Animated.spring(questionAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [currentQuestionIndex]);

  const handleAnswerPress = (answer: string) => {
    if (selectedAnswer || showResult) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // Animate result
    Animated.spring(resultAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Auto-proceed after 1.5 seconds
    setTimeout(() => {
      setSelectedAnswer(null);
      setShowResult(false);
      resultAnim.setValue(0);
      onAnswerSelect(answer);
    }, 1500);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Question',
      'Do you really want to skip this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: onSkip,
        },
      ]
    );
  };

  const handleQuit = () => {
    Alert.alert(
      'Quit Game',
      'Do you really want to quit the game? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: onQuit,
        },
      ]
    );
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) return styles.option;

    if (option === selectedAnswer) {
      return [
        styles.option,
        isCorrect ? styles.optionCorrect : styles.optionIncorrect,
      ];
    }

    if (option === currentQuestion.correctAnswer) {
      return [styles.option, styles.optionCorrect];
    }

    return [styles.option, styles.optionFaded];
  };

  const getOptionIcon = (option: string, index: number) => {
    const letter = String.fromCharCode(65 + index); // A, B, C, D

    if (!showResult) {
      return (
        <View style={styles.optionIconCircle}>
          <Text style={styles.optionIconText}>{letter}</Text>
        </View>
      );
    }

    if (option === selectedAnswer && isCorrect) {
      return (
        <View style={[styles.optionIconCircle, styles.optionIconCorrect]}>
          <MaterialIcons name="check" size={24} color={theme.colors.white} />
        </View>
      );
    }

    if (option === selectedAnswer && !isCorrect) {
      return (
        <View style={[styles.optionIconCircle, styles.optionIconIncorrect]}>
          <MaterialIcons name="close" size={24} color={theme.colors.white} />
        </View>
      );
    }

    if (option === currentQuestion.correctAnswer) {
      return (
        <View style={[styles.optionIconCircle, styles.optionIconCorrect]}>
          <MaterialIcons name="check" size={24} color={theme.colors.white} />
        </View>
      );
    }

    return (
      <View style={styles.optionIconCircle}>
        <Text style={styles.optionIconText}>{letter}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1}/{totalQuestions}
          </Text>
          <ProgressBar
            progress={progress}
            height={4}
            gradient
            gradientColors={[theme.colors.primary[400], theme.colors.primary[600]]}
            animated
            style={styles.progressBar}
          />
        </View>

        {/* Quit Button */}
        <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
          <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialIcons name="star" size={20} color={theme.colors.secondary[500]} />
          <Text style={styles.statText}>{score} Points</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="check-circle" size={20} color={theme.colors.success[500]} />
          <Text style={styles.statText}>{correctAnswers} Correct</Text>
        </View>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <CountdownTimer
          seconds={timePerQuestion}
          size={100}
          color={theme.colors.primary[500]}
          warningColor={theme.colors.error[500]}
          warningThreshold={5}
          onComplete={onTimeUp}
          showProgress
          strokeWidth={8}
        />
      </View>

      {/* Question Card */}
      <Animated.View
        style={[
          styles.questionCard,
          {
            opacity: questionAnim,
            transform: [
              {
                translateY: questionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.white, theme.colors.gray[50]]}
          style={styles.questionGradient}
        >
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleAnswerPress(option)}
            disabled={showResult}
            activeOpacity={0.8}
          >
            <View style={getOptionStyle(option)}>
              {getOptionIcon(option, index)}
              <Text
                style={[
                  styles.optionText,
                  showResult && option === selectedAnswer && !isCorrect && styles.optionTextIncorrect,
                  showResult && option === currentQuestion.correctAnswer && styles.optionTextCorrect,
                ]}
              >
                {option}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result Feedback */}
      {showResult && (
        <Animated.View
          style={[
            styles.resultOverlay,
            {
              opacity: resultAnim,
              transform: [
                {
                  scale: resultAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={isCorrect
              ? [theme.colors.success[400], theme.colors.success[600]]
              : [theme.colors.error[400], theme.colors.error[600]]}
            style={styles.resultBadge}
          >
            <MaterialIcons
              name={isCorrect ? 'check-circle' : 'cancel'}
              size={48}
              color={theme.colors.white}
            />
            <Text style={styles.resultText}>
              {isCorrect ? 'Correct!' : 'Wrong!'}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Skip Button */}
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipButtonText}>Skip</Text>
        <MaterialIcons name="skip-next" size={20} color={theme.colors.text.secondary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  progressContainer: {
    flex: 1,
    marginRight: theme.spacing[4],
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  progressBar: {
    marginTop: theme.spacing[1],
  },
  quitButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[6],
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[4],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  statText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing[6],
  },
  questionCard: {
    marginHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  questionGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    ...theme.shadows.lg,
  },
  questionText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.xl * 1.5,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[3],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    ...theme.shadows.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  optionCorrect: {
    backgroundColor: theme.colors.success[50],
    borderColor: theme.colors.success[500],
  },
  optionIncorrect: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[500],
  },
  optionFaded: {
    opacity: 0.5,
  },
  optionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  optionIconCorrect: {
    backgroundColor: theme.colors.success[500],
  },
  optionIconIncorrect: {
    backgroundColor: theme.colors.error[500],
  },
  optionIconText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  optionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  optionTextCorrect: {
    color: theme.colors.success[700],
    fontWeight: theme.typography.fontWeight.bold,
  },
  optionTextIncorrect: {
    color: theme.colors.error[700],
  },
  resultOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    zIndex: 1000,
  },
  resultBadge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows['2xl'],
  },
  resultText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
    marginTop: theme.spacing[2],
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
    paddingVertical: theme.spacing[4],
  },
  skipButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
});

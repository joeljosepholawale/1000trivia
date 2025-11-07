import React, { useEffect, useRef, useState } from 'react';
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

interface Answer {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  answers: Answer[];
  correctAnswerId: string;
}

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  score: number;
  onAnswer: (answerId: string) => void;
  onTimeUp?: () => void;
}

export const EnhancedGameplayScreen: React.FC<Props> = ({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  score,
  onAnswer,
  onTimeUp,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(timeRemaining)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const answerAnims = useRef(
    question.answers.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Reset animations on question change
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    setSelectedAnswer(null);
    setIsCorrect(null);

    // Question transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger answer appearance
    Animated.stagger(
      100,
      answerAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      )
    ).start();

    // Progress bar
    Animated.timing(progressAnim, {
      toValue: questionNumber / totalQuestions,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [question.id]);

  useEffect(() => {
    // Timer countdown
    const interval = setInterval(() => {
      Animated.timing(timerAnim, {
        toValue: timerAnim._value - 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, 1000);

    // Pulse when time is running low
    if (timeRemaining <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleAnswerPress = (answerId: string) => {
    if (selectedAnswer) return; // Already answered

    setSelectedAnswer(answerId);
    const correct = answerId === question.correctAnswerId;
    setIsCorrect(correct);

    // Answer feedback animation
    setTimeout(() => {
      onAnswer(answerId);
    }, 1500);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const timerColor = timerAnim.interpolate({
    inputRange: [0, 10, 30],
    outputRange: ['#EF4444', '#F59E0B', '#10B981'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#1E293B', '#334155', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Question {questionNumber}/{totalQuestions}
            </Text>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <MaterialIcons name="emoji-events" size={20} color="#FFD700" />
              <Text style={styles.statText}>{score.toLocaleString()}</Text>
            </View>

            <Animated.View
              style={[
                styles.timerContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Animated.Text
                style={[
                  styles.timerText,
                  { color: timerColor },
                ]}
              >
                {timeRemaining}s
              </Animated.Text>
            </Animated.View>
          </View>
        </View>

        {/* Question */}
        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.questionText}>{question.text}</Text>
        </Animated.View>

        {/* Answers */}
        <View style={styles.answersContainer}>
          {question.answers.map((answer, index) => {
            const isSelected = selectedAnswer === answer.id;
            const showFeedback = selectedAnswer !== null;
            const isCorrectAnswer = answer.id === question.correctAnswerId;

            let backgroundColor = '#334155';
            let borderColor = '#475569';
            
            if (showFeedback) {
              if (isSelected) {
                backgroundColor = isCorrect ? '#10B98150' : '#EF444450';
                borderColor = isCorrect ? '#10B981' : '#EF4444';
              } else if (isCorrectAnswer) {
                backgroundColor = '#10B98130';
                borderColor = '#10B981';
              }
            }

            return (
              <Animated.View
                key={answer.id}
                style={[
                  {
                    opacity: answerAnims[index],
                    transform: [
                      {
                        translateY: answerAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.answerButton,
                    { backgroundColor, borderColor },
                  ]}
                  onPress={() => handleAnswerPress(answer.id)}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={styles.answerText}>{answer.text}</Text>
                  {showFeedback && isSelected && (
                    <MaterialIcons
                      name={isCorrect ? 'check-circle' : 'cancel'}
                      size={24}
                      color={isCorrect ? '#10B981' : '#EF4444'}
                    />
                  )}
                  {showFeedback && !isSelected && isCorrectAnswer && (
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color="#10B981"
                    />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
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
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  timerContainer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
  },
  questionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
  },
  answersContainer: {
    gap: 12,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 24,
  },
});

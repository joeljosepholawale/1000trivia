import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

interface GameStats {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  timeTaken: number; // in seconds
  accuracy: number; // percentage
  rank?: number;
  earnedCredits?: number;
}

interface ModernGameResultsScreenProps {
  stats: GameStats;
  isNewHighScore?: boolean;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onBackToHome: () => void;
  onShare?: () => void;
}

export const ModernGameResultsScreen: React.FC<ModernGameResultsScreenProps> = ({
  stats,
  isNewHighScore = false,
  onPlayAgain,
  onViewLeaderboard,
  onBackToHome,
  onShare,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  const isExcellent = stats.accuracy >= 80;
  const isGood = stats.accuracy >= 60;

  useEffect(() => {
    // Main animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation for excellent performance
    if (isExcellent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const getPerformanceMessage = () => {
    if (stats.accuracy >= 90) return '🎉 Ausgezeichnet!';
    if (stats.accuracy >= 80) return '✨ Sehr gut!';
    if (stats.accuracy >= 70) return '👍 Gut gemacht!';
    if (stats.accuracy >= 50) return '💪 Nicht schlecht!';
    return '📚 Weiter üben!';
  };

  const getPerformanceGradient = () => {
    if (isExcellent) return [theme.colors.success[400], theme.colors.success[600]];
    if (isGood) return [theme.colors.info[400], theme.colors.info[600]];
    return [theme.colors.warning[400], theme.colors.warning[600]];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderConfetti = () => {
    if (!isExcellent) return null;

    return (
      <View style={styles.confettiContainer} pointerEvents="none">
        {[...Array(20)].map((_, index) => {
          const translateY = confettiAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 600],
          });
          
          const rotate = confettiAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '720deg'],
          });

          const left = Math.random() * 100;
          const color = [
            theme.colors.secondary[500],
            theme.colors.primary[500],
            theme.colors.success[500],
            theme.colors.warning[500],
          ][index % 4];

          return (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  left: `${left}%`,
                  backgroundColor: color,
                  transform: [{ translateY }, { rotate }],
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
      
      {renderConfetti()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={getPerformanceGradient()}
            style={styles.trophy}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="emoji-events" size={80} color={theme.colors.white} />
          </LinearGradient>
          <Text style={styles.congratsText}>{getPerformanceMessage()}</Text>
          {isNewHighScore && (
            <Badge variant="success" size="lg" icon="star">
              Neuer Rekord!
            </Badge>
          )}
        </Animated.View>

        {/* Score Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Card gradient gradientColors={getPerformanceGradient()} padding={6} style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Deine Punktzahl</Text>
            <AnimatedNumber
              value={stats.score}
              duration={1500}
              style={styles.scoreValue}
            />
            <Text style={styles.scoreSubtext}>
              von {stats.totalQuestions} Fragen
            </Text>
          </Card>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card variant="elevated" padding={4} style={styles.statCard}>
            <MaterialIcons name="check-circle" size={32} color={theme.colors.success[500]} />
            <Text style={styles.statValue}>{stats.correctAnswers}</Text>
            <Text style={styles.statLabel}>Richtig</Text>
          </Card>

          <Card variant="elevated" padding={4} style={styles.statCard}>
            <MaterialIcons name="cancel" size={32} color={theme.colors.error[500]} />
            <Text style={styles.statValue}>{stats.incorrectAnswers}</Text>
            <Text style={styles.statLabel}>Falsch</Text>
          </Card>

          <Card variant="elevated" padding={4} style={styles.statCard}>
            <MaterialIcons name="remove-circle" size={32} color={theme.colors.gray[500]} />
            <Text style={styles.statValue}>{stats.skippedAnswers}</Text>
            <Text style={styles.statLabel}>Übersprungen</Text>
          </Card>
        </View>

        {/* Detailed Stats */}
        <Card variant="elevated" padding={5} style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Deine Leistung</Text>

          {/* Accuracy */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Genauigkeit</Text>
            <Text style={styles.detailValue}>{stats.accuracy.toFixed(1)}%</Text>
          </View>
          <ProgressBar
            progress={stats.accuracy}
            height={8}
            gradient
            gradientColors={getPerformanceGradient()}
            style={styles.detailProgress}
          />

          {/* Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <MaterialIcons name="access-time" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.detailLabel}>Zeit benötigt</Text>
            </View>
            <Text style={styles.detailValue}>{formatTime(stats.timeTaken)}</Text>
          </View>

          {/* Rank (if available) */}
          {stats.rank && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialIcons name="leaderboard" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.detailLabel}>Aktueller Rang</Text>
              </View>
              <Badge variant="primary" size="md">
                #{stats.rank}
              </Badge>
            </View>
          )}

          {/* Earned Credits (if any) */}
          {stats.earnedCredits && stats.earnedCredits > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialIcons name="monetization-on" size={20} color={theme.colors.secondary[500]} />
                <Text style={styles.detailLabel}>Verdiente Credits</Text>
              </View>
              <Badge variant="secondary" size="md" icon="add">
                +{stats.earnedCredits}
              </Badge>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Play Again */}
          <TouchableOpacity onPress={onPlayAgain} activeOpacity={0.9} style={styles.primaryButtonContainer}>
            <LinearGradient
              colors={[theme.colors.primary[400], theme.colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <MaterialIcons name="replay" size={24} color={theme.colors.white} />
              <Text style={styles.primaryButtonText}>Nochmal spielen</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity onPress={onViewLeaderboard} style={styles.secondaryButton}>
              <MaterialIcons name="leaderboard" size={20} color={theme.colors.primary[500]} />
              <Text style={styles.secondaryButtonText}>Bestenliste</Text>
            </TouchableOpacity>

            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.secondaryButton}>
                <MaterialIcons name="share" size={20} color={theme.colors.primary[500]} />
                <Text style={styles.secondaryButtonText}>Teilen</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onBackToHome} style={styles.secondaryButton}>
              <MaterialIcons name="home" size={20} color={theme.colors.primary[500]} />
              <Text style={styles.secondaryButtonText}>Startseite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scrollContent: {
    padding: theme.spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  trophy: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
    ...theme.shadows.xl,
  },
  congratsText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  scoreCard: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  scoreLabel: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing[2],
  },
  scoreValue: {
    fontSize: theme.typography.fontSize['6xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  scoreSubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing[2],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[6],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginVertical: theme.spacing[2],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  detailsCard: {
    marginBottom: theme.spacing[6],
  },
  detailsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  detailProgress: {
    marginBottom: theme.spacing[4],
  },
  actionsContainer: {
    gap: theme.spacing[4],
  },
  primaryButtonContainer: {
    marginBottom: theme.spacing[2],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    height: 56,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
    height: 48,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    ...theme.shadows.sm,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[500],
  },
});

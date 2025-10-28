import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';

const { width, height } = Dimensions.get('window');

interface GameModeDetail {
  id: string;
  type: 'FREE' | 'CHALLENGE' | 'TOURNAMENT' | 'SUPER_TOURNAMENT';
  name: string;
  subtitle: string;
  questions: number;
  entryFee: string;
  entryFeeValue: number;
  entryFeeCurrency: 'USD' | 'CREDITS';
  prizePool: string;
  gradient: string[];
  icon: keyof typeof MaterialIcons.glyphMap;
  participants: number;
  maxParticipants: number;
  timeLeft: string;
  requirements: string[];
  featured?: boolean;
}

const gameModes: GameModeDetail[] = [
  {
    id: '1',
    type: 'FREE',
    name: 'Wöchentliches Quiz',
    subtitle: 'Spiele kostenlos und gewinne!',
    questions: 1000,
    entryFee: 'Kostenlos',
    entryFeeValue: 0,
    entryFeeCurrency: 'CREDITS',
    prizePool: '$100',
    gradient: [theme.colors.success[400], theme.colors.success[600]],
    icon: 'play-circle-filled',
    participants: 1247,
    maxParticipants: 10000,
    timeLeft: '3 Tage 14 Stunden',
    requirements: ['E-Mail Verifizierung'],
    featured: true,
  },
  {
    id: '2',
    type: 'CHALLENGE',
    name: 'Monatliche Challenge',
    subtitle: 'Intensive Competition',
    questions: 100,
    entryFee: '$10',
    entryFeeValue: 10,
    entryFeeCurrency: 'USD',
    prizePool: '$1,000',
    gradient: [theme.colors.secondary[400], theme.colors.secondary[600]],
    icon: 'whatshot',
    participants: 342,
    maxParticipants: 1000,
    timeLeft: '12 Tage 8 Stunden',
    requirements: ['E-Mail Verifizierung', 'Bezahlung $10'],
  },
  {
    id: '3',
    type: 'TOURNAMENT',
    name: 'Grand Turnier',
    subtitle: 'Für erfahrene Spieler',
    questions: 1000,
    entryFee: '1,000 Credits',
    entryFeeValue: 1000,
    entryFeeCurrency: 'CREDITS',
    prizePool: '$10,000',
    gradient: [theme.colors.primary[400], theme.colors.primary[600]],
    icon: 'emoji-events',
    participants: 89,
    maxParticipants: 500,
    timeLeft: '18 Tage 5 Stunden',
    requirements: ['E-Mail Verifizierung', '1,000 Credits Guthaben'],
  },
  {
    id: '4',
    type: 'SUPER_TOURNAMENT',
    name: 'Super Meisterschaft',
    subtitle: 'Ultimative Herausforderung',
    questions: 1000,
    entryFee: '10,000 Credits',
    entryFeeValue: 10000,
    entryFeeCurrency: 'CREDITS',
    prizePool: '$100,000',
    gradient: ['#FFD700', '#FFA500'],
    icon: 'military-tech',
    participants: 12,
    maxParticipants: 100,
    timeLeft: '25 Tage 3 Stunden',
    requirements: ['E-Mail Verifizierung', '10,000 Credits Guthaben', 'Level 10+'],
  },
];

interface ModernGameModeSelectionScreenProps {
  userCredits?: number;
  userLevel?: number;
  isEmailVerified?: boolean;
  onJoinMode: (modeId: string) => void;
  onBack: () => void;
}

export const ModernGameModeSelectionScreen: React.FC<ModernGameModeSelectionScreenProps> = ({
  userCredits = 2500,
  userLevel = 5,
  isEmailVerified = true,
  onJoinMode,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const selectedMode = gameModes[selectedIndex];

  const canJoin = () => {
    const mode = selectedMode;
    if (!isEmailVerified) return false;
    
    if (mode.entryFeeCurrency === 'CREDITS') {
      return userCredits >= mode.entryFeeValue;
    }
    
    return true; // For USD, assume payment will be handled
  };

  const getMissingRequirements = () => {
    const missing: string[] = [];
    
    if (!isEmailVerified) {
      missing.push('E-Mail muss verifiziert werden');
    }
    
    if (selectedMode.entryFeeCurrency === 'CREDITS' && userCredits < selectedMode.entryFeeValue) {
      missing.push(`Benötigt ${selectedMode.entryFeeValue - userCredits} mehr Credits`);
    }
    
    if (selectedMode.type === 'SUPER_TOURNAMENT' && userLevel < 10) {
      missing.push(`Benötigt Level ${10 - userLevel} mehr`);
    }
    
    return missing;
  };

  const renderCard = (mode: GameModeDetail, index: number) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={mode.id}
        style={[
          styles.cardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <LinearGradient
          colors={mode.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Featured Badge */}
          {mode.featured && (
            <View style={styles.featuredBadge}>
              <MaterialIcons name="star" size={14} color={theme.colors.secondary[500]} />
              <Text style={styles.featuredText}>Beliebt</Text>
            </View>
          )}

          {/* Icon */}
          <View style={styles.cardIcon}>
            <MaterialIcons name={mode.icon} size={80} color={theme.colors.white} />
          </View>

          {/* Title */}
          <Text style={styles.cardTitle}>{mode.name}</Text>
          <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <MaterialIcons name="help" size={20} color={theme.colors.white} />
              <Text style={styles.statText}>{mode.questions} Fragen</Text>
            </View>
            <View style={styles.stat}>
              <MaterialIcons name="people" size={20} color={theme.colors.white} />
              <Text style={styles.statText}>{mode.participants} Spieler</Text>
            </View>
          </View>

          {/* Prize Pool */}
          <View style={styles.prizeContainer}>
            <MaterialIcons name="emoji-events" size={32} color={theme.colors.white} />
            <View>
              <Text style={styles.prizeLabel}>Preispool</Text>
              <Text style={styles.prizeValue}>{mode.prizePool}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <ProgressBar
            progress={(mode.participants / mode.maxParticipants) * 100}
            height={6}
            color={theme.colors.white}
            backgroundColor="rgba(255, 255, 255, 0.3)"
            showLabel={false}
            style={styles.progressBar}
          />
          <Text style={styles.participantsText}>
            {mode.participants} / {mode.maxParticipants} Teilnehmer
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spielmodus wählen</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Cards Carousel */}
      <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedIndex(index);
          }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={width}
        >
          {gameModes.map((mode, index) => renderCard(mode, index))}
        </ScrollView>
      </Animated.View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {gameModes.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === selectedIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Entry Fee */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <MaterialIcons name="confirmation-number" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.detailLabelText}>Teilnahmegebühr</Text>
              </View>
              <Badge
                variant={selectedMode.entryFeeValue === 0 ? 'success' : 'primary'}
                size="md"
              >
                {selectedMode.entryFee}
              </Badge>
            </View>
          </View>

          {/* Time Left */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <MaterialIcons name="access-time" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.detailLabelText}>Verbleibende Zeit</Text>
              </View>
              <Text style={styles.detailValue}>{selectedMode.timeLeft}</Text>
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.detailCard}>
            <Text style={styles.requirementsTitle}>Anforderungen:</Text>
            {selectedMode.requirements.map((req, index) => (
              <View key={index} style={styles.requirement}>
                <MaterialIcons name="check-circle" size={18} color={theme.colors.success[500]} />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>

          {/* Missing Requirements */}
          {getMissingRequirements().length > 0 && (
            <View style={[styles.detailCard, styles.warningCard]}>
              <Text style={styles.warningTitle}>Fehlende Anforderungen:</Text>
              {getMissingRequirements().map((req, index) => (
                <View key={index} style={styles.requirement}>
                  <MaterialIcons name="error" size={18} color={theme.colors.error[500]} />
                  <Text style={styles.warningText}>{req}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Join Button */}
      <View style={styles.joinButtonContainer}>
        <TouchableOpacity
          onPress={() => onJoinMode(selectedMode.id)}
          disabled={!canJoin()}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={canJoin() ? selectedMode.gradient : [theme.colors.gray[400], theme.colors.gray[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.joinButton, !canJoin() && styles.joinButtonDisabled]}
          >
            <Text style={styles.joinButtonText}>
              {canJoin() ? 'Jetzt beitreten' : 'Anforderungen nicht erfüllt'}
            </Text>
            {canJoin() && (
              <MaterialIcons name="arrow-forward" size={24} color={theme.colors.white} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  carouselContainer: {
    height: height * 0.5,
  },
  cardContainer: {
    width,
    padding: theme.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width - theme.spacing[12],
    height: '100%',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[6],
    ...theme.shadows.xl,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  featuredBadge: {
    position: 'absolute',
    top: theme.spacing[4],
    right: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing[1],
  },
  featuredText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.secondary[500],
  },
  cardIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing[6],
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  statText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  prizeLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  prizeValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  progressBar: {
    width: '100%',
  },
  participantsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[4],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.gray[300],
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.colors.primary[500],
  },
  detailsSection: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
  },
  detailCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    ...theme.shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  detailLabelText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  requirementsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  requirementText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  warningCard: {
    backgroundColor: theme.colors.error[50],
    borderWidth: 1,
    borderColor: theme.colors.error[200],
  },
  warningTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error[700],
    marginBottom: theme.spacing[2],
  },
  warningText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error[700],
  },
  joinButtonContainer: {
    padding: theme.spacing[6],
    paddingTop: theme.spacing[4],
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    height: 56,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});

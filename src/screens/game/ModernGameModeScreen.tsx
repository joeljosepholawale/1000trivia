import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

const { width } = Dimensions.get('window');

interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  entryFee: number;
  prizePool?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: string;
  players: number;
  maxPlayers?: number;
  isAvailable: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  gradientColors: [string, string];
}

interface ModernGameModeScreenProps {
  modes: GameMode[];
  userBalance: number;
  onModeSelect: (modeId: string) => void;
  onBack: () => void;
}

export const ModernGameModeScreen: React.FC<ModernGameModeScreenProps> = ({
  modes,
  userBalance,
  onModeSelect,
  onBack,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getDifficultyColor = (difficulty: GameMode['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return theme.colors.success[500];
      case 'medium':
        return theme.colors.warning[500];
      case 'hard':
        return theme.colors.error[500];
    }
  };

  const getDifficultyLabel = (difficulty: GameMode['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'Einfach';
      case 'medium':
        return 'Mittel';
      case 'hard':
        return 'Schwer';
    }
  };

  const canAffordMode = (mode: GameMode) => {
    return userBalance >= mode.entryFee;
  };

  const renderBalanceHeader = () => (
    <Animated.View
      style={[
        styles.balanceHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card
        gradient
        gradientColors={[theme.colors.primary[400], theme.colors.primary[600]]}
        padding={5}
      >
        <View style={styles.balanceContent}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Dein Guthaben</Text>
            <View style={styles.balanceValueContainer}>
              <MaterialIcons name="monetization-on" size={24} color={theme.colors.secondary[300]} />
              <Text style={styles.balanceValue}>{userBalance.toLocaleString()}</Text>
              <Text style={styles.balanceCurrency}>Credits</Text>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderModeCard = (mode: GameMode, index: number) => {
    const canAfford = canAffordMode(mode);
    const animDelay = index * 100;

    const cardFadeAnim = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        key={mode.id}
        style={[
          styles.modeCardWrapper,
          {
            opacity: cardFadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => mode.isAvailable && canAfford && onModeSelect(mode.id)}
          disabled={!mode.isAvailable || !canAfford}
          activeOpacity={0.9}
        >
          <Card
            variant="elevated"
            padding={0}
            style={[
              styles.modeCard,
              (!mode.isAvailable || !canAfford) && styles.modeCardDisabled,
            ]}
          >
            {/* Header with Gradient */}
            <LinearGradient colors={mode.gradientColors} style={styles.modeHeader}>
              <View style={styles.modeHeaderContent}>
                <View style={styles.modeIconContainer}>
                  <MaterialIcons name={mode.icon as any} size={48} color={theme.colors.white} />
                </View>

                <View style={styles.modeBadges}>
                  {mode.isNew && (
                    <Badge variant="warning" size="sm">
                      NEU
                    </Badge>
                  )}
                  {mode.isPopular && !mode.isNew && (
                    <Badge variant="info" size="sm">
                      <MaterialIcons name="trending-up" size={12} color={theme.colors.white} />
                      <Text style={styles.badgeText}> Beliebt</Text>
                    </Badge>
                  )}
                </View>
              </View>

              <View style={styles.modeHeaderInfo}>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDescription} numberOfLines={2}>
                  {mode.description}
                </Text>
              </View>
            </LinearGradient>

            {/* Details Section */}
            <View style={styles.modeDetails}>
              {/* Entry Fee */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="monetization-on" size={20} color={theme.colors.secondary[500]} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Eintritt</Text>
                  <Text style={styles.detailValue}>{mode.entryFee} Credits</Text>
                </View>
              </View>

              {/* Prize Pool */}
              {mode.prizePool && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialIcons name="emoji-events" size={20} color={theme.colors.warning[500]} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Preispool</Text>
                    <Text style={styles.detailValue}>{mode.prizePool.toLocaleString()} Credits</Text>
                  </View>
                </View>
              )}

              {/* Players */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="people" size={20} color={theme.colors.info[500]} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Spieler</Text>
                  <Text style={styles.detailValue}>
                    {mode.players}
                    {mode.maxPlayers ? `/${mode.maxPlayers}` : ''}
                  </Text>
                </View>
              </View>

              {/* Duration */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="schedule" size={20} color={theme.colors.primary[500]} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Dauer</Text>
                  <Text style={styles.detailValue}>{mode.duration}</Text>
                </View>
              </View>

              {/* Difficulty */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="show-chart" size={20} color={getDifficultyColor(mode.difficulty)} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Schwierigkeit</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: getDifficultyColor(mode.difficulty) },
                    ]}
                  >
                    {getDifficultyLabel(mode.difficulty)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <View style={styles.modeAction}>
              {!mode.isAvailable ? (
                <View style={styles.unavailableButton}>
                  <Text style={styles.unavailableText}>Nicht verfügbar</Text>
                </View>
              ) : !canAfford ? (
                <View style={styles.unavailableButton}>
                  <Text style={styles.unavailableText}>Nicht genug Credits</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => onModeSelect(mode.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={mode.gradientColors}
                    style={styles.playButton}
                  >
                    <MaterialIcons name="play-arrow" size={24} color={theme.colors.white} />
                    <Text style={styles.playButtonText}>Spielen</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spielmodus wählen</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderBalanceHeader()}

        <View style={styles.modesSection}>
          <Text style={styles.sectionTitle}>Verfügbare Modi</Text>
          {modes.map((mode, index) => renderModeCard(mode, index))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  backButton: {
    padding: theme.spacing[2],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
  },
  balanceHeader: {
    marginBottom: theme.spacing[6],
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceInfo: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing[2],
  },
  balanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  balanceValue: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  balanceCurrency: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing[2],
  },
  modesSection: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  modeCardWrapper: {
    marginBottom: theme.spacing[4],
  },
  modeCard: {
    overflow: 'hidden',
  },
  modeCardDisabled: {
    opacity: 0.6,
  },
  modeHeader: {
    padding: theme.spacing[5],
  },
  modeHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  modeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeBadges: {
    gap: theme.spacing[2],
    alignItems: 'flex-end',
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modeHeaderInfo: {
    gap: theme.spacing[2],
  },
  modeName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  modeDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  modeDetails: {
    padding: theme.spacing[5],
    gap: theme.spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  modeAction: {
    padding: theme.spacing[5],
    paddingTop: 0,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  playButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  unavailableButton: {
    backgroundColor: theme.colors.gray[200],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
  },
});

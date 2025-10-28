import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { theme } from '@/styles/theme';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatsCard } from '@/components/common/StatsCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = theme.spacing[4];
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

interface GameMode {
  id: string;
  type: 'FREE' | 'CHALLENGE' | 'TOURNAMENT' | 'SUPER_TOURNAMENT';
  name: string;
  questions: number;
  entryFee: string;
  prizePool: string;
  gradient: string[];
  icon: keyof typeof MaterialIcons.glyphMap;
  participants?: number;
  timeLeft?: string;
}

const gameModes: GameMode[] = [
  {
    id: '1',
    type: 'FREE',
    name: 'Wöchentlich Kostenlos',
    questions: 1000,
    entryFee: 'Kostenlos',
    prizePool: '$100',
    gradient: [theme.colors.success[400], theme.colors.success[600]],
    icon: 'play-circle-filled',
    participants: 1247,
    timeLeft: '3 Tage',
  },
  {
    id: '2',
    type: 'CHALLENGE',
    name: 'Monatliche Challenge',
    questions: 100,
    entryFee: '$10',
    prizePool: '$1,000',
    gradient: [theme.colors.secondary[400], theme.colors.secondary[600]],
    icon: 'whatshot',
    participants: 342,
    timeLeft: '12 Tage',
  },
  {
    id: '3',
    type: 'TOURNAMENT',
    name: 'Grand Turnier',
    questions: 1000,
    entryFee: '1000 Credits',
    prizePool: '$10,000',
    gradient: [theme.colors.primary[400], theme.colors.primary[600]],
    icon: 'emoji-events',
    participants: 89,
    timeLeft: '18 Tage',
  },
  {
    id: '4',
    type: 'SUPER_TOURNAMENT',
    name: 'Super Meisterschaft',
    questions: 1000,
    entryFee: '10,000 Credits',
    prizePool: '$100,000',
    gradient: ['#FFD700', '#FFA500'],
    icon: 'military-tech',
    participants: 12,
    timeLeft: '25 Tage',
  },
];

interface ModernHomeScreenProps {
  user?: {
    name: string;
    email: string;
    level: number;
    credits: number;
    avatar?: string;
  };
  stats?: {
    gamesPlayed: number;
    winRate: number;
    currentRank: number;
  };
  onGameModePress: (modeId: string) => void;
  onClaimDaily: () => void;
  onRefresh?: () => void;
}

export const ModernHomeScreen: React.FC<ModernHomeScreenProps> = ({
  user = { name: 'Spieler', email: 'player@example.com', level: 5, credits: 2500 },
  stats = { gamesPlayed: 24, winRate: 67, currentRank: 142 },
  onGameModePress,
  onClaimDaily,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[theme.colors.primary[400], theme.colors.primary[600]]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Badge
            variant="primary"
            size="sm"
            rounded
            style={styles.levelBadge}
          >
            Lvl {user.level}
          </Badge>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>Hallo, {user.name}!</Text>
          <View style={styles.creditsContainer}>
            <MaterialIcons name="monetization-on" size={16} color={theme.colors.secondary[500]} />
            <Text style={styles.credits}>{user.credits.toLocaleString()} Credits</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.notificationButton}>
        <MaterialIcons name="notifications" size={24} color={theme.colors.text.primary} />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
    </View>
  );

  const renderDailyChallenge = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Card gradient gradientColors={[theme.colors.info[400], theme.colors.info[600]]} padding={5} style={styles.dailyCard}>
        <View style={styles.dailyContent}>
          <View style={styles.dailyIcon}>
            <MaterialIcons name="redeem" size={40} color={theme.colors.white} />
          </View>
          <View style={styles.dailyText}>
            <Text style={styles.dailyTitle}>Tägliche Belohnung</Text>
            <Text style={styles.dailySubtitle}>Hol dir deine 10 kostenlosen Credits!</Text>
          </View>
          <TouchableOpacity style={styles.claimButton} onPress={onClaimDaily}>
            <Text style={styles.claimButtonText}>Holen</Text>
            <MaterialIcons name="arrow-forward" size={18} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <StatsCard
        label="Spiele"
        value={stats.gamesPlayed}
        icon="sports-esports"
        gradient
        gradientColors={[theme.colors.primary[400], theme.colors.primary[600]]}
      />
      <StatsCard
        label="Gewinnrate"
        value={`${stats.winRate}%`}
        icon="trending-up"
        trend="up"
        trendValue="+5%"
        gradient
        gradientColors={[theme.colors.success[400], theme.colors.success[600]]}
      />
      <StatsCard
        label="Rang"
        value={`#${stats.currentRank}`}
        icon="emoji-events"
        gradient
        gradientColors={[theme.colors.secondary[400], theme.colors.secondary[600]]}
      />
    </View>
  );

  const renderGameModeCard = (mode: GameMode, index: number) => {
    const delay = index * 100;
    const cardFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        key={mode.id}
        style={{
          opacity: cardFade,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity onPress={() => onGameModePress(mode.id)} activeOpacity={0.9}>
          <Card
            gradient
            gradientColors={mode.gradient}
            padding={5}
            style={styles.gameModeCard}
          >
            <View style={styles.gameModeHeader}>
              <View style={styles.gameModeIcon}>
                <MaterialIcons name={mode.icon} size={32} color={theme.colors.white} />
              </View>
              {mode.type === 'FREE' && (
                <Badge variant="success" size="sm" style={styles.freeBadge}>
                  KOSTENLOS
                </Badge>
              )}
            </View>
            
            <Text style={styles.gameModeName}>{mode.name}</Text>
            <Text style={styles.gameModeQuestions}>{mode.questions} Fragen</Text>
            
            <View style={styles.gameModeDetails}>
              <View style={styles.gameModeDetail}>
                <MaterialIcons name="confirmation-number" size={16} color={theme.colors.white} />
                <Text style={styles.gameModeDetailText}>{mode.entryFee}</Text>
              </View>
              <View style={styles.gameModeDetail}>
                <MaterialIcons name="emoji-events" size={16} color={theme.colors.white} />
                <Text style={styles.gameModeDetailText}>{mode.prizePool}</Text>
              </View>
            </View>

            <View style={styles.gameModeFooter}>
              <View style={styles.participants}>
                <MaterialIcons name="people" size={14} color={theme.colors.white} />
                <Text style={styles.participantsText}>{mode.participants} Spieler</Text>
              </View>
              <View style={styles.timeLeft}>
                <MaterialIcons name="access-time" size={14} color={theme.colors.white} />
                <Text style={styles.timeLeftText}>{mode.timeLeft}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderHeader()}
        {renderDailyChallenge()}
        
        <Text style={styles.sectionTitle}>Deine Statistiken</Text>
        {renderStats()}
        
        <Text style={styles.sectionTitle}>Spielmodi</Text>
        <View style={styles.gameModes}>
          {gameModes.map((mode, index) => renderGameModeCard(mode, index))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  avatarText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  credits: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error[500],
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  dailyCard: {
    marginBottom: theme.spacing[6],
  },
  dailyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  dailyText: {
    flex: 1,
  },
  dailyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing[1],
  },
  dailySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
  },
  claimButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginRight: theme.spacing[1],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[6],
  },
  gameModes: {
    gap: theme.spacing[4],
  },
  gameModeCard: {
    marginBottom: theme.spacing[4],
  },
  gameModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  gameModeIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeBadge: {
    backgroundColor: theme.colors.white,
  },
  gameModeName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing[1],
  },
  gameModeQuestions: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing[3],
  },
  gameModeDetails: {
    flexDirection: 'row',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  gameModeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameModeDetailText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    marginLeft: theme.spacing[1],
  },
  gameModeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.8,
    marginLeft: theme.spacing[1],
  },
  timeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLeftText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.8,
    marginLeft: theme.spacing[1],
  },
});

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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MARGIN = 16;
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
  trending?: boolean;
}

const gameModes: GameMode[] = [
  {
    id: '1',
    type: 'FREE',
    name: 'Weekly Free Play',
    questions: 1000,
    entryFee: 'Free',
    prizePool: '$100',
    gradient: ['#10B981', '#059669'],
    icon: 'play-circle-filled',
    participants: 1247,
    timeLeft: '3 days',
    trending: true,
  },
  {
    id: '2',
    type: 'CHALLENGE',
    name: 'Monthly Challenge',
    questions: 100,
    entryFee: '$10',
    prizePool: '$1,000',
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'whatshot',
    participants: 342,
    timeLeft: '12 days',
  },
  {
    id: '3',
    type: 'TOURNAMENT',
    name: 'Grand Tournament',
    questions: 1000,
    entryFee: '1000 Credits',
    prizePool: '$10,000',
    gradient: ['#3B82F6', '#2563EB'],
    icon: 'emoji-events',
    participants: 89,
    timeLeft: '18 days',
  },
  {
    id: '4',
    type: 'SUPER_TOURNAMENT',
    name: 'Super Championship',
    questions: 1000,
    entryFee: '10,000 Credits',
    prizePool: '$100,000',
    gradient: ['#FFD700', '#FFA500', '#FF8C00'],
    icon: 'military-tech',
    participants: 12,
    timeLeft: '25 days',
  },
];

interface ModernHomeScreenProps {
  user?: {
    name: string;
    email: string;
    level: number;
    credits: number;
    avatar?: string;
    exp?: number;
    maxExp?: number;
  };
  stats?: {
    gamesPlayed: number;
    winRate: number;
    currentRank: number;
    streak?: number;
  };
  onGameModePress: (modeId: string) => void;
  onClaimDaily: () => void;
  onRefresh?: () => void;
  onNotificationPress?: () => void;
}

export const EnhancedModernHomeScreen: React.FC<ModernHomeScreenProps> = ({
  user = { name: 'Player', email: 'player@example.com', level: 5, credits: 2500, exp: 650, maxExp: 1000 },
  stats = { gamesPlayed: 24, winRate: 67, currentRank: 142, streak: 5 },
  onGameModePress,
  onClaimDaily,
  onRefresh,
  onNotificationPress,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [creditAnimValue] = useState(new Animated.Value(user.credits));
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for notification badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Animate credit changes
  useEffect(() => {
    Animated.timing(creditAnimValue, {
      toValue: user.credits,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [user.credits]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const handleCardPress = useCallback((modeId: string) => {
    // Add haptic feedback here if available
    onGameModePress(modeId);
  }, [onGameModePress]);

  const renderHeader = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.userSection}>
          {/* Avatar with level badge */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            </LinearGradient>
            <View style={styles.levelBadge}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.levelBadgeGradient}
              >
                <MaterialIcons name="stars" size={10} color="#FFF" />
                <Text style={styles.levelText}>{user.level}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* User info */}
          <View style={styles.userInfo}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>Welcome back,</Text>
              {stats.streak && stats.streak > 2 && (
                <View style={styles.streakBadge}>
                  <MaterialIcons name="local-fire-department" size={14} color="#FF6B6B" />
                  <Text style={styles.streakText}>{stats.streak} day streak!</Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            
            {/* Credits with animated counter */}
            <Pressable style={styles.creditsRow} onPress={() => {}}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.creditsContainer}
              >
                <MaterialIcons name="monetization-on" size={16} color="#FFF" />
                <Animated.Text style={styles.creditsValue}>
                  {creditAnimValue.interpolate({
                    inputRange: [0, user.credits],
                    outputRange: ['0', user.credits.toLocaleString()],
                  })}
                </Animated.Text>
                <Text style={styles.creditsLabel}>Credits</Text>
              </LinearGradient>
              {/* Shimmer effect */}
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 100, height: '100%' }}
                />
              </Animated.View>
            </Pressable>

            {/* XP Progress bar */}
            {user.exp !== undefined && user.maxExp && (
              <View style={styles.expContainer}>
                <View style={styles.expBar}>
                  <View style={[styles.expFill, { width: `${(user.exp / user.maxExp) * 100}%` }]} />
                </View>
                <Text style={styles.expText}>
                  {user.exp}/{user.maxExp} XP
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notification button */}
        <Pressable 
          style={styles.notificationButton}
          onPress={onNotificationPress}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 24 }}
        >
          <MaterialIcons name="notifications-none" size={24} color="#1F2937" />
          <Animated.View 
            style={[
              styles.notificationDot,
              {
                transform: [{ scale: pulseAnim }],
              }
            ]}
          />
        </Pressable>
      </Animated.View>
    );
  };

  const renderDailyReward = () => (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        }
      ]}
    >
      <Pressable
        onPress={onClaimDaily}
        style={({ pressed }) => [
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dailyRewardCard}
        >
          {/* Animated background pattern */}
          <View style={styles.dailyPattern}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={[styles.patternDot, { left: `${i * 20}%` }]} />
            ))}
          </View>

          <View style={styles.dailyContent}>
            <View style={styles.dailyIconContainer}>
              <MaterialIcons name="card-giftcard" size={40} color="#FFF" />
              <View style={styles.giftPulse} />
            </View>
            
            <View style={styles.dailyTextContainer}>
              <Text style={styles.dailyTitle}>Daily Reward</Text>
              <Text style={styles.dailySubtitle}>Claim your free 50 credits!</Text>
            </View>

            <View style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#8B5CF6" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  const renderQuickStats = () => (
    <View style={styles.statsGrid}>
      {[
        { label: 'Games', value: stats.gamesPlayed, icon: 'sports-esports', color: ['#3B82F6', '#2563EB'] },
        { label: 'Win Rate', value: `${stats.winRate}%`, icon: 'trending-up', color: ['#10B981', '#059669'] },
        { label: 'Rank', value: `#${stats.currentRank}`, icon: 'emoji-events', color: ['#F59E0B', '#D97706'] },
      ].map((stat, index) => (
        <Animated.View
          key={stat.label}
          style={[
            styles.statCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50 + index * 10],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={stat.color}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <MaterialIcons name={stat.icon as any} size={24} color="#FFF" />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </LinearGradient>
        </Animated.View>
      ))}
    </View>
  );

  const renderGameModeCard = (mode: GameMode, index: number) => {
    const cardDelay = index * 100;
    
    return (
      <Animated.View
        key={mode.id}
        style={[
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 50 + index * 15],
                }),
              },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Pressable
          onPress={() => handleCardPress(mode.id)}
          style={({ pressed }) => [
            styles.gameModeCard,
            { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={mode.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gameModeGradient}
          >
            {/* Background pattern */}
            <View style={styles.cardPattern}>
              {[...Array(20)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.cardPatternDot,
                    { 
                      left: `${(i % 5) * 25}%`,
                      top: `${Math.floor(i / 5) * 25}%`,
                    }
                  ]} 
                />
              ))}
            </View>

            {/* Trending badge */}
            {mode.trending && (
              <View style={styles.trendingBadge}>
                <MaterialIcons name="whatshot" size={12} color="#FF6B6B" />
                <Text style={styles.trendingText}>TRENDING</Text>
              </View>
            )}

            {/* Free badge */}
            {mode.type === 'FREE' && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            )}

            {/* Icon */}
            <View style={styles.modeIconContainer}>
              <MaterialIcons name={mode.icon} size={48} color="rgba(255,255,255,0.9)" />
            </View>

            {/* Content */}
            <View style={styles.modeContent}>
              <Text style={styles.modeName}>{mode.name}</Text>
              <Text style={styles.modeQuestions}>{mode.questions} Questions</Text>

              <View style={styles.modeDetails}>
                <View style={styles.modeDetailRow}>
                  <MaterialIcons name="confirmation-number" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.modeDetailText}>{mode.entryFee}</Text>
                </View>
                <View style={styles.modeDetailRow}>
                  <MaterialIcons name="emoji-events" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.modeDetailText}>{mode.prizePool}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.modeFooter}>
                <View style={styles.modeFooterItem}>
                  <MaterialIcons name="people" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.modeFooterText}>{mode.participants}</Text>
                </View>
                <View style={styles.modeFooterItem}>
                  <MaterialIcons name="schedule" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.modeFooterText}>{mode.timeLeft}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6', '#8B5CF6']}
          />
        }
      >
        {renderHeader()}
        
        <View style={styles.section}>
          {renderDailyReward()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          {renderQuickStats()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Modes</Text>
          {gameModes.map((mode, index) => renderGameModeCard(mode, index))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  levelBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  creditsRow: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 8,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  creditsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  creditsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  expContainer: {
    gap: 4,
  },
  expBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  expFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  expText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  dailyRewardCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dailyPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  patternDot: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  dailyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  dailyIconContainer: {
    position: 'relative',
  },
  giftPulse: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dailyTextContainer: {
    flex: 1,
  },
  dailyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  dailySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  gameModeCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gameModeGradient: {
    position: 'relative',
    minHeight: 180,
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  cardPatternDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  trendingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  freeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  modeIconContainer: {
    padding: 20,
    paddingTop: 24,
  },
  modeContent: {
    padding: 20,
    paddingTop: 0,
  },
  modeName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  modeQuestions: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    fontWeight: '600',
  },
  modeDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  modeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeDetailText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  modeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  modeFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
});

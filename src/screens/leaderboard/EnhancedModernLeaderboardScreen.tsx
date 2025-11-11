import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  avatar?: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  trend?: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

interface ModernLeaderboardScreenProps {
  entries: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onRefresh?: () => void;
  onUserPress?: (userId: string) => void;
}

export const EnhancedModernLeaderboardScreen: React.FC<ModernLeaderboardScreenProps> = ({
  entries = [],
  currentUser,
  period,
  onPeriodChange,
  onRefresh,
  onUserPress,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const podiumAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

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
    ]).start();

    // Podium rise animation
    podiumAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    });

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Glow animation for #1
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const getPeriodLabel = (p: LeaderboardPeriod) => {
    const labels = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      allTime: 'All Time',
    };
    return labels[p];
  };

  const getRankColors = (rank: number): string[] => {
    if (rank === 1) return ['#FFD700', '#FFA500', '#FF8C00'];
    if (rank === 2) return ['#C0C0C0', '#A8A8A8'];
    if (rank === 3) return ['#CD7F32', '#B8733F'];
    return ['#3B82F6', '#2563EB'];
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return 'emoji-events';
    if (rank === 2) return 'military-tech';
    if (rank === 3) return 'stars';
    return null;
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const renderPeriodSelector = () => (
    <Animated.View
      style={[
        styles.periodSelector,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {(['daily', 'weekly', 'monthly', 'allTime'] as LeaderboardPeriod[]).map((p) => (
        <Pressable
          key={p}
          onPress={() => onPeriodChange(p)}
          style={({ pressed }) => [
            styles.periodButton,
            period === p && styles.periodButtonActive,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {period === p ? (
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.periodGradient}
            >
              <Text style={styles.periodTextActive}>{getPeriodLabel(p)}</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.periodText}>{getPeriodLabel(p)}</Text>
          )}
        </Pressable>
      ))}
    </Animated.View>
  );

  const renderPodium = () => {
    const topThree = entries.slice(0, 3);
    if (topThree.length === 0) return null;

    // Order: 2nd, 1st, 3rd for podium effect
    const orderedPodium = [
      topThree.find((e) => e.rank === 2),
      topThree.find((e) => e.rank === 1),
      topThree.find((e) => e.rank === 3),
    ].filter(Boolean) as LeaderboardEntry[];

    const podiumHeights = [110, 140, 90];

    return (
      <View style={styles.podiumContainer}>
        {orderedPodium.map((entry, index) => {
          const isFirst = entry.rank === 1;
          const podiumHeight = podiumHeights[index];
          const podiumIndex = entry.rank === 2 ? 0 : entry.rank === 1 ? 1 : 2;

          return (
            <Pressable
              key={entry.id}
              onPress={() => onUserPress?.(entry.id)}
              style={[styles.podiumItem, { zIndex: isFirst ? 10 : 5 }]}
            >
              {/* Crown for #1 */}
              {isFirst && (
                <Animated.View
                  style={[
                    styles.crownContainer,
                    {
                      opacity: glowOpacity,
                      transform: [
                        {
                          translateY: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -8],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <MaterialIcons name="emoji-events" size={32} color="#FFD700" />
                </Animated.View>
              )}

              {/* Avatar */}
              <Animated.View
                style={[
                  styles.avatarContainer,
                  isFirst && styles.avatarContainerFirst,
                  {
                    transform: [
                      {
                        scale: podiumAnims[podiumIndex].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={getRankColors(entry.rank)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.avatarGradient, isFirst && styles.avatarGradientFirst]}
                >
                  {/* Shimmer effect for #1 */}
                  {isFirst && (
                    <Animated.View
                      style={[
                        styles.avatarShimmer,
                        {
                          transform: [{ translateX: shimmerTranslate }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: 80, height: '100%' }}
                      />
                    </Animated.View>
                  )}
                  
                  <Text style={[styles.avatarText, isFirst && styles.avatarTextFirst]}>
                    {entry.username.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>

                {/* Rank badge */}
                <View style={[styles.rankBadge, { backgroundColor: getRankColors(entry.rank)[0] }]}>
                  <Text style={styles.rankBadgeText}>#{entry.rank}</Text>
                </View>
              </Animated.View>

              {/* Username */}
              <Text style={[styles.podiumUsername, isFirst && styles.podiumUsernameFirst]} numberOfLines={1}>
                {entry.username}
              </Text>

              {/* Score */}
              <Text style={[styles.podiumScore, isFirst && styles.podiumScoreFirst]}>
                {entry.score.toLocaleString()}
              </Text>

              {/* Podium Base */}
              <Animated.View
                style={[
                  {
                    transform: [
                      {
                        scaleY: podiumAnims[podiumIndex].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={getRankColors(entry.rank)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.podiumBase, { height: podiumHeight }]}
                >
                  <MaterialIcons
                    name={getRankIcon(entry.rank) || 'star'}
                    size={24}
                    color="rgba(255,255,255,0.3)"
                  />
                  <Text style={styles.podiumRank}>#{entry.rank}</Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderLeaderboardList = () => {
    const remainingEntries = entries.slice(3);

    if (remainingEntries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="leaderboard" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No rankings yet</Text>
          <Text style={styles.emptyStateSubtitle}>Be the first to compete!</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {remainingEntries.map((entry, index) => (
          <Animated.View
            key={entry.id}
            style={[
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              onPress={() => onUserPress?.(entry.id)}
              style={({ pressed }) => [
                styles.listItem,
                entry.isCurrentUser && styles.listItemCurrent,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {/* Current user indicator */}
              {entry.isCurrentUser && (
                <View style={styles.currentUserBadge}>
                  <Text style={styles.currentUserText}>YOU</Text>
                </View>
              )}

              {/* Rank */}
              <View style={styles.rankContainer}>
                <Text style={[styles.rankText, entry.isCurrentUser && styles.rankTextCurrent]}>
                  #{entry.rank}
                </Text>
              </View>

              {/* Avatar */}
              <View style={styles.listAvatarContainer}>
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.listAvatar}
                >
                  <Text style={styles.listAvatarText}>
                    {entry.username.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>

              {/* Info */}
              <View style={styles.listInfo}>
                <Text style={[styles.listUsername, entry.isCurrentUser && styles.listUsernameCurrent]}>
                  {entry.username}
                </Text>
                <View style={styles.listStats}>
                  <Text style={styles.listStatsText}>{entry.gamesPlayed} games</Text>
                  <Text style={styles.listStatsDot}>•</Text>
                  <Text style={styles.listStatsText}>{entry.winRate}% win</Text>
                </View>
              </View>

              {/* Trend & Score */}
              <View style={styles.listRight}>
                {entry.trend && entry.trend !== 'same' && (
                  <MaterialIcons
                    name={entry.trend === 'up' ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={entry.trend === 'up' ? '#10B981' : '#EF4444'}
                    style={styles.trendIcon}
                  />
                )}
                <Text style={[styles.listScore, entry.isCurrentUser && styles.listScoreCurrent]}>
                  {entry.score.toLocaleString()}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderCurrentUserCard = () => {
    if (!currentUser || currentUser.rank <= 3) return null;

    return (
      <Animated.View
        style={[
          styles.currentUserCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.currentUserGradient}
        >
          <View style={styles.currentUserContent}>
            <View style={styles.currentUserLeft}>
              <Text style={styles.currentUserLabel}>Your Rank</Text>
              <Text style={styles.currentUserRank}>#{currentUser.rank}</Text>
            </View>
            <View style={styles.currentUserRight}>
              <Text style={styles.currentUserScore}>{currentUser.score.toLocaleString()}</Text>
              <Text style={styles.currentUserScoreLabel}>points</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton}>
            <MaterialIcons name="filter-list" size={24} color="#1F2937" />
          </Pressable>
        </View>
      </View>

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
        {renderPeriodSelector()}
        {renderCurrentUserCard()}
        {renderPodium()}
        
        <Text style={styles.listTitle}>All Rankings</Text>
        {renderLeaderboardList()}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  periodButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  periodButtonActive: {},
  periodGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 10,
  },
  periodTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  currentUserCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  currentUserGradient: {
    padding: 20,
  },
  currentUserContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentUserLeft: {},
  currentUserLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  currentUserRank: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  currentUserRight: {
    alignItems: 'flex-end',
  },
  currentUserScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  currentUserScoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 32,
    paddingHorizontal: 10,
    gap: 12,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  crownContainer: {
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarContainerFirst: {
    transform: [{ scale: 1.15 }],
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  avatarGradientFirst: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  avatarTextFirst: {
    fontSize: 28,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F9FAFB',
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  podiumUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumUsernameFirst: {
    fontSize: 15,
    fontWeight: '700',
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 12,
  },
  podiumScoreFirst: {
    fontSize: 18,
    color: '#FFD700',
  },
  podiumBase: {
    width: 80,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  podiumRank: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listItemCurrent: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  currentUserBadge: {
    position: 'absolute',
    top: -6,
    right: 16,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentUserText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  rankTextCurrent: {
    color: '#8B5CF6',
  },
  listAvatarContainer: {
    marginRight: 12,
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  listInfo: {
    flex: 1,
  },
  listUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listUsernameCurrent: {
    color: '#8B5CF6',
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listStatsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  listStatsDot: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendIcon: {
    marginRight: 4,
  },
  listScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  listScoreCurrent: {
    color: '#8B5CF6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

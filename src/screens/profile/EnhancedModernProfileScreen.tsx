import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
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

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  memberSince: string;
  rank?: number;
  title?: string;
}

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  winRate: number;
  longestStreak: number;
  currentStreak: number;
  averageScore: number;
  creditsEarned: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ModernProfileScreenProps {
  profile: UserProfile;
  stats: UserStats;
  achievements: Achievement[];
  onEditProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onAchievementPress?: (achievement: Achievement) => void;
  onShareProfile?: () => void;
}

export const EnhancedModernProfileScreen: React.FC<ModernProfileScreenProps> = ({
  profile,
  stats,
  achievements = [],
  onEditProfile,
  onSettings,
  onLogout,
  onAchievementPress,
  onShareProfile,
}) => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

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
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // XP bar animation
    Animated.timing(xpAnim, {
      toValue: (profile.currentXP / profile.xpToNextLevel) * 100,
      duration: 1500,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

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

  const getRarityColors = (rarity: Achievement['rarity']): string[] => {
    const colors = {
      legendary: ['#FFD700', '#FFA500'],
      epic: ['#8B5CF6', '#7C3AED'],
      rare: ['#3B82F6', '#2563EB'],
      common: ['#10B981', '#059669'],
    };
    return colors[rarity];
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const xpWidth = xpAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const renderProfileHeader = () => (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <View style={styles.headerCard}>
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Background pattern */}
          <View style={styles.headerPattern}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.patternDot,
                  {
                    left: `${(i % 5) * 25}%`,
                    top: `${Math.floor(i / 5) * 25}%`,
                  },
                ]}
              />
            ))}
          </View>

          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: 150, height: '100%' }}
            />
          </Animated.View>

          <View style={styles.headerContent}>
            {/* Top Actions */}
            <View style={styles.topActions}>
              <Pressable style={styles.actionButton} onPress={onShareProfile}>
                <MaterialIcons name="share" size={20} color="#FFF" />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={onSettings}>
                <MaterialIcons name="settings" size={20} color="#FFF" />
              </Pressable>
            </View>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarBorder}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {profile.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                </LinearGradient>
                
                {/* Level badge */}
                <View style={styles.levelBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.levelGradient}
                  >
                    <MaterialIcons name="stars" size={10} color="#FFF" />
                    <Text style={styles.levelText}>{profile.level}</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* User Info */}
            <Text style={styles.username}>{profile.username || 'User'}</Text>
            {profile.title && (
              <View style={styles.titleBadge}>
                <Text style={styles.titleText}>{profile.title}</Text>
              </View>
            )}
            {profile.rank && (
              <View style={styles.rankContainer}>
                <MaterialIcons name="emoji-events" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.rankText}>Rank #{profile.rank}</Text>
              </View>
            )}

            {/* Member Since */}
            <Text style={styles.memberSince}>
              Member since {new Date(profile.memberSince).getFullYear()}
            </Text>

            {/* XP Progress */}
            <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Level {profile.level}</Text>
                <Text style={styles.xpValue}>
                  {profile.currentXP}/{profile.xpToNextLevel} XP
                </Text>
              </View>
              <View style={styles.xpBar}>
                <Animated.View style={[styles.xpFill, { width: xpWidth }]} />
              </View>
            </View>

            {/* Edit Button */}
            <Pressable
              onPress={onEditProfile}
              style={({ pressed }) => [
                styles.editButton,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <MaterialIcons name="edit" size={18} color="#8B5CF6" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Your Stats</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Games', value: stats.gamesPlayed, icon: 'sports-esports', color: ['#3B82F6', '#2563EB'] },
          { label: 'Wins', value: stats.gamesWon, icon: 'emoji-events', color: ['#10B981', '#059669'] },
          { label: 'Win Rate', value: `${stats.winRate}%`, icon: 'trending-up', color: ['#F59E0B', '#D97706'] },
          { label: 'Avg Score', value: Math.round(stats.averageScore), icon: 'star', color: ['#8B5CF6', '#7C3AED'] },
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
    </View>
  );

  const renderAchievements = () => {
    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const lockedAchievements = achievements.filter(a => !a.unlocked);

    return (
      <View style={styles.achievementsSection}>
        <View style={styles.achievementsHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.achievementsCount}>
            {unlockedAchievements.length}/{achievements.length}
          </Text>
        </View>

        {unlockedAchievements.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="emoji-events" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No achievements yet</Text>
            <Text style={styles.emptyStateSubtitle}>Keep playing to unlock achievements!</Text>
          </View>
        ) : (
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                style={[
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        scale: scaleAnim.interpolate({
                          inputRange: [0.9, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Pressable
                  onPress={() => onAchievementPress?.(achievement)}
                  style={({ pressed }) => [
                    styles.achievementCard,
                    !achievement.unlocked && styles.achievementLocked,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={achievement.unlocked ? getRarityColors(achievement.rarity) : ['#D1D5DB', '#9CA3AF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.achievementGradient}
                  >
                    <MaterialIcons
                      name={achievement.icon}
                      size={32}
                      color={achievement.unlocked ? '#FFF' : 'rgba(255,255,255,0.5)'}
                    />
                    {achievement.unlocked && achievement.rarity === 'legendary' && (
                      <View style={styles.legendaryBadge}>
                        <MaterialIcons name="auto-awesome" size={12} color="#FFD700" />
                      </View>
                    )}
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>
                          {achievement.progress}/{achievement.maxProgress}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                  <Text
                    style={[styles.achievementTitle, !achievement.unlocked && styles.achievementTitleLocked]}
                    numberOfLines={2}
                  >
                    {achievement.title}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      {[
        { icon: 'notifications', label: 'Notifications', onPress: onSettings },
        { icon: 'security', label: 'Privacy & Security', onPress: onSettings },
        { icon: 'help', label: 'Help & Support', onPress: onSettings },
        { icon: 'info', label: 'About', onPress: onSettings },
      ].map((item, index) => (
        <Animated.View
          key={item.label}
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
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.settingItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <MaterialIcons name={item.icon as any} size={20} color="#3B82F6" />
              </View>
              <Text style={styles.settingLabel}>{item.label}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </Pressable>
        </Animated.View>
      ))}

      {/* Logout Button */}
      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoutGradient}
        >
          <MaterialIcons name="logout" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderStats()}
        {renderAchievements()}
        {renderSettings()}

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
  headerCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  headerGradient: {
    position: 'relative',
    padding: 24,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  patternDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    position: 'relative',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBorder: {
    padding: 4,
    borderRadius: 60,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#3B82F6',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  levelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  titleBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  memberSince: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
  },
  xpContainer: {
    width: '100%',
    marginBottom: 20,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementGradient: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
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
  legendaryBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderRadius: 8,
    padding: 4,
  },
  progressBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#9CA3AF',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  logoutButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
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
    textAlign: 'center',
  },
});

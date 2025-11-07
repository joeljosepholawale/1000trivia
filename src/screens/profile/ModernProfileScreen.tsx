import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { StatsCard } from '@/components/common/StatsCard';
import { ProgressBar } from '@/components/common/ProgressBar';

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
  icon: string;
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

export const ModernProfileScreen: React.FC<ModernProfileScreenProps> = ({
  profile,
  stats,
  achievements,
  onEditProfile,
  onSettings,
  onLogout,
  onAchievementPress,
  onShareProfile,
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

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return theme.colors.secondary[500];
      case 'epic':
        return theme.colors.primary[500];
      case 'rare':
        return theme.colors.info[500];
      case 'common':
        return theme.colors.success[500];
    }
  };

  const renderProfileHeader = () => (
    <Animated.View
      style={[
        styles.profileHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card
        gradient
        gradientColors={[theme.colors.primary[400], theme.colors.primary[600]]}
        padding={6}
      >
        <View style={styles.profileHeaderContent}>
          {/* Avatar & Level */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={[theme.colors.secondary[400], theme.colors.secondary[600]]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              <View style={styles.levelBadge}>
                <LinearGradient
                  colors={[theme.colors.secondary[500], theme.colors.secondary[700]]}
                  style={styles.levelBadgeGradient}
                >
                  <Text style={styles.levelText}>{profile.level}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.username}>{profile.username || 'User'}</Text>
            {profile.title && (
              <Badge variant="warning" size="sm" style={styles.titleBadge}>
                {profile.title}
              </Badge>
            )}
            {profile.rank && (
              <View style={styles.rankContainer}>
                <MaterialIcons name="leaderboard" size={16} color={theme.colors.white} />
                <Text style={styles.rankText}>Rang #{profile.rank}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onShareProfile} style={styles.iconButton}>
              <MaterialIcons name="share" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onEditProfile} style={styles.iconButton}>
              <MaterialIcons name="edit" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSettings} style={styles.iconButton}>
              <MaterialIcons name="settings" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          {/* XP Progress */}
          <View style={styles.xpContainer}>
            <View style={styles.xpInfo}>
              <Text style={styles.xpLabel}>Level {profile.level}</Text>
              <Text style={styles.xpValue}>
                {profile.currentXP} / {profile.xpToNextLevel} XP
              </Text>
            </View>
            <ProgressBar
              progress={(profile.currentXP / profile.xpToNextLevel) * 100}
              color={theme.colors.secondary[500]}
              backgroundColor={theme.colors.white + '40'}
              height={8}
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Statistiken</Text>
      <View style={styles.statsGrid}>
        <StatsCard
          label="Spiele"
          value={stats.gamesPlayed}
          icon="sports-esports"
          variant="primary"
        />
        <StatsCard
          label="Siege"
          value={stats.gamesWon}
          icon="emoji-events"
          variant="success"
        />
        <StatsCard
          label="Gewinnrate"
          value={`${stats.winRate}%`}
          icon="trending-up"
          variant="info"
        />
        <StatsCard
          label="Streak"
          value={stats.currentStreak}
          icon="local-fire-department"
          variant="warning"
        />
      </View>

      {/* Detailed Stats Cards */}
      <View style={styles.detailedStats}>
        <Card variant="outlined" padding={4}>
          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <MaterialIcons name="trending-up" size={24} color={theme.colors.primary[500]} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Gesamtpunkte</Text>
              <Text style={styles.statValue}>{stats.totalScore.toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" padding={4}>
          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <MaterialIcons name="show-chart" size={24} color={theme.colors.success[500]} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Durchschnitt</Text>
              <Text style={styles.statValue}>{stats.averageScore.toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" padding={4}>
          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <MaterialIcons name="whatshot" size={24} color={theme.colors.warning[500]} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Längste Streak</Text>
              <Text style={styles.statValue}>{stats.longestStreak} Tage</Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" padding={4}>
          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <MaterialIcons name="monetization-on" size={24} color={theme.colors.secondary[500]} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Credits Verdient</Text>
              <Text style={styles.statValue}>{stats.creditsEarned.toLocaleString()}</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );

  const renderAchievements = () => {
    const unlockedAchievements = achievements.filter((a) => a.unlocked);
    const lockedAchievements = achievements.filter((a) => !a.unlocked);

    return (
      <View style={styles.achievementsSection}>
        <View style={styles.achievementHeader}>
          <Text style={styles.sectionTitle}>Erfolge</Text>
          <Badge variant="primary" size="sm">
            {unlockedAchievements.length}/{achievements.length}
          </Badge>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementsScroll}
        >
          {achievements.slice(0, 10).map((achievement) => (
            <TouchableOpacity
              key={achievement.id}
              onPress={() => onAchievementPress?.(achievement)}
              activeOpacity={0.8}
            >
              <Card
                variant="elevated"
                padding={4}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.unlocked
                        ? getRarityColor(achievement.rarity) + '20'
                        : theme.colors.gray[200],
                    },
                  ]}
                >
                  <MaterialIcons
                    name={achievement.icon as any}
                    size={32}
                    color={
                      achievement.unlocked
                        ? getRarityColor(achievement.rarity)
                        : theme.colors.gray[400]
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked,
                  ]}
                  numberOfLines={2}
                >
                  {achievement.title}
                </Text>
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <ProgressBar
                    progress={(achievement.progress / achievement.maxProgress) * 100}
                    color={getRarityColor(achievement.rarity)}
                    height={4}
                    style={styles.achievementProgress}
                  />
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Konto</Text>

      <Card variant="outlined" padding={0}>
        <TouchableOpacity style={styles.settingItem} onPress={onEditProfile}>
          <View style={styles.settingIcon}>
            <MaterialIcons name="person" size={24} color={theme.colors.primary[500]} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Profil bearbeiten</Text>
            <Text style={styles.settingValue}>{profile.email}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.settingDivider} />

        <TouchableOpacity style={styles.settingItem} onPress={onSettings}>
          <View style={styles.settingIcon}>
            <MaterialIcons name="notifications" size={24} color={theme.colors.info[500]} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Benachrichtigungen</Text>
            <Text style={styles.settingValue}>Einstellungen verwalten</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.settingDivider} />

        <TouchableOpacity style={styles.settingItem} onPress={onSettings}>
          <View style={styles.settingIcon}>
            <MaterialIcons name="security" size={24} color={theme.colors.success[500]} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Datenschutz & Sicherheit</Text>
            <Text style={styles.settingValue}>Privatsphäre verwalten</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.settingDivider} />

        <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={onLogout}>
          <View style={[styles.settingIcon, styles.logoutIcon]}>
            <MaterialIcons name="logout" size={24} color={theme.colors.error[500]} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, styles.logoutText]}>Abmelden</Text>
          </View>
        </TouchableOpacity>
      </Card>

      <View style={styles.memberSince}>
        <Text style={styles.memberSinceText}>
          Mitglied seit {new Date(profile.memberSince).toLocaleDateString('de-DE', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderStats()}
        {renderAchievements()}
        {renderSettings()}
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
  profileHeader: {
    marginBottom: theme.spacing[6],
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: theme.spacing[4],
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.white,
    ...theme.shadows.lg,
  },
  avatarText: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  levelBadgeGradient: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.md,
  },
  levelText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  username: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing[2],
  },
  titleBadge: {
    marginBottom: theme.spacing[2],
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  rankText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpContainer: {
    width: '100%',
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[2],
  },
  xpLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  xpValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  statsSection: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  detailedStats: {
    gap: theme.spacing[3],
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  achievementsSection: {
    marginBottom: theme.spacing[6],
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  achievementsScroll: {
    gap: theme.spacing[3],
    paddingRight: theme.spacing[6],
  },
  achievementCard: {
    width: 120,
    alignItems: 'center',
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  achievementTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    minHeight: 36,
  },
  achievementTitleLocked: {
    color: theme.colors.text.secondary,
  },
  achievementProgress: {
    marginTop: theme.spacing[2],
    width: '100%',
  },
  settingsSection: {
    marginBottom: theme.spacing[6],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  settingValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing[4] + 40 + theme.spacing[3],
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  logoutIcon: {
    backgroundColor: theme.colors.error[100],
  },
  logoutText: {
    color: theme.colors.error[500],
  },
  memberSince: {
    alignItems: 'center',
    marginTop: theme.spacing[4],
  },
  memberSinceText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});

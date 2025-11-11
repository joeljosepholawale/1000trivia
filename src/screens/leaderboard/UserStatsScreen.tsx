import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {StackNavigationProp} from '@react-navigation/stack';
import {Ionicons} from '@expo/vector-icons';

import {Colors} from '../../styles/colors';
import {RootState, AppDispatch} from '../../store';
import {loadUserStats, clearError} from '../../store/slices/leaderboardSlice';
import type {LeaderboardStackParamList} from '../../navigation/LeaderboardNavigator';

type NavigationProp = StackNavigationProp<LeaderboardStackParamList, 'UserStats'>;

interface Props {
  navigation: NavigationProp;
}

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color = Colors.primary,
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, {backgroundColor: `${color}20`}]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

interface AchievementCardProps {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  icon,
  title,
  description,
  earned,
  progress,
  maxProgress,
}) => (
  <View style={[styles.achievementCard, earned && styles.achievementEarned]}>
    <View style={[styles.achievementIcon, earned && styles.achievementIconEarned]}>
      <Ionicons 
        name={icon as any} 
        size={24} 
        color={earned ? Colors.warning : Colors.textSecondary} 
      />
    </View>
    <View style={styles.achievementContent}>
      <Text style={[styles.achievementTitle, earned && styles.achievementTitleEarned]}>
        {title}
      </Text>
      <Text style={styles.achievementDescription}>{description}</Text>
      {progress !== undefined && maxProgress !== undefined && !earned && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                {width: `${Math.min((progress / maxProgress) * 100, 100)}%`}
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress}/{maxProgress}
          </Text>
        </View>
      )}
    </View>
  </View>
);

const UserStatsScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {userStats, userStatsLoading, error} = useSelector(
    (state: RootState) => state.leaderboard
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    await dispatch(loadUserStats());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Mock achievements data - would come from backend in real app
  const achievements = [
    {
      icon: 'trophy',
      title: 'First Victory',
      description: 'Win your first game',
      earned: userStats ? userStats.winnings > 0 : false,
    },
    {
      icon: 'flame',
      title: 'Quiz Master',
      description: 'Play 10 games',
      earned: userStats ? userStats.totalGames >= 10 : false,
      progress: userStats ? Math.min(userStats.totalGames, 10) : 0,
      maxProgress: 10,
    },
    {
      icon: 'star',
      title: 'High Scorer',
      description: 'Achieve an average score above 80%',
      earned: userStats ? userStats.averageScore >= 80 : false,
    },
    {
      icon: 'medal',
      title: 'Top Ranker',
      description: 'Reach top 10 position',
      earned: userStats ? userStats.bestRank <= 10 : false,
    },
    {
      icon: 'cash',
      title: 'Money Maker',
      description: 'Earn $100 in total winnings',
      earned: userStats ? userStats.winnings >= 100 : false,
      progress: userStats ? Math.min(userStats.winnings, 100) : 0,
      maxProgress: 100,
    },
    {
      icon: 'diamond',
      title: 'Dedication',
      description: 'Play 50 games',
      earned: userStats ? userStats.totalGames >= 50 : false,
      progress: userStats ? Math.min(userStats.totalGames, 50) : 0,
      maxProgress: 50,
    },
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const unlockedCount = earnedAchievements.length;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load statistics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          dispatch(clearError());
          loadData();
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (userStatsLoading && !userStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Your Statistics</Text>
        <Text style={styles.headerSubtitle}>
          Track your progress and achievements
        </Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="game-controller"
          title="Total Games"
          value={userStats?.totalGames || 0}
          subtitle="Games played"
        />
        <StatCard
          icon="trending-up"
          title="Average Score"
          value={`${userStats?.averageScore || 0}%`}
          subtitle="Performance"
          color={Colors.success}
        />
        <StatCard
          icon="podium"
          title="Best Rank"
          value={userStats?.bestRank ? `#${userStats.bestRank}` : 'N/A'}
          subtitle="Highest position"
          color={Colors.warning}
        />
        <StatCard
          icon="cash"
          title="Total Winnings"
          value={`$${userStats?.winnings || 0}`}
          subtitle="Prize money earned"
          color={Colors.success}
        />
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <Text style={styles.achievementCount}>
            {unlockedCount}/{achievements.length} unlocked
          </Text>
        </View>

        <View style={styles.achievementsList}>
          {achievements.map((achievement, index) => (
            <AchievementCard
              key={index}
              icon={achievement.icon}
              title={achievement.title}
              description={achievement.description}
              earned={achievement.earned}
              progress={achievement.progress}
              maxProgress={achievement.maxProgress}
            />
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Leaderboard')}>
            <Ionicons name="trophy" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>View Rankings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PeriodHistory')}>
            <Ionicons name="time" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Game History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Motivation Section */}
      {userStats && userStats.totalGames === 0 && (
        <View style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>🚀 Get Started!</Text>
          <Text style={styles.motivationText}>
            Play your first game to start building your statistics and unlocking achievements!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  achievementCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementEarned: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIconEarned: {
    backgroundColor: Colors.warning,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  achievementTitleEarned: {
    color: Colors.warning,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    minWidth: 40,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    marginLeft: 8,
  },
  motivationCard: {
    backgroundColor: Colors.primaryLight,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 16,
  },
});

export default UserStatsScreen;
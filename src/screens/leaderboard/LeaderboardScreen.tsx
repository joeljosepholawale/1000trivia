import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {StackNavigationProp} from '@react-navigation/stack';
import {Ionicons} from '@expo/vector-icons';

import {Colors} from '../../styles/colors';
import {RootState, AppDispatch} from '../../store';
import {
  loadLeaderboard,
  loadUserRank,
  loadPeriods,
  setSelectedPeriod,
  clearError,
} from '../../store/slices/leaderboardSlice';
import type {LeaderboardEntry} from '@1000ravier/shared';
import type {LeaderboardStackParamList} from '../../navigation/LeaderboardNavigator';

type NavigationProp = StackNavigationProp<LeaderboardStackParamList, 'Leaderboard'>;

interface Props {
  navigation: NavigationProp;
}

const LeaderboardScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    currentLeaderboard,
    userRank,
    periods,
    selectedPeriodId,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.leaderboard);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedPeriodId]);

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(loadLeaderboard(selectedPeriodId || undefined)),
      dispatch(loadUserRank(selectedPeriodId || undefined)),
      dispatch(loadPeriods()),
    ]);
  }, [dispatch, selectedPeriodId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handlePeriodChange = (periodId: string | null) => {
    dispatch(setSelectedPeriod(periodId));
  };

  const renderLeaderboardItem = ({item, index}: {item: LeaderboardEntry; index: number}) => {
    const isUser = item.isCurrentUser;
    const rank = index + 1;

    return (
      <View style={[styles.leaderboardItem, isUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          {rank <= 3 ? (
            <View style={[styles.medal, getMedalStyle(rank)]}>
              <Text style={styles.medalText}>{rank}</Text>
            </View>
          ) : (
            <Text style={[styles.rank, isUser && styles.currentUserRank]}>
              #{rank}
            </Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, isUser && styles.currentUserText]}>
            {item.username}
            {isUser && ' (You)'}
          </Text>
          <Text style={[styles.scoreText, isUser && styles.currentUserText]}>
            {item.score} points
          </Text>
        </View>

        <View style={styles.prizeContainer}>
          {item.prize && (
            <Text style={[styles.prize, isUser && styles.currentUserText]}>
              ${item.prize}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderUserRankCard = () => {
    if (!userRank) return null;

    return (
      <View style={styles.userRankCard}>
        <View style={styles.userRankContent}>
          <Text style={styles.userRankTitle}>Your Position</Text>
          <View style={styles.userRankStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{userRank.position}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userRank.score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userRank.totalParticipants}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {renderUserRankCard()}
      
      <View style={styles.periodSelector}>
        <Text style={styles.periodLabel}>Competition Period:</Text>
        <TouchableOpacity
          style={styles.periodButton}
          onPress={() => {
            // Show period selection modal or navigate to period history
            handlePeriodChange(null); // For now, toggle to current
          }}>
          <Text style={styles.periodButtonText}>
            {selectedPeriodId ? 'Historical' : 'Current'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Winners')}>
          <Ionicons name="trophy" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Winners</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('UserStats')}>
          <Ionicons name="stats-chart" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>My Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PeriodHistory')}>
          <Ionicons name="time" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.leaderboardTitle}>Top Players</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyStateText}>No rankings available</Text>
      <Text style={styles.emptyStateSubtext}>
        Play some games to see the leaderboard!
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load leaderboard</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          dispatch(clearError());
          loadData();
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={currentLeaderboard}
        keyExtractor={(item) => item.userId}
        renderItem={renderLeaderboardItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
};

const getMedalStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {backgroundColor: '#FFD700'}; // Gold
    case 2:
      return {backgroundColor: '#C0C0C0'}; // Silver
    case 3:
      return {backgroundColor: '#CD7F32'}; // Bronze
    default:
      return {};
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
  },
  userRankCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userRankContent: {
    alignItems: 'center',
  },
  userRankTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  userRankStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginTop: 4,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentUserItem: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  medal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
  },
  rank: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textSecondary,
  },
  currentUserRank: {
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  currentUserText: {
    color: Colors.primary,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  prizeContainer: {
    alignItems: 'flex-end',
  },
  prize: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.success,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LeaderboardScreen;
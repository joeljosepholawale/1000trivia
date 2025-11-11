import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {StackNavigationProp} from '@react-navigation/stack';
import {Ionicons} from '@expo/vector-icons';

import {Colors} from '../../styles/colors';
import {RootState, AppDispatch} from '../../store';
import {loadWinners, clearWinners, clearError} from '../../store/slices/leaderboardSlice';
import type {Winner} from '@1000ravier/shared';
import type {LeaderboardStackParamList} from '../../navigation/LeaderboardNavigator';

type NavigationProp = StackNavigationProp<LeaderboardStackParamList, 'Winners'>;

interface Props {
  navigation: NavigationProp;
}

const WinnersScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {winners, winnersLoading, error} = useSelector((state: RootState) => state.leaderboard);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    dispatch(clearWinners());
    await dispatch(loadWinners({limit: 20, offset: 0}));
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  const loadMore = useCallback(async () => {
    if (loadingMore || winnersLoading) return;
    
    setLoadingMore(true);
    await dispatch(loadWinners({limit: 20, offset: winners.length}));
    setLoadingMore(false);
  }, [dispatch, winners.length, loadingMore, winnersLoading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${position}`;
    }
  };

  const renderWinnerItem = ({item}: {item: Winner}) => {
    const isAI = item.isAIGenerated;
    
    return (
      <TouchableOpacity style={styles.winnerItem} activeOpacity={0.7}>
        <View style={styles.winnerHeader}>
          <View style={styles.positionContainer}>
            <Text style={styles.positionText}>
              {getPositionIcon(item.position)}
            </Text>
          </View>
          
          <View style={styles.winnerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.winnerName}>{item.username}</Text>
              {isAI && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </View>
            <Text style={styles.gameModeText}>{item.gameMode}</Text>
          </View>

          <View style={styles.prizeContainer}>
            <Text style={styles.prizeAmount}>${item.prizeAmount}</Text>
            <Text style={styles.dateText}>{formatDate(item.wonAt)}</Text>
          </View>
        </View>

        <View style={styles.winnerDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="trophy" size={16} color={Colors.warning} />
            <Text style={styles.detailText}>Score: {item.score}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color={Colors.info} />
            <Text style={styles.detailText}>
              {item.totalParticipants} players
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {formatTime(item.wonAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLoadingMore = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingMoreText}>Loading more winners...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={80} color={Colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Winners Yet</Text>
      <Text style={styles.emptyStateText}>
        Be the first to win and appear in our Winners Hall!
      </Text>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={() => navigation.navigate('Leaderboard')}>
        <Ionicons name="play" size={20} color={Colors.white} />
        <Text style={styles.playButtonText}>Start Playing</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>🏆 Winners Hall</Text>
      <Text style={styles.headerSubtitle}>
        Celebrating our champions and their victories
      </Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{winners.length}</Text>
          <Text style={styles.statLabel}>Total Winners</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ${winners.reduce((total, winner) => total + winner.prizeAmount, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Prizes Awarded</Text>
        </View>
      </View>
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load winners</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          dispatch(clearError());
          loadInitialData();
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={winners}
        keyExtractor={(item) => `${item.userId}-${item.wonAt}`}
        renderItem={renderWinnerItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!winnersLoading ? renderEmptyState : null}
        ListFooterComponent={renderLoadingMore}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
      
      {winnersLoading && winners.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
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
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  winnerItem: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionContainer: {
    width: 50,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  winnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  aiBadge: {
    backgroundColor: Colors.info,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
  },
  gameModeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  prizeContainer: {
    alignItems: 'flex-end',
  },
  prizeAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.success,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  winnerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  playButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    marginLeft: 8,
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

export default WinnersScreen;
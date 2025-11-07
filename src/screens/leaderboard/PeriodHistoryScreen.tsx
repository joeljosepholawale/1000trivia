import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {StackNavigationProp} from '@react-navigation/stack';
import {Ionicons} from '@expo/vector-icons';

import {Colors} from '../../styles/colors';
import {RootState, AppDispatch} from '../../store';
import {
  loadPeriods,
  setSelectedPeriod,
  clearError,
} from '../../store/slices/leaderboardSlice';
import {leaderboardAPI} from '../../services/api/leaderboard';
import type {Period} from '@1000ravier/shared';
import type {LeaderboardStackParamList} from '../../navigation/LeaderboardNavigator';

type NavigationProp = StackNavigationProp<LeaderboardStackParamList, 'PeriodHistory'>;

interface Props {
  navigation: NavigationProp;
}

interface PeriodCardProps {
  period: Period;
  onSelect: (period: Period) => void;
  onViewWinners: (period: Period) => void;
}

const PeriodCard: React.FC<PeriodCardProps> = ({period, onSelect, onViewWinners}) => {
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

  const getPeriodStatus = () => {
    const now = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);

    if (now < start) return {status: 'upcoming', color: Colors.info};
    if (now > end) return {status: 'completed', color: Colors.success};
    return {status: 'active', color: Colors.primary};
  };

  const {status, color} = getPeriodStatus();

  return (
    <TouchableOpacity
      style={styles.periodCard}
      onPress={() => onSelect(period)}
      activeOpacity={0.7}>
      
      <View style={styles.periodHeader}>
        <View style={styles.periodInfo}>
          <Text style={styles.periodName}>{period.name}</Text>
          <View style={[styles.statusBadge, {backgroundColor: `${color}20`}]}>
            <Text style={[styles.statusText, {color}]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.winnersButton}
          onPress={() => onViewWinners(period)}>
          <Ionicons name="trophy" size={16} color={Colors.warning} />
          <Text style={styles.winnersButtonText}>Winners</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodDates}>
        <View style={styles.dateItem}>
          <Ionicons name="play" size={14} color={Colors.success} />
          <Text style={styles.dateText}>
            {formatDate(period.startDate)} at {formatTime(period.startDate)}
          </Text>
        </View>
        <View style={styles.dateItem}>
          <Ionicons name="stop" size={14} color={Colors.error} />
          <Text style={styles.dateText}>
            {formatDate(period.endDate)} at {formatTime(period.endDate)}
          </Text>
        </View>
      </View>

      <View style={styles.periodStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color={Colors.primary} />
          <Text style={styles.statText}>
            {period.totalParticipants || 0} players
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="cash" size={16} color={Colors.success} />
          <Text style={styles.statText}>
            ${(period.totalPrizePool || 0).toLocaleString()} pool
          </Text>
        </View>
        
        {period.userRank && (
          <View style={styles.statItem}>
            <Ionicons name="medal" size={16} color={Colors.warning} />
            <Text style={styles.statText}>
              Rank #{period.userRank}
            </Text>
          </View>
        )}
      </View>

      {period.userScore && (
        <View style={styles.userPerformance}>
          <Text style={styles.userScoreLabel}>Your Score:</Text>
          <Text style={styles.userScoreValue}>{period.userScore} points</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const PeriodHistoryScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {periods, periodsLoading, error} = useSelector(
    (state: RootState) => state.leaderboard
  );

  const [refreshing, setRefreshing] = useState(false);
  const [loadingWinners, setLoadingWinners] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    await dispatch(loadPeriods({limit: 20, offset: 0}));
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSelectPeriod = (period: Period) => {
    Alert.alert(
      'View Period Leaderboard',
      `Do you want to view the leaderboard for "${period.name}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'View',
          onPress: () => {
            dispatch(setSelectedPeriod(period.id));
            navigation.navigate('Leaderboard');
          },
        },
      ]
    );
  };

  const handleViewWinners = async (period: Period) => {
    setLoadingWinners(period.id);
    
    try {
      const response = await leaderboardAPI.getPeriodWinners(period.id);
      
      if (response.success && response.data.length > 0) {
        // For now, just show an alert. In a real app, you might navigate to a detailed winners view
        const winners = response.data.slice(0, 3); // Top 3
        const winnersText = winners
          .map((winner, index) => `${index + 1}. ${winner.username} - $${winner.prizeAmount}`)
          .join('\n');
        
        Alert.alert(
          `${period.name} Winners`,
          `Top Winners:\n\n${winnersText}`,
          [{text: 'OK'}]
        );
      } else {
        Alert.alert('No Winners', 'No winners found for this period.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load winners for this period.');
    } finally {
      setLoadingWinners(null);
    }
  };

  const renderPeriodItem = ({item}: {item: Period}) => (
    <PeriodCard
      period={item}
      onSelect={handleSelectPeriod}
      onViewWinners={handleViewWinners}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={80} color={Colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Competition Periods</Text>
      <Text style={styles.emptyStateText}>
        Competition periods will appear here once they are created.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>📅 Competition History</Text>
      <Text style={styles.headerSubtitle}>
        View past and current competition periods
      </Text>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: Colors.info}]} />
          <Text style={styles.legendText}>Upcoming</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: Colors.primary}]} />
          <Text style={styles.legendText}>Active</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: Colors.success}]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
      </View>
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load competition history</Text>
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
        data={periods}
        keyExtractor={(item) => item.id}
        renderItem={renderPeriodItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!periodsLoading ? renderEmptyState : null}
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
      
      {periodsLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {loadingWinners && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading winners...</Text>
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
    paddingBottom: 20,
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  periodCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  periodInfo: {
    flex: 1,
  },
  periodName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  winnersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  winnersButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.warning,
    marginLeft: 4,
  },
  periodDates: {
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  periodStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  userPerformance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  userScoreLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  userScoreValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 12,
  },
});

export default PeriodHistoryScreen;
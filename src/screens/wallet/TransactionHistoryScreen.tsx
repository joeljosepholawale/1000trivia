import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';

import {RootState, AppDispatch} from '@/store';
import {loadTransactions, requestRefund} from '@/store/slices/walletSlice';
import {WalletStackParamList} from '@/navigation/WalletNavigator';
import {colors} from '@/styles/colors';
import {LoadingScreen} from '@/components/LoadingScreen';
import type {WalletTransaction} from '@1000ravier/shared';

type NavigationProp = NativeStackNavigationProp<WalletStackParamList, 'TransactionHistory'>;

type FilterType = 'ALL' | 'CREDIT' | 'DEBIT';

export const TransactionHistoryScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  
  const {transactions, transactionsLoading, balance} = useSelector((state: RootState) => state.wallet);
  
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await dispatch(loadTransactions({limit: 20, offset: 0}));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(loadTransactions({limit: 20, offset: 0}));
      setHasMore(true);
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const result = await dispatch(loadTransactions({
        limit: 20,
        offset: transactions.length,
      })).unwrap();
      
      if (result.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more transactions:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRequestRefund = async (transaction: WalletTransaction) => {
    // Only allow refunds for recent debit transactions (within 24 hours)
    const transactionDate = new Date(transaction.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
    
    if (transaction.type === 'CREDIT' || hoursDiff > 24) {
      Alert.alert(
        'Refund Not Available',
        'Refunds are only available for purchases made within the last 24 hours.'
      );
      return;
    }

    if (transaction.status === 'REFUND_REQUESTED' || transaction.status === 'REFUNDED') {
      Alert.alert(
        'Refund Status',
        transaction.status === 'REFUNDED' 
          ? 'This transaction has already been refunded.'
          : 'A refund has already been requested for this transaction.'
      );
      return;
    }

    Alert.alert(
      'Request Refund',
      `Request a refund for this ${transaction.amount} credit transaction?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Request Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(requestRefund({
                transactionId: transaction.id,
                reason: 'User requested refund',
              })).unwrap();
              
              Alert.alert(
                'Refund Requested',
                'Your refund request has been submitted. You will receive an email confirmation shortly.'
              );
            } catch (error: any) {
              Alert.alert(
                'Refund Failed',
                error || 'Failed to request refund. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const getFilteredTransactions = () => {
    if (selectedFilter === 'ALL') return transactions;
    return transactions.filter(transaction => transaction.type === selectedFilter);
  };

  const getTransactionIcon = (transaction: WalletTransaction) => {
    if (transaction.type === 'CREDIT') {
      if (transaction.description.includes('Daily')) return 'gift';
      if (transaction.description.includes('Ad')) return 'play-circle-filled';
      if (transaction.description.includes('Purchase') || transaction.description.includes('Bundle')) return 'shopping-cart';
      if (transaction.description.includes('Refund')) return 'undo';
      return 'add-circle';
    } else {
      if (transaction.description.includes('Game') || transaction.description.includes('Entry')) return 'sports-esports';
      return 'remove-circle';
    }
  };

  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderTransactionItem = ({item}: {item: WalletTransaction}) => {
    const iconName = getTransactionIcon(item);
    const isCredit = item.type === 'CREDIT';
    const canRequestRefund = item.type === 'DEBIT' && 
      item.status !== 'REFUNDED' && 
      item.status !== 'REFUND_REQUESTED' &&
      (new Date().getTime() - new Date(item.createdAt).getTime()) < 24 * 60 * 60 * 1000;
    
    return (
      <View style={styles.transactionItem}>
        <View style={[
          styles.transactionIcon,
          isCredit ? styles.creditIcon : styles.debitIcon,
        ]}>
          <MaterialIcons
            name={iconName as any}
            size={20}
            color={isCredit ? colors.success : colors.error}
          />
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>
            {formatTransactionDate(item.createdAt)}
          </Text>
          {item.status !== 'COMPLETED' && (
            <Text style={[
              styles.statusText,
              item.status === 'REFUNDED' ? styles.refundedStatus : styles.pendingStatus,
            ]}>
              {item.status.replace('_', ' ')}
            </Text>
          )}
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            isCredit ? styles.creditAmount : styles.debitAmount,
          ]}>
            {isCredit ? '+' : '-'}{item.amount}
          </Text>
          
          {canRequestRefund && (
            <TouchableOpacity
              style={styles.refundButton}
              onPress={() => handleRequestRefund(item)}
            >
              <Text style={styles.refundButtonText}>Refund</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <Text style={styles.title}>Transaction History</Text>
      
      <View style={styles.balanceContainer}>
        <MaterialIcons name="account-balance-wallet" size={16} color={colors.primary} />
        <Text style={styles.balanceText}>{balance.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {(['ALL', 'CREDIT', 'DEBIT'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.activeFilterText,
            ]}>
              {filter === 'ALL' ? 'All' : filter === 'CREDIT' ? 'Earned' : 'Spent'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="history" size={64} color={colors.textLight} />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyText}>
        Your transaction history will appear here once you start playing games or making purchases.
      </Text>
    </View>
  );

  const filteredTransactions = getFilteredTransactions();

  if (transactionsLoading && transactions.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      
      {filteredTransactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          style={styles.transactionsList}
          contentContainerStyle={styles.transactionsContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  balanceText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingVertical: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.textWhite,
    fontWeight: '600',
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  creditIcon: {
    backgroundColor: colors.successLight,
  },
  debitIcon: {
    backgroundColor: colors.errorLight,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  pendingStatus: {
    color: colors.warning,
  },
  refundedStatus: {
    color: colors.success,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  creditAmount: {
    color: colors.success,
  },
  debitAmount: {
    color: colors.error,
  },
  refundButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refundButtonText: {
    fontSize: 10,
    color: colors.textWhite,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
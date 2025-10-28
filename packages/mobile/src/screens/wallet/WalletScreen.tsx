import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';

import {RootState, AppDispatch} from '@/store';
import {
  loadWalletInfo,
  claimDailyCredits,
  loadTransactions,
  claimAdReward,
} from '@/store/slices/walletSlice';
import {WalletStackParamList} from '@/navigation/WalletNavigator';
import {colors} from '@/styles/colors';

type NavigationProp = NativeStackNavigationProp<WalletStackParamList, 'Wallet'>;

export const WalletScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  
  const {
    balance,
    lifetimeEarnings,
    dailyClaim,
    transactions,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.wallet);
  
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [claimingAd, setClaimingAd] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadWalletInfo()),
        dispatch(loadTransactions({limit: 5, offset: 0})), // Load recent transactions
      ]);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const handleClaimDaily = async () => {
    if (claimingDaily || !dailyClaim.canClaim) return;
    
    setClaimingDaily(true);
    try {
      await dispatch(claimDailyCredits()).unwrap();
      
      Alert.alert(
        'Daily Claim Successful! 🎉',
        `You've claimed ${dailyClaim.amount} credits! Come back tomorrow for more.`,
        [{text: 'Awesome!', style: 'default'}]
      );
    } catch (error: any) {
      Alert.alert('Claim Failed', error || 'Something went wrong. Please try again.');
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleWatchAd = async () => {
    if (claimingAd) return;
    
    // In a real app, you would show the ad first, then claim the reward
    Alert.alert(
      'Watch Ad for Credits',
      'Watch a short video to earn free credits!',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Watch Ad',
          onPress: async () => {
            setClaimingAd(true);
            try {
              // Simulate ad watching - in real app, integrate with Google Mobile Ads
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              await dispatch(claimAdReward('rewarded_video')).unwrap();
              
              Alert.alert(
                'Ad Reward Earned! 🎬',
                'Thanks for watching! Credits have been added to your wallet.',
                [{text: 'Great!', style: 'default'}]
              );
            } catch (error: any) {
              Alert.alert('Reward Failed', error || 'Something went wrong. Please try again.');
            } finally {
              setClaimingAd(false);
            }
          },
        },
      ]
    );
  };

  const formatTimeUntilNextClaim = () => {
    if (!dailyClaim.nextClaimAt) return '';
    
    const nextClaim = new Date(dailyClaim.nextClaimAt);
    const now = new Date();
    const diff = nextClaim.getTime() - now.getTime();
    
    if (diff <= 0) return 'Available now!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Available in ${hours}h ${minutes}m`;
    }
    return `Available in ${minutes}m`;
  };

  const renderBalanceCard = () => (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <MaterialIcons name="account-balance-wallet" size={32} color={colors.primary} />
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{balance.toLocaleString()} Credits</Text>
        </View>
      </View>
      
      <View style={styles.lifetimeEarnings}>
        <MaterialIcons name="trending-up" size={16} color={colors.success} />
        <Text style={styles.lifetimeText}>
          Lifetime Earnings: ₦{lifetimeEarnings.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderDailyClaimCard = () => (
    <View style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <MaterialIcons name="gift" size={24} color={colors.secondary} />
        <Text style={styles.claimTitle}>Daily Free Credits</Text>
      </View>
      
      <Text style={styles.claimDescription}>
        Claim {dailyClaim.amount} free credits every day!
      </Text>
      
      <TouchableOpacity
        style={[
          styles.claimButton,
          !dailyClaim.canClaim && styles.claimButtonDisabled,
        ]}
        onPress={handleClaimDaily}
        disabled={!dailyClaim.canClaim || claimingDaily}
      >
        {claimingDaily ? (
          <Text style={styles.claimButtonText}>Claiming...</Text>
        ) : dailyClaim.canClaim ? (
          <>
            <MaterialIcons name="gift" size={16} color={colors.textWhite} />
            <Text style={styles.claimButtonText}>Claim {dailyClaim.amount} Credits</Text>
          </>
        ) : (
          <Text style={[styles.claimButtonText, styles.claimButtonTextDisabled]}>
            {formatTimeUntilNextClaim()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderAdRewardCard = () => (
    <View style={styles.adCard}>
      <View style={styles.adHeader}>
        <MaterialIcons name="play-circle-filled" size={24} color={colors.accent} />
        <Text style={styles.adTitle}>Watch & Earn</Text>
      </View>
      
      <Text style={styles.adDescription}>
        Watch a short video to earn bonus credits!
      </Text>
      
      <TouchableOpacity
        style={styles.adButton}
        onPress={handleWatchAd}
        disabled={claimingAd}
      >
        <MaterialIcons name="play-arrow" size={16} color={colors.textWhite} />
        <Text style={styles.adButtonText}>
          {claimingAd ? 'Loading...' : 'Watch Video'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsContainer}>
      <Text style={styles.actionsTitle}>Quick Actions</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EnhancedCreditStore')}
        >
          <MaterialIcons name="shopping-cart" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Buy Credits</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('TransactionHistory')}
        >
          <MaterialIcons name="history" size={24} color={colors.secondary} />
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleWatchAd}
        >
          <MaterialIcons name="video-library" size={24} color={colors.accent} />
          <Text style={styles.actionText}>Watch Ads</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentTransactions = () => {
    if (transactions.length === 0) return null;
    
    return (
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {transactions.slice(0, 3).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <MaterialIcons
                name={transaction.type === 'CREDIT' ? 'add' : 'remove'}
                size={16}
                color={transaction.type === 'CREDIT' ? colors.success : colors.error}
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>
                {transaction.description}
              </Text>
              <Text style={styles.transactionDate}>
                {new Date(transaction.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              transaction.type === 'CREDIT' ? styles.creditAmount : styles.debitAmount,
            ]}>
              {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Wallet</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            colors={[colors.primary]}
          />
        }
      >
        {/* Balance Card */}
        {renderBalanceCard()}
        
        {/* Daily Claim */}
        {renderDailyClaimCard()}
        
        {/* Ad Reward */}
        {renderAdRewardCard()}
        
        {/* Quick Actions */}
        {renderQuickActions()}
        
        {/* Recent Transactions */}
        {renderRecentTransactions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  lifetimeEarnings: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  lifetimeText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  claimCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  claimDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  claimButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  claimButtonTextDisabled: {
    color: colors.textSecondary,
  },
  adCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  adDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  adButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 20,
    borderRadius: 12,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 8,
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: colors.success,
  },
  debitAmount: {
    color: colors.error,
  },
});
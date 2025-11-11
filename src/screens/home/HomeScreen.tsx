import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';

import {RootState, AppDispatch} from '@/store';
import {loadWalletInfo} from '@/store/slices/walletSlice';
import {loadGameModes, loadActivePeriods} from '@/store/slices/gameSlice';
import {loadRecentWinners} from '@/store/slices/leaderboardSlice';
import {colors} from '@/styles/colors';

export const HomeScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  
  const {user} = useSelector((state: RootState) => state.auth);
  const {balance, dailyClaim, isLoading: walletLoading} = useSelector((state: RootState) => state.wallet);
  const {gameModes, activePeriods, isLoading: gameLoading} = useSelector((state: RootState) => state.game);
  const {recentWinners, winnersLoading} = useSelector((state: RootState) => state.leaderboard);
  
  const isLoading = walletLoading || gameLoading || winnersLoading;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadWalletInfo()),
        dispatch(loadGameModes()),
        dispatch(loadActivePeriods()),
        dispatch(loadRecentWinners()),
      ]);
    } catch (error) {
      // Silently handle load errors
    }
  };

  const handlePlayNow = () => {
    navigation.navigate('GameTab' as never);
  };

  const handleViewWallet = () => {
    navigation.navigate('WalletTab' as never);
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('LeaderboardTab' as never);
  };

  const renderWalletCard = () => (
    <TouchableOpacity style={styles.walletCard} onPress={handleViewWallet}>
      <View style={styles.walletHeader}>
        <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
        <Text style={styles.walletTitle}>Your Wallet</Text>
      </View>
      <Text style={styles.balanceAmount}>{balance} Credits</Text>
      {dailyClaim.canClaim && (
        <View style={styles.claimBadge}>
          <MaterialIcons name="card-giftcard" size={16} color={colors.textWhite} />
          <Text style={styles.claimText}>Daily Claim Available!</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderGameModeCard = () => {
    const activeMode = gameModes.find(mode => mode.isActive);
    
    return (
      <TouchableOpacity style={styles.gameCard} onPress={handlePlayNow}>
        <View style={styles.gameHeader}>
          <MaterialIcons name="sports-esports" size={24} color={colors.secondary} />
          <Text style={styles.gameTitle}>Play Now</Text>
        </View>
        {activeMode && (
          <Text style={styles.gameModeText}>
            {activeMode.name} - {activeMode.entryFeeCredits > 0 
              ? `${activeMode.entryFeeCredits} Credits`
              : 'Free'
            }
          </Text>
        )}
        <Text style={styles.prizeText}>
          Win up to ₦{activeMode?.prizePoolNgn.toLocaleString() || '1,000'}!
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRecentWinners = () => (
    <View style={styles.winnersCard}>
      <View style={styles.winnersHeader}>
        <MaterialIcons name="emoji-events" size={24} color={colors.accent} />
        <Text style={styles.winnersTitle}>Recent Winners</Text>
        <TouchableOpacity onPress={handleViewLeaderboard}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {recentWinners.slice(0, 3).map((winner, index) => (
        <View key={winner.id} style={styles.winnerRow}>
          <View style={styles.winnerRank}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.winnerInfo}>
            <Text style={styles.winnerName}>
              {winner.user?.email?.split('@')[0] || 'Anonymous'}
            </Text>
            <Text style={styles.winnerAmount}>
              ₦{winner.prizeAmountNgn.toLocaleString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.email?.split('@')[0] || 'Player'}! 👋
          </Text>
          <Text style={styles.subtitle}>Ready to test your knowledge?</Text>
        </View>

        {/* Wallet Card */}
        {renderWalletCard()}

        {/* Game Mode Card */}
        {renderGameModeCard()}

        {/* Recent Winners */}
        {recentWinners.length > 0 && renderRecentWinners()}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePlayNow}>
            <MaterialIcons name="play-circle-filled" size={32} color={colors.primary} />
            <Text style={styles.actionText}>Play Game</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleViewWallet}>
            <MaterialIcons name="account-balance-wallet" size={32} color={colors.secondary} />
            <Text style={styles.actionText}>Wallet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleViewLeaderboard}>
            <MaterialIcons name="leaderboard" size={32} color={colors.accent} />
            <Text style={styles.actionText}>Rankings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  walletCard: {
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
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  claimBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  claimText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  gameCard: {
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
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  gameModeText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  prizeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  winnersCard: {
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
  winnersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  winnersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  winnerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: 'bold',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  winnerAmount: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
  },
});
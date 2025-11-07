import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';

import {RootState, AppDispatch} from '@/store';
import {loadWalletInfo} from '@/store/slices/walletSlice';
import {loadGameModes, loadActivePeriods} from '@/store/slices/gameSlice';
import {loadRecentWinners} from '@/store/slices/leaderboardSlice';
import {Card} from '@/components/common/Card';
import {Button} from '@/components/common/Button';
import {colors} from '@/styles/colors';

const {width} = Dimensions.get('window');

export const ImprovedHomeScreen = () => {
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
      console.error('Failed to load dashboard data:', error);
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

  const renderHeader = () => (
    <LinearGradient
      colors={['#2E7D32', '#4CAF50']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.email?.split('@')[0] || 'Player'}! 👋
          </Text>
          <Text style={styles.subtitle}>Ready to win big today?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <MaterialIcons name="person" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Balance Display */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>{balance} Credits</Text>
        {dailyClaim.canClaim && (
          <TouchableOpacity style={styles.claimButton} onPress={handleViewWallet}>
            <MaterialIcons name="card-giftcard" size={16} color={colors.white} />
            <Text style={styles.claimButtonText}>Claim Daily Bonus</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  const renderFeaturedGame = () => {
    const activeMode = gameModes.find(mode => mode.isActive);
    
    return (
      <Card gradient elevated style={styles.featuredCard}>
        <View style={styles.featuredBadge}>
          <MaterialIcons name="star" size={16} color={colors.white} />
          <Text style={styles.featuredBadgeText}>FEATURED</Text>
        </View>
        
        <View style={styles.featuredContent}>
          <View style={styles.gameIcon}>
            <MaterialIcons name="emoji-events" size={40} color={colors.secondary} />
          </View>
          
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle}>
              {activeMode?.name || 'Trivia Challenge'}
            </Text>
            <Text style={styles.featuredDescription}>
              Answer questions and win amazing prizes!
            </Text>
            
            <View style={styles.prizeContainer}>
              <MaterialIcons name="paid" size={20} color={colors.success} />
              <Text style={styles.prizeText}>
                Prize Pool: ₦{activeMode?.prizePoolNgn.toLocaleString() || '1,000'}
              </Text>
            </View>
          </View>
        </View>

        <Button
          title="Play Now"
          onPress={handlePlayNow}
          gradient
          icon="play-arrow"
          size="large"
        />
      </Card>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={handlePlayNow}
        >
          <View style={[styles.quickActionIcon, {backgroundColor: '#E8F5E9'}]}>
            <MaterialIcons name="play-circle-filled" size={32} color={colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>Play</Text>
          <Text style={styles.quickActionSubtitle}>Start Game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={handleViewWallet}
        >
          <View style={[styles.quickActionIcon, {backgroundColor: '#FFF3E0'}]}>
            <MaterialIcons name="add-circle" size={32} color={colors.secondary} />
          </View>
          <Text style={styles.quickActionTitle}>Buy Credits</Text>
          <Text style={styles.quickActionSubtitle}>Top up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={handleViewLeaderboard}
        >
          <View style={[styles.quickActionIcon, {backgroundColor: '#FCE4EC'}]}>
            <MaterialIcons name="leaderboard" size={32} color={colors.accent} />
          </View>
          <Text style={styles.quickActionTitle}>Rankings</Text>
          <Text style={styles.quickActionSubtitle}>View top</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={handleViewWallet}
        >
          <View style={[styles.quickActionIcon, {backgroundColor: '#E3F2FD'}]}>
            <MaterialIcons name="history" size={32} color={colors.info} />
          </View>
          <Text style={styles.quickActionTitle}>History</Text>
          <Text style={styles.quickActionSubtitle}>Your games</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentWinners = () => (
    <View style={styles.winnersSection}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="emoji-events" size={24} color={colors.accent} />
        <Text style={styles.sectionTitle}>Recent Winners</Text>
        <TouchableOpacity onPress={handleViewLeaderboard}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentWinners.slice(0, 5).map((winner, index) => (
        <Card key={winner.id} style={styles.winnerCard}>
          <View style={styles.winnerContent}>
            <View style={styles.winnerLeft}>
              <View
                style={[
                  styles.winnerRank,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace,
                ]}
              >
                {index < 3 ? (
                  <MaterialIcons
                    name="emoji-events"
                    size={20}
                    color={colors.white}
                  />
                ) : (
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                )}
              </View>
              <View style={styles.winnerInfo}>
                <Text style={styles.winnerName}>
                  {winner.user?.email?.split('@')[0] || 'Anonymous'}
                </Text>
                <Text style={styles.winnerDate}>Today</Text>
              </View>
            </View>
            <View style={styles.winnerPrize}>
              <Text style={styles.prizeAmount}>
                ₦{winner.prizeAmountNgn.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderHeader()}
        
        <View style={styles.content}>
          {renderFeaturedGame()}
          {renderQuickActions()}
          {recentWinners.length > 0 && renderRecentWinners()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.white,
    opacity: 0.9,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  claimButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  featuredCard: {
    marginBottom: 24,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  featuredBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  featuredContent: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  gameIcon: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
    marginLeft: 6,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    marginLeft: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 56) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  winnersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  winnerCard: {
    marginBottom: 12,
    padding: 16,
  },
  winnerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  winnerRank: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  firstPlace: {
    backgroundColor: '#FFD700',
  },
  secondPlace: {
    backgroundColor: '#C0C0C0',
  },
  thirdPlace: {
    backgroundColor: '#CD7F32',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  winnerDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  winnerPrize: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  prizeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
  },
});

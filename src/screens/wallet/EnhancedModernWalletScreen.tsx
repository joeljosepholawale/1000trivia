import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
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

interface Transaction {
  id: string;
  type: 'DAILY_CLAIM' | 'AD_REWARD' | 'PURCHASE' | 'ENTRY_FEE' | 'REFUND' | 'BONUS' | 'PRIZE';
  amount: number;
  description: string;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface WalletStats {
  totalEarned: number;
  totalSpent: number;
  dailyClaimStreak: number;
  adsWatchedToday: number;
  maxAdsPerDay: number;
  lifetimeEarnings?: number;
}

interface ModernWalletScreenProps {
  balance: number;
  stats: WalletStats;
  transactions: Transaction[];
  canClaimDaily: boolean;
  nextDailyClaimTime?: string;
  onClaimDaily: () => void;
  onWatchAd: () => void;
  onBuyCredits: () => void;
  onTransactionPress?: (transaction: Transaction) => void;
  onRefresh?: () => void;
}

export const EnhancedModernWalletScreen: React.FC<ModernWalletScreenProps> = ({
  balance,
  stats,
  transactions = [],
  canClaimDaily,
  nextDailyClaimTime,
  onClaimDaily,
  onWatchAd,
  onBuyCredits,
  onTransactionPress,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [balanceAnimValue] = useState(new Animated.Value(balance));
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse for daily claim
    if (canClaimDaily) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [canClaimDaily]);

  // Animate balance changes
  useEffect(() => {
    Animated.timing(balanceAnimValue, {
      toValue: balance,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [balance]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const getTransactionIcon = (type: Transaction['type']): keyof typeof MaterialIcons.glyphMap => {
    const icons = {
      DAILY_CLAIM: 'event',
      AD_REWARD: 'play-circle-filled',
      PURCHASE: 'shopping-cart',
      ENTRY_FEE: 'sports-esports',
      REFUND: 'refresh',
      BONUS: 'card-giftcard',
      PRIZE: 'emoji-events',
    };
    return icons[type] || 'attach-money';
  };

  const getTransactionColors = (type: Transaction['type']): string[] => {
    const colors = {
      DAILY_CLAIM: ['#10B981', '#059669'],
      AD_REWARD: ['#8B5CF6', '#7C3AED'],
      PURCHASE: ['#3B82F6', '#2563EB'],
      ENTRY_FEE: ['#EF4444', '#DC2626'],
      REFUND: ['#F59E0B', '#D97706'],
      BONUS: ['#EC4899', '#DB2777'],
      PRIZE: ['#FFD700', '#FFA500'],
    };
    return colors[type] || ['#6B7280', '#4B5563'];
  };

  const isPositive = (type: Transaction['type']) => {
    return !['ENTRY_FEE'].includes(type);
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const renderBalanceCard = () => (
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
      <View style={styles.balanceCard}>
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceGradient}
        >
          {/* Background pattern */}
          <View style={styles.cardPattern}>
            {[...Array(30)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.patternDot,
                  {
                    left: `${(i % 6) * 20}%`,
                    top: `${Math.floor(i / 6) * 20}%`,
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

          <View style={styles.balanceContent}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Pressable style={styles.infoButton}>
                <MaterialIcons name="info-outline" size={18} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>

            <View style={styles.balanceValueRow}>
              <MaterialIcons name="monetization-on" size={36} color="#FFF" />
              <Animated.Text style={styles.balanceValue}>
                {balanceAnimValue.interpolate({
                  inputRange: [0, balance],
                  outputRange: ['0', balance.toLocaleString()],
                })}
              </Animated.Text>
            </View>
            <Text style={styles.balanceUnit}>Credits</Text>

            {stats.dailyClaimStreak > 0 && (
              <View style={styles.streakContainer}>
                <MaterialIcons name="local-fire-department" size={16} color="#FFA500" />
                <Text style={styles.streakText}>{stats.dailyClaimStreak} day streak! 🔥</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      {[
        { label: 'Total Earned', value: stats.totalEarned, icon: 'trending-up', color: ['#10B981', '#059669'] },
        { label: 'Total Spent', value: stats.totalSpent, icon: 'trending-down', color: ['#EF4444', '#DC2626'] },
        { label: 'Net Gain', value: stats.totalEarned - stats.totalSpent, icon: 'account-balance', color: ['#3B82F6', '#2563EB'] },
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
            <MaterialIcons name={stat.icon as any} size={20} color="#FFF" />
            <Text style={styles.statValue}>{stat.value.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </LinearGradient>
        </Animated.View>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {/* Daily Claim */}
        <Animated.View
          style={{
            flex: 1,
            transform: [{ scale: canClaimDaily ? pulseAnim : 1 }],
          }}
        >
          <Pressable
            onPress={onClaimDaily}
            disabled={!canClaimDaily}
            style={({ pressed }) => [
              styles.actionCard,
              { opacity: pressed ? 0.9 : 1 },
              !canClaimDaily && styles.actionDisabled,
            ]}
          >
            <LinearGradient
              colors={canClaimDaily ? ['#10B981', '#059669'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              {canClaimDaily && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>NEW</Text>
                </View>
              )}
              <MaterialIcons name="card-giftcard" size={32} color="#FFF" />
              <Text style={styles.actionTitle}>Daily Reward</Text>
              <Text style={styles.actionSubtitle}>
                {canClaimDaily ? '+50 Credits' : nextDailyClaimTime || 'Claimed'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Watch Ad */}
        <Animated.View style={{ flex: 1 }}>
          <Pressable
            onPress={onWatchAd}
            disabled={stats.adsWatchedToday >= stats.maxAdsPerDay}
            style={({ pressed }) => [
              styles.actionCard,
              { opacity: pressed ? 0.9 : 1 },
              stats.adsWatchedToday >= stats.maxAdsPerDay && styles.actionDisabled,
            ]}
          >
            <LinearGradient
              colors={stats.adsWatchedToday < stats.maxAdsPerDay ? ['#8B5CF6', '#7C3AED'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <MaterialIcons name="play-circle-filled" size={32} color="#FFF" />
              <Text style={styles.actionTitle}>Watch Ad</Text>
              <Text style={styles.actionSubtitle}>
                {stats.adsWatchedToday}/{stats.maxAdsPerDay} today
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Buy Credits - Full width */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Pressable
          onPress={onBuyCredits}
          style={({ pressed }) => [
            styles.buyCreditsButton,
            { opacity: pressed ? 0.95 : 1 },
          ]}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyCreditsGradient}
          >
            <MaterialIcons name="shopping-cart" size={24} color="#FFF" />
            <Text style={styles.buyCreditsText}>Buy Credits</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );

  const renderTransactions = () => {
    const groupedTransactions = transactions.slice(0, 10); // Show last 10

    return (
      <View style={styles.transactionsSection}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {transactions.length > 10 && (
            <Pressable>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          )}
        </View>

        {groupedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtitle}>Your transaction history will appear here</Text>
          </View>
        ) : (
          groupedTransactions.map((transaction, index) => (
            <Animated.View
              key={transaction.id}
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
                onPress={() => onTransactionPress?.(transaction)}
                style={({ pressed }) => [
                  styles.transactionItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.transactionIconContainer}>
                  <LinearGradient
                    colors={getTransactionColors(transaction.type)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.transactionIconGradient}
                  >
                    <MaterialIcons
                      name={getTransactionIcon(transaction.type)}
                      size={20}
                      color="#FFF"
                    />
                  </LinearGradient>
                </View>

                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionTime}>
                    {new Date(transaction.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={styles.transactionAmountContainer}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      isPositive(transaction.type) ? styles.amountPositive : styles.amountNegative,
                    ]}
                  >
                    {isPositive(transaction.type) ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString()}
                  </Text>
                  {transaction.status === 'PENDING' && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Pressable style={styles.historyButton}>
          <MaterialIcons name="history" size={24} color="#1F2937" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6', '#8B5CF6']}
          />
        }
      >
        {renderBalanceCard()}
        {renderStatsCards()}
        {renderQuickActions()}
        {renderTransactions()}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  balanceCard: {
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
  balanceGradient: {
    position: 'relative',
    padding: 24,
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  patternDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  balanceContent: {
    position: 'relative',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  buyCreditsButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buyCreditsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  buyCreditsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  transactionItem: {
    flexDirection: 'row',
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
  transactionIconContainer: {
    marginRight: 12,
  },
  transactionIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountPositive: {
    color: '#10B981',
  },
  amountNegative: {
    color: '#EF4444',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
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

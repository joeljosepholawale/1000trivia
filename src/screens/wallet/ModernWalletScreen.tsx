import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';

interface Transaction {
  id: string;
  type: 'DAILY_CLAIM' | 'AD_REWARD' | 'PURCHASE' | 'ENTRY_FEE' | 'REFUND' | 'BONUS';
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

export const ModernWalletScreen: React.FC<ModernWalletScreenProps> = ({
  balance,
  stats,
  transactions,
  canClaimDaily,
  nextDailyClaimTime,
  onClaimDaily,
  onWatchAd,
  onBuyCredits,
  onTransactionPress,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(balanceAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DAILY_CLAIM':
        return 'event';
      case 'AD_REWARD':
        return 'play-circle-filled';
      case 'PURCHASE':
        return 'shopping-cart';
      case 'ENTRY_FEE':
        return 'sports-esports';
      case 'REFUND':
        return 'refresh';
      case 'BONUS':
        return 'redeem';
      default:
        return 'attach-money';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DAILY_CLAIM':
      case 'AD_REWARD':
      case 'PURCHASE':
      case 'REFUND':
      case 'BONUS':
        return theme.colors.success[500];
      case 'ENTRY_FEE':
        return theme.colors.error[500];
      default:
        return theme.colors.gray[500];
    }
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.timestamp).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  };

  const renderBalanceCard = () => (
    <Animated.View
      style={[
        styles.balanceCardContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: balanceAnim }],
        },
      ]}
    >
      <Card gradient gradientColors={[theme.colors.primary[400], theme.colors.primary[600]]} padding={6}>
        <View style={styles.balanceContent}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Dein Guthaben</Text>
            <TouchableOpacity style={styles.balanceInfoButton}>
              <MaterialIcons name="info-outline" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceValueContainer}>
            <MaterialIcons name="monetization-on" size={32} color={theme.colors.secondary[300]} />
            <AnimatedNumber
              value={balance}
              duration={1000}
              style={styles.balanceValue}
            />
            <Text style={styles.balanceCurrency}>Credits</Text>
          </View>

          {stats.dailyClaimStreak > 0 && (
            <View style={styles.streakBadge}>
              <MaterialIcons name="local-fire-department" size={16} color={theme.colors.secondary[500]} />
              <Text style={styles.streakText}>{stats.dailyClaimStreak} Tage Streak</Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {/* Daily Claim */}
      <TouchableOpacity
        onPress={onClaimDaily}
        disabled={!canClaimDaily}
        style={[styles.quickAction, !canClaimDaily && styles.quickActionDisabled]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={canClaimDaily
            ? [theme.colors.success[400], theme.colors.success[600]]
            : [theme.colors.gray[300], theme.colors.gray[400]]}
          style={styles.quickActionGradient}
        >
          <MaterialIcons name="event" size={32} color={theme.colors.white} />
          <Text style={styles.quickActionTitle}>Täglich</Text>
          <Text style={styles.quickActionSubtitle}>
            {canClaimDaily ? '10 Credits' : nextDailyClaimTime || 'Beansprucht'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Watch Ad */}
      <TouchableOpacity
        onPress={onWatchAd}
        disabled={stats.adsWatchedToday >= stats.maxAdsPerDay}
        style={[
          styles.quickAction,
          stats.adsWatchedToday >= stats.maxAdsPerDay && styles.quickActionDisabled,
        ]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={stats.adsWatchedToday < stats.maxAdsPerDay
            ? [theme.colors.info[400], theme.colors.info[600]]
            : [theme.colors.gray[300], theme.colors.gray[400]]}
          style={styles.quickActionGradient}
        >
          <MaterialIcons name="play-circle-filled" size={32} color={theme.colors.white} />
          <Text style={styles.quickActionTitle}>Werbung</Text>
          <Text style={styles.quickActionSubtitle}>
            {stats.adsWatchedToday}/{stats.maxAdsPerDay} heute
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Buy Credits */}
      <TouchableOpacity onPress={onBuyCredits} style={styles.quickAction} activeOpacity={0.8}>
        <LinearGradient
          colors={[theme.colors.secondary[400], theme.colors.secondary[600]]}
          style={styles.quickActionGradient}
        >
          <MaterialIcons name="shopping-cart" size={32} color={theme.colors.white} />
          <Text style={styles.quickActionTitle}>Kaufen</Text>
          <Text style={styles.quickActionSubtitle}>Credits</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Card variant="elevated" padding={4} style={styles.statCard}>
        <MaterialIcons name="trending-up" size={24} color={theme.colors.success[500]} />
        <Text style={styles.statValue}>{stats.totalEarned.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Verdient</Text>
      </Card>

      <Card variant="elevated" padding={4} style={styles.statCard}>
        <MaterialIcons name="trending-down" size={24} color={theme.colors.error[500]} />
        <Text style={styles.statValue}>{stats.totalSpent.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Ausgegeben</Text>
      </Card>
    </View>
  );

  const renderTransactions = () => {
    const grouped = groupTransactionsByDate();

    return (
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transaktionen</Text>
        
        {Object.keys(grouped).length === 0 ? (
          <Card variant="elevated" padding={6}>
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={theme.colors.gray[400]} />
              <Text style={styles.emptyStateText}>Noch keine Transaktionen</Text>
            </View>
          </Card>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <View key={date} style={styles.transactionGroup}>
              <Text style={styles.transactionDate}>{date}</Text>
              {items.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  onPress={() => onTransactionPress?.(transaction)}
                  activeOpacity={0.8}
                >
                  <Card variant="outlined" padding={4} style={styles.transactionCard}>
                    <View style={styles.transactionContent}>
                      <View
                        style={[
                          styles.transactionIcon,
                          { backgroundColor: getTransactionColor(transaction.type) + '20' },
                        ]}
                      >
                        <MaterialIcons
                          name={getTransactionIcon(transaction.type)}
                          size={24}
                          color={getTransactionColor(transaction.type)}
                        />
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                        <Text style={styles.transactionTime}>
                          {new Date(transaction.timestamp).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      <View style={styles.transactionAmount}>
                        <Text
                          style={[
                            styles.transactionValue,
                            {
                              color:
                                transaction.amount > 0
                                  ? theme.colors.success[500]
                                  : theme.colors.error[500],
                            },
                          ]}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount}
                        </Text>
                        {transaction.status === 'PENDING' && (
                          <Badge variant="warning" size="sm">
                            Ausstehend
                          </Badge>
                        )}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderBalanceCard()}
        {renderQuickActions()}
        {renderStats()}
        {renderTransactions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
  },
  balanceCardContainer: {
    marginBottom: theme.spacing[6],
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  balanceLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  balanceInfoButton: {
    padding: theme.spacing[1],
  },
  balanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  balanceValue: {
    fontSize: theme.typography.fontSize['5xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  balanceCurrency: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing[3],
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  streakText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.secondary[500],
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[6],
  },
  quickAction: {
    flex: 1,
  },
  quickActionDisabled: {
    opacity: 0.6,
  },
  quickActionGradient: {
    alignItems: 'center',
    paddingVertical: theme.spacing[5],
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  quickActionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginTop: theme.spacing[2],
  },
  quickActionSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing[1],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[6],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginVertical: theme.spacing[2],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  transactionsSection: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[3],
  },
  transactionGroup: {
    marginBottom: theme.spacing[5],
  },
  transactionDate: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
  },
  transactionCard: {
    marginBottom: theme.spacing[2],
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  transactionTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
});

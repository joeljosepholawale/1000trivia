import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialIcons} from '@expo/vector-icons';
import {apiClient} from '@/services/api/client';

export const WalletScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      // Fetch balance
      const balanceResponse = await apiClient.get('/wallet/balance');
      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data.balance || 0);
      }

      // Fetch transactions
      const transactionsResponse = await apiClient.get('/wallet/transactions');
      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data.slice(0, 10)); // Last 10
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const creditPackages = [
    {id: 1, credits: 100, price: '$0.99', popular: false},
    {id: 2, credits: 500, price: '$4.99', popular: true},
    {id: 3, credits: 1000, price: '$9.99', popular: false},
    {id: 4, credits: 5000, price: '$39.99', popular: false},
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.balanceCard}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        >
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            {loading ? '...' : `${balance} Credits`}
          </Text>
          <Text style={styles.balanceSubtext}>≈ ${(balance * 0.01).toFixed(2)} USD</Text>
        </LinearGradient>

        {/* Credit Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy Credits</Text>
          <View style={styles.packagesGrid}>
            {creditPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, pkg.popular && styles.popularPackage]}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                <MaterialIcons name="stars" size={32} color="#6366f1" />
                <Text style={styles.packageCredits}>{pkg.credits}</Text>
                <Text style={styles.packageLabel}>Credits</Text>
                <View style={styles.packagePriceContainer}>
                  <Text style={styles.packagePrice}>{pkg.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" style={{marginVertical: 20}} />
          ) : transactions.length > 0 ? (
            transactions.map((txn, index) => (
              <View key={index} style={styles.transactionCard}>
                <View style={[
                  styles.transactionIcon,
                  {backgroundColor: txn.type === 'credit' ? '#dcfce7' : '#fee2e2'}
                ]}>
                  <MaterialIcons
                    name={txn.type === 'credit' ? 'add' : 'remove'}
                    size={20}
                    color={txn.type === 'credit' ? '#16a34a' : '#dc2626'}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{txn.description || 'Transaction'}</Text>
                  <Text style={styles.transactionDate}>{formatDate(txn.created_at)}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  {color: txn.type === 'credit' ? '#16a34a' : '#dc2626'}
                ]}>
                  {txn.type === 'credit' ? '+' : '-'}{Math.abs(txn.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  packageCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: '1%',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  popularPackage: {
    borderColor: '#6366f1',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  packageCredits: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  packageLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  packagePriceContainer: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginVertical: 20,
  },
});

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialIcons} from '@expo/vector-icons';
import {RootState, AppDispatch} from '@/store';
import {apiClient} from '@/services/api/client';

export const HomeScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const {user} = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameModes, setGameModes] = useState<any[]>([]);
  const [stats, setStats] = useState({balance: 0, wins: 0, rank: '-'});
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch game modes
      const modesResponse = await apiClient.get('/game-modes');
      if (modesResponse.success && modesResponse.data) {
        setGameModes(modesResponse.data);
      }
      
      // Fetch user wallet balance
      const walletResponse = await apiClient.get('/wallet/balance');
      if (walletResponse.success && walletResponse.data) {
        setStats(prev => ({...prev, balance: walletResponse.data.balance || 0}));
      }

      // Fetch user stats
      const statsResponse = await apiClient.get('/user/stats');
      if (statsResponse.success && statsResponse.data) {
        setStats(prev => ({
          ...prev,
          wins: statsResponse.data.totalWins || 0,
          rank: statsResponse.data.currentRank || '-'
        }));
      }

      // Check daily bonus status
      const bonusResponse = await apiClient.get('/bonus/daily-status');
      if (bonusResponse.success && bonusResponse.data) {
        setDailyBonusClaimed(bonusResponse.data.claimed || false);
      }
    } catch (error) {
      // Silently handle load errors
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getIconForMode = (type: string) => {
    switch(type.toLowerCase()) {
      case 'free': return 'casino';
      case 'challenge': return 'flash-on';
      case 'tournament': return 'emoji-events';
      case 'super_tournament': return 'stars';
      default: return 'quiz';
    }
  };

  const getColorForMode = (type: string) => {
    switch(type.toLowerCase()) {
      case 'free': return '#6366f1';
      case 'challenge': return '#8b5cf6';
      case 'tournament': return '#ec4899';
      case 'super_tournament': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  const handleClaimBonus = async () => {
    if (dailyBonusClaimed || claimingBonus) return;

    try {
      setClaimingBonus(true);
      const response = await apiClient.post('/bonus/claim-daily', {});
      
      if (response.success && response.data) {
        setDailyBonusClaimed(true);
        setStats(prev => ({
          ...prev,
          balance: prev.balance + (response.data.amount || 50)
        }));
        Alert.alert(
          'Bonus Claimed! 🎉',
          `You received ${response.data.amount || 50} credits!\nCome back tomorrow for more.`,
          [{text: 'Awesome!'}]
        );
      } else {
        Alert.alert(
          'Already Claimed',
          response.error?.message || 'You\'ve already claimed your daily bonus. Come back tomorrow!'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to claim bonus. Please try again.');
    } finally {
      setClaimingBonus(false);
    }
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
          <View>
            <Text style={styles.greeting}>Welcome Back!</Text>
            <Text style={styles.username}>{user?.email || 'Player'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.statsCard}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        >
          <View style={styles.statItem}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#fff" />
            <Text style={styles.statValue}>{stats.balance}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={24} color="#fff" />
            <Text style={styles.statValue}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="trending-up" size={24} color="#fff" />
            <Text style={styles.statValue}>{stats.rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </LinearGradient>

        {/* Game Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Modes</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" style={{marginVertical: 20}} />
          ) : gameModes.length > 0 ? (
            gameModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={styles.modeCard}
                onPress={() => navigation.navigate('GameTab' as never)}
              >
                <View style={[styles.modeIcon, {backgroundColor: getColorForMode(mode.type)}]}>
                  <MaterialIcons name={getIconForMode(mode.type) as any} size={28} color="#fff" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeName}>{mode.name}</Text>
                  <Text style={styles.modePrize}>Entry: {mode.entryFee === 0 ? 'Free' : `${mode.entryFee} Credits`}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No game modes available</Text>
          )}
        </View>

        {/* Daily Bonus */}
        <TouchableOpacity
          style={[
            styles.dailyBonusCard,
            dailyBonusClaimed && styles.dailyBonusCardClaimed
          ]}
          onPress={handleClaimBonus}
          disabled={dailyBonusClaimed || claimingBonus}
        >
          <View style={[
            styles.dailyBonusIcon,
            dailyBonusClaimed && styles.dailyBonusIconClaimed
          ]}>
            <MaterialIcons 
              name={dailyBonusClaimed ? "check-circle" : "card-giftcard"} 
              size={32} 
              color={dailyBonusClaimed ? "#9ca3af" : "#6366f1"} 
            />
          </View>
          <View style={styles.dailyBonusInfo}>
            <Text style={[
              styles.dailyBonusTitle,
              dailyBonusClaimed && styles.dailyBonusTextClaimed
            ]}>
              {dailyBonusClaimed ? 'Bonus Claimed!' : 'Daily Bonus'}
            </Text>
            <Text style={[
              styles.dailyBonusSubtitle,
              dailyBonusClaimed && styles.dailyBonusTextClaimed
            ]}>
              {dailyBonusClaimed ? 'Come back tomorrow!' : claimingBonus ? 'Claiming...' : 'Claim 50 free credits!'}
            </Text>
          </View>
          {!dailyBonusClaimed && (
            <MaterialIcons name="arrow-forward" size={24} color="#6366f1" />
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
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
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modePrize: {
    fontSize: 14,
    color: '#6b7280',
  },
  dailyBonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  dailyBonusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dailyBonusInfo: {
    flex: 1,
  },
  dailyBonusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dailyBonusSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginVertical: 20,
  },
  dailyBonusCardClaimed: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  dailyBonusIconClaimed: {
    backgroundColor: '#e5e7eb',
  },
  dailyBonusTextClaimed: {
    color: '#9ca3af',
  },
});

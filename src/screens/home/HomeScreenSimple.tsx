import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialIcons} from '@expo/vector-icons';
import {RootState, AppDispatch} from '@/store';

export const HomeScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here later
    setTimeout(() => setRefreshing(false), 1000);
  };

  const gameModes = [
    {id: 'free', name: 'Free Mode', icon: 'casino', color: '#6366f1', prize: '$100'},
    {id: 'challenge', name: 'Challenge', icon: 'flash-on', color: '#8b5cf6', prize: '$500'},
    {id: 'tournament', name: 'Tournament', icon: 'emoji-events', color: '#ec4899', prize: '$1000'},
  ];

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
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={24} color="#fff" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="trending-up" size={24} color="#fff" />
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </LinearGradient>

        {/* Game Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Modes</Text>
          {gameModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.modeCard}
              onPress={() => Alert.alert('Coming Soon', `${mode.name} will be available soon!`)}
            >
              <View style={[styles.modeIcon, {backgroundColor: mode.color}]}>
                <MaterialIcons name={mode.icon as any} size={28} color="#fff" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modePrize}>Prize Pool: {mode.prize}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Bonus */}
        <TouchableOpacity
          style={styles.dailyBonusCard}
          onPress={() => Alert.alert('Daily Bonus', 'Claim feature coming soon!')}
        >
          <View style={styles.dailyBonusIcon}>
            <MaterialIcons name="card-giftcard" size={32} color="#6366f1" />
          </View>
          <View style={styles.dailyBonusInfo}>
            <Text style={styles.dailyBonusTitle}>Daily Bonus</Text>
            <Text style={styles.dailyBonusSubtitle}>Claim your free credits!</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color="#6366f1" />
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
});

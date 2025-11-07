import React, { useState, useRef, useEffect } from 'react';
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

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  avatar?: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  trend?: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

interface ModernLeaderboardScreenProps {
  entries: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onRefresh?: () => void;
  onUserPress?: (userId: string) => void;
}

export const ModernLeaderboardScreen: React.FC<ModernLeaderboardScreenProps> = ({
  entries,
  currentUser,
  period,
  onPeriodChange,
  onRefresh,
  onUserPress,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const getPeriodLabel = (p: LeaderboardPeriod) => {
    switch (p) {
      case 'daily':
        return 'Heute';
      case 'weekly':
        return 'Woche';
      case 'monthly':
        return 'Monat';
      case 'allTime':
        return 'Gesamt';
    }
  };

  const getRankBadgeColors = (rank: number): [string, string] => {
    switch (rank) {
      case 1:
        return [theme.colors.secondary[400], theme.colors.secondary[600]];
      case 2:
        return [theme.colors.gray[400], theme.colors.gray[600]];
      case 3:
        return [theme.colors.warning[400], theme.colors.warning[600]];
      default:
        return [theme.colors.gray[200], theme.colors.gray[300]];
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return 'emoji-events';
    return null;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['daily', 'weekly', 'monthly', 'allTime'] as LeaderboardPeriod[]).map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onPeriodChange(p)}
          style={[styles.periodButton, period === p && styles.periodButtonActive]}
          activeOpacity={0.8}
        >
          {period === p ? (
            <LinearGradient
              colors={[theme.colors.primary[400], theme.colors.primary[600]]}
              style={styles.periodButtonGradient}
            >
              <Text style={styles.periodButtonTextActive}>{getPeriodLabel(p)}</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.periodButtonText}>{getPeriodLabel(p)}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopThree = () => {
    const topThree = entries.slice(0, 3);
    if (topThree.length === 0) return null;

    // Reorder to show: 2nd, 1st, 3rd
    const orderedTopThree = [
      topThree.find((e) => e.rank === 2),
      topThree.find((e) => e.rank === 1),
      topThree.find((e) => e.rank === 3),
    ].filter(Boolean) as LeaderboardEntry[];

    return (
      <View style={styles.topThreeContainer}>
        {orderedTopThree.map((entry, index) => {
          const isFirst = entry.rank === 1;
          const heights = [120, 160, 100]; // Heights for 2nd, 1st, 3rd
          const height = heights[index];

          return (
            <TouchableOpacity
              key={entry.id}
              onPress={() => onUserPress?.(entry.id)}
              style={[styles.topThreeItem, { flex: 1 }]}
              activeOpacity={0.8}
            >
              <View style={styles.topThreeContent}>
                {/* Avatar */}
                <View
                  style={[
                    styles.topThreeAvatar,
                    isFirst && styles.topThreeAvatarFirst,
                    { marginBottom: theme.spacing[2] },
                  ]}
                >
                  <LinearGradient
                    colors={getRankBadgeColors(entry.rank)}
                    style={styles.topThreeAvatarGradient}
                  >
                    <Text style={styles.topThreeInitial}>
                      {entry.username.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  
                  {/* Rank Badge */}
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: getRankBadgeColors(entry.rank)[0] },
                    ]}
                  >
                    <MaterialIcons name={getRankIcon(entry.rank) || 'star'} size={16} color={theme.colors.white} />
                  </View>
                </View>

                {/* Username */}
                <Text style={styles.topThreeUsername} numberOfLines={1}>
                  {entry.username}
                </Text>

                {/* Podium */}
                <LinearGradient
                  colors={getRankBadgeColors(entry.rank)}
                  style={[styles.topThreePodium, { height }]}
                >
                  <Text style={styles.topThreeRank}>#{entry.rank}</Text>
                  <Text style={styles.topThreeScore}>{entry.score.toLocaleString()}</Text>
                  <Text style={styles.topThreeScoreLabel}>Punkte</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => {
    const isTopThree = entry.rank <= 3;
    if (isTopThree) return null; // Already rendered in top three

    return (
      <TouchableOpacity
        key={entry.id}
        onPress={() => onUserPress?.(entry.id)}
        activeOpacity={0.8}
      >
        <Card
          variant={entry.isCurrentUser ? 'elevated' : 'outlined'}
          padding={4}
          style={[
            styles.entryCard,
            entry.isCurrentUser && styles.currentUserCard,
          ]}
        >
          <View style={styles.entryContent}>
            {/* Rank */}
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>#{entry.rank}</Text>
              {entry.trend && entry.trend !== 'same' && (
                <MaterialIcons
                  name={entry.trend === 'up' ? 'arrow-drop-up' : 'arrow-drop-down'}
                  size={20}
                  color={
                    entry.trend === 'up'
                      ? theme.colors.success[500]
                      : theme.colors.error[500]
                  }
                />
              )}
            </View>

            {/* Avatar */}
            <View style={styles.entryAvatar}>
              <Text style={styles.entryInitial}>{entry.username.charAt(0).toUpperCase()}</Text>
            </View>

            {/* User Info */}
            <View style={styles.entryInfo}>
              <Text style={styles.entryUsername} numberOfLines={1}>
                {entry.username}
              </Text>
              <View style={styles.entryStats}>
                <MaterialIcons name="sports-esports" size={12} color={theme.colors.text.secondary} />
                <Text style={styles.entryStatsText}>{entry.gamesPlayed} Spiele</Text>
                <Text style={styles.entrySeparator}>•</Text>
                <Text style={styles.entryStatsText}>{entry.winRate}% Gewonnen</Text>
              </View>
            </View>

            {/* Score */}
            <View style={styles.entryScore}>
              <Text style={styles.entryScoreValue}>{entry.score.toLocaleString()}</Text>
              <Text style={styles.entryScoreLabel}>Punkte</Text>
            </View>
          </View>

          {entry.isCurrentUser && (
            <View style={styles.currentUserBadge}>
              <Badge variant="primary" size="sm">
                Du
              </Badge>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderCurrentUserSection = () => {
    if (!currentUser || currentUser.rank <= 3) return null;

    return (
      <View style={styles.currentUserSection}>
        <Text style={styles.sectionTitle}>Deine Position</Text>
        {renderLeaderboardEntry(currentUser)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="leaderboard" size={32} color={theme.colors.primary[500]} />
        <Text style={styles.headerTitle}>Bestenliste</Text>
      </View>

      {renderPeriodSelector()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Top Three Podium */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderTopThree()}
        </Animated.View>

        {/* Current User Section */}
        {renderCurrentUserSection()}

        {/* Rest of Leaderboard */}
        <View style={styles.leaderboardList}>
          {entries.length > 3 ? (
            <Text style={styles.sectionTitle}>Weitere Platzierungen</Text>
          ) : entries.length === 0 ? (
            <Card variant="elevated" padding={6}>
              <View style={styles.emptyState}>
                <MaterialIcons name="leaderboard" size={48} color={theme.colors.gray[400]} />
                <Text style={styles.emptyStateText}>Noch keine Einträge</Text>
              </View>
            </Card>
          ) : null}
          {entries.map((entry) => renderLeaderboardEntry(entry))}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
    gap: theme.spacing[2],
  },
  periodButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  periodButtonActive: {
    ...theme.shadows.sm,
  },
  periodButtonGradient: {
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: theme.spacing[3],
  },
  periodButtonTextActive: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
  },
  topThreeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: theme.spacing[8],
    gap: theme.spacing[3],
  },
  topThreeItem: {
    alignItems: 'center',
  },
  topThreeContent: {
    alignItems: 'center',
    width: '100%',
  },
  topThreeAvatar: {
    width: 64,
    height: 64,
    position: 'relative',
  },
  topThreeAvatarFirst: {
    width: 80,
    height: 80,
  },
  topThreeAvatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  topThreeInitial: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    ...theme.shadows.md,
  },
  topThreeUsername: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    maxWidth: 100,
    textAlign: 'center',
  },
  topThreePodium: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    ...theme.shadows.md,
  },
  topThreeRank: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
    marginBottom: theme.spacing[1],
  },
  topThreeScore: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  topThreeScoreLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing[1],
  },
  currentUserSection: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  leaderboardList: {
    gap: theme.spacing[2],
  },
  entryCard: {
    marginBottom: theme.spacing[2],
    position: 'relative',
  },
  currentUserCard: {
    borderColor: theme.colors.primary[300],
    borderWidth: 2,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
  },
  entryAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryInitial: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.gray[600],
  },
  entryInfo: {
    flex: 1,
  },
  entryUsername: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  entryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  entryStatsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  entrySeparator: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing[1],
  },
  entryScore: {
    alignItems: 'flex-end',
  },
  entryScoreValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[500],
  },
  entryScoreLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  currentUserBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
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
});

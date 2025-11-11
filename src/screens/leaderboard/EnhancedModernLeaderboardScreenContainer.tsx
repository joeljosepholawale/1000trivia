import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {RootState, AppDispatch} from '@/store';
import {loadLeaderboard} from '@/store/slices/leaderboardSlice';
import {EnhancedModernLeaderboardScreen} from './EnhancedModernLeaderboardScreen';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

export const EnhancedModernLeaderboardScreenContainer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  
  const {leaderboard, isLoading} = useSelector((state: RootState) => state.leaderboard);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      await dispatch(loadLeaderboard(period)).unwrap();
    } catch (error) {
      // Silently handle load errors
    }
  };

  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod);
  };

  const handleUserPress = (userId: string) => {
    // TODO: Navigate to user profile
  };

  // Map leaderboard data to screen format
  const entries = (leaderboard || []).map((entry, index) => ({
    id: entry.userId,
    rank: entry.rank || index + 1,
    username: entry.username || `Player ${entry.userId.slice(0, 6)}`,
    avatar: undefined,
    score: entry.score,
    gamesPlayed: entry.gamesPlayed || 0,
    winRate: entry.winRate || 0,
    trend: entry.rankChange 
      ? entry.rankChange > 0 ? 'up' as const
      : entry.rankChange < 0 ? 'down' as const 
      : 'same' as const
      : undefined,
    isCurrentUser: entry.userId === user?.id,
  }));

  // Find current user's entry
  const currentUser = entries.find(e => e.isCurrentUser);

  return (
    <EnhancedModernLeaderboardScreen
      entries={entries}
      currentUser={currentUser}
      period={period}
      onPeriodChange={handlePeriodChange}
      onRefresh={loadData}
      onUserPress={handleUserPress}
    />
  );
};

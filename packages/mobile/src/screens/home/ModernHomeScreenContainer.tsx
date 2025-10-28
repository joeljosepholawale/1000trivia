import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '@/store';
import { loadWalletInfo, claimDailyCredits } from '@/store/slices/walletSlice';
import { loadGameModes, loadActivePeriods } from '@/store/slices/gameSlice';
import { EnhancedModernHomeScreen } from './EnhancedModernHomeScreen';

export const ModernHomeScreenContainer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const { user } = useSelector((state: RootState) => state.auth);
  const { balance, isLoading: walletLoading } = useSelector((state: RootState) => state.wallet);
  const { gameModes, isLoading: gameLoading } = useSelector((state: RootState) => state.game);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadWalletInfo()),
        dispatch(loadGameModes()),
        dispatch(loadActivePeriods()),
      ]);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const handleGameModePress = (modeId: string) => {
    navigation.navigate('GameTab' as never);
  };

  const handleClaimDaily = async () => {
    try {
      await dispatch(claimDailyCredits()).unwrap();
      await dispatch(loadWalletInfo());
    } catch (error) {
      console.error('Failed to claim daily credits:', error);
    }
  };

  // Map user data
  const userData = user
    ? {
        name: user.displayName || user.email?.split('@')[0] || 'Player',
        email: user.email || '',
        level: 5, // TODO: Get from user profile
        credits: balance,
      }
    : undefined;

  // Map stats
  const stats = {
    gamesPlayed: 0, // TODO: Get from user stats
    winRate: 0, // TODO: Get from user stats
    currentRank: 0, // TODO: Get from leaderboard
  };

  return (
    <EnhancedModernHomeScreen
      user={userData}
      stats={stats}
      onGameModePress={handleGameModePress}
      onClaimDaily={handleClaimDaily}
      onRefresh={loadData}
      onNotificationPress={() => {}}
    />
  );
};

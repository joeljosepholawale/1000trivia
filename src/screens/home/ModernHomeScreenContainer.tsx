import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '@/store';
import { loadWalletInfo, claimDailyCredits } from '@/store/slices/walletSlice';
import { loadGameModes, loadActivePeriods } from '@/store/slices/gameSlice';
import { loadUserStats, loadUserProfile } from '@/store/slices/userSlice';
import { EnhancedModernHomeScreen } from './EnhancedModernHomeScreen';
import { getUserDisplayName, getUserLevel, isEmailVerified } from '@/utils/userHelpers';
import { notifyEmailVerificationNeeded } from '@/services/notifications';

export const ModernHomeScreenContainer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const { user } = useSelector((state: RootState) => state.auth);
  const { balance, isLoading: walletLoading } = useSelector((state: RootState) => state.wallet);
  const { gameModes, isLoading: gameLoading } = useSelector((state: RootState) => state.game);
  const { stats, profile, isLoading: userLoading } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    loadData();
    
    // Prompt for email verification if not verified after 1 minute
    if (!isEmailVerified(user)) {
      const timer = setTimeout(() => {
        notifyEmailVerificationNeeded();
      }, 60000); // 1 minute
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadWalletInfo()),
        dispatch(loadGameModes()),
        dispatch(loadActivePeriods()),
        dispatch(loadUserStats()),
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

  // Map user data with safe defaults
  const userData = {
    name: getUserDisplayName(user),
    email: user?.email || '',
    level: profile?.level || getUserLevel(user),
    credits: balance || 0,
    avatar: undefined,
    exp: profile?.currentXP || 0,
    maxExp: profile?.xpToNextLevel || 1000,
  };

  // Map stats with real data
  const userStats = {
    gamesPlayed: stats?.gamesPlayed || 0,
    winRate: stats?.winRate || 0,
    currentRank: stats?.currentRank || 0,
  };

  return (
    <EnhancedModernHomeScreen
      user={userData}
      stats={userStats}
      onGameModePress={handleGameModePress}
      onClaimDaily={handleClaimDaily}
      onRefresh={loadData}
      onNotificationPress={() => {}}
    />
  );
};

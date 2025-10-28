import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '@/store';
import { loadWalletInfo, claimDailyCredits } from '@/store/slices/walletSlice';
import { EnhancedModernWalletScreen } from './EnhancedModernWalletScreen';

export const EnhancedModernWalletScreenContainer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const { balance, dailyClaim, transactions, isLoading } = useSelector((state: RootState) => state.wallet);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await dispatch(loadWalletInfo());
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const handleClaimDaily = async () => {
    try {
      await dispatch(claimDailyCredits()).unwrap();
      await dispatch(loadWalletInfo());
    } catch (error) {
      console.error('Failed to claim daily credits:', error);
    }
  };

  const handleWatchAd = () => {
    // TODO: Implement ad watching logic
    console.log('Watch ad');
  };

  const handleBuyCredits = () => {
    navigation.navigate('CreditStore' as never);
  };

  // Mock stats - should come from backend
  const stats = {
    totalEarned: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    totalSpent: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    dailyClaimStreak: dailyClaim.streak || 0,
    adsWatchedToday: 0, // TODO: Get from backend
    maxAdsPerDay: 5,
  };

  return (
    <EnhancedModernWalletScreen
      balance={balance}
      stats={stats}
      transactions={transactions}
      canClaimDaily={dailyClaim.canClaim}
      nextDailyClaimTime={dailyClaim.nextClaimAt ? new Date(dailyClaim.nextClaimAt).toLocaleTimeString() : undefined}
      onClaimDaily={handleClaimDaily}
      onWatchAd={handleWatchAd}
      onBuyCredits={handleBuyCredits}
      onRefresh={loadData}
    />
  );
};

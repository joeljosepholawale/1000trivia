import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '@/store';
import { loadWalletInfo, claimDailyCredits, loadTransactions } from '@/store/slices/walletSlice';
import { EnhancedModernWalletScreen } from './EnhancedModernWalletScreen';

export const EnhancedModernWalletScreenContainer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const { balance, dailyClaim, transactions = [], isLoading } = useSelector((state: RootState) => state.wallet);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadWalletInfo()),
        dispatch(loadTransactions()),
      ]);
    } catch (error) {
    }
  };

  const handleClaimDaily = async () => {
    try {
      const result = await dispatch(claimDailyCredits()).unwrap();
      await dispatch(loadWalletInfo());
      // Could show success toast here
      console.log('Daily credits claimed successfully:', result);
    } catch (error: any) {
      // Could show error toast here
      if (error?.includes?.('Email verification required')) {
      }
    }
  };

  const handleWatchAd = () => {
    // TODO: Implement ad watching logic
  };

  const handleBuyCredits = () => {
    navigation.navigate('CreditStore' as never);
  };

  // Mock stats - should come from backend
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const stats = {
    totalEarned: safeTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    totalSpent: safeTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    dailyClaimStreak: dailyClaim?.streak || 0,
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

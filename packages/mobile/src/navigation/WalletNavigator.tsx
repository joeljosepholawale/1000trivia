import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {EnhancedModernWalletScreenContainer} from '@/screens/wallet/EnhancedModernWalletScreenContainer';
import {ModernCreditStoreScreen} from '@/screens/store/ModernCreditStoreScreen';
import {TransactionHistoryScreen} from '@/screens/wallet/TransactionHistoryScreen';

export type WalletStackParamList = {
  Wallet: undefined;
  CreditStore: undefined;
  TransactionHistory: undefined;
};

const Stack = createNativeStackNavigator<WalletStackParamList>();

export const WalletNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Wallet" component={EnhancedModernWalletScreenContainer} />
      <Stack.Screen name="CreditStore" component={ModernCreditStoreScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    </Stack.Navigator>
  );
};
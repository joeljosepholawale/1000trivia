import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {WalletScreen} from '@/screens/wallet/WalletScreenWorking';

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
      <Stack.Screen name="Wallet" component={WalletScreen} />
    </Stack.Navigator>
  );
};
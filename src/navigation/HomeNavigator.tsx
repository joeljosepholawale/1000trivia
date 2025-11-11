import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ModernHomeScreenContainer} from '@/screens/home/ModernHomeScreenContainer';

export type HomeStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={ModernHomeScreenContainer} />
    </Stack.Navigator>
  );
};

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {HomeScreen} from '@/screens/home/HomeScreenSimple';

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
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};
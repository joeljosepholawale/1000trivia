import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {EnhancedModernProfileScreen} from '@/screens/profile/EnhancedModernProfileScreen';
import {SettingsScreen} from '@/screens/profile/SettingsScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={EnhancedModernProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};
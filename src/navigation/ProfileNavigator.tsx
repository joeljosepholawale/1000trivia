import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ProfileScreenContainer} from '@/screens/profile/ProfileScreenContainer';
import {SettingsScreen} from '@/screens/profile/SettingsScreen';
import {AccountSettingsScreen} from '@/screens/profile/AccountSettingsScreen';
import {HelpSupportScreen} from '@/screens/profile/HelpSupportScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  HelpSupport: undefined;
  EmailVerification: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreenContainer} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
};
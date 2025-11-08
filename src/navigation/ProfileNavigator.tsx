import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ProfileScreen} from '@/screens/profile/ProfileScreenWorking';
import {AccountSettingsScreen} from '@/screens/profile/AccountSettingsScreen';
import {HelpSupportScreen} from '@/screens/profile/HelpSupportScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  AccountSettings: undefined;
  HelpSupport: undefined;
  Settings: undefined;
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
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
};
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {LoginScreen} from '@/screens/auth/LoginScreen';
import {RegisterScreen} from '@/screens/auth/RegisterScreen';
import {OTPVerificationScreen} from '@/screens/auth/OTPVerificationScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: {
    email: string;
    sessionId: string;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    </Stack.Navigator>
  );
};
import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';

import {RootState, AppDispatch} from '@/store';
import {refreshToken, checkStoredAuth} from '@/store/slices/authSlice';
import {initializeAds} from '@/store/slices/adsSlice';
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';
import {LoadingScreen} from '@/components/LoadingScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {isAuthenticated, isLoading, token} = useSelector((state: RootState) => state.auth);
  const {adsEnabled} = useSelector((state: RootState) => state.ads);

  useEffect(() => {
    // Check for stored authentication on app start
    if (!isAuthenticated && !token) {
      dispatch(checkStoredAuth());
    }
  }, [dispatch, isAuthenticated, token]);

  useEffect(() => {
    // Initialize ads when app starts if ads are enabled
    if (isAuthenticated && adsEnabled) {
      dispatch(initializeAds());
    }
  }, [dispatch, isAuthenticated, adsEnabled]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};
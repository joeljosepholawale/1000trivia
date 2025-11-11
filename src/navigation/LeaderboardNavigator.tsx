import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Colors} from '../styles/colors';

import {EnhancedModernLeaderboardScreenContainer} from '@/screens/leaderboard/EnhancedModernLeaderboardScreenContainer';

export type LeaderboardStackParamList = {
  Leaderboard: undefined;
  Winners: undefined;
  UserStats: undefined;
  PeriodHistory: undefined;
};

const Stack = createStackNavigator<LeaderboardStackParamList>();

export const LeaderboardNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Leaderboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 18,
        },
        cardStyle: {
          backgroundColor: Colors.background,
        },
      }}>
      <Stack.Screen
        name="Leaderboard"
        component={EnhancedModernLeaderboardScreenContainer}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Colors} from '../styles/colors';

// Import modern screens
import {EnhancedModernLeaderboardScreen} from '../screens/leaderboard/EnhancedModernLeaderboardScreen';
import WinnersScreen from '../screens/leaderboard/WinnersScreen';
import UserStatsScreen from '../screens/leaderboard/UserStatsScreen';
import PeriodHistoryScreen from '../screens/leaderboard/PeriodHistoryScreen';

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
        component={EnhancedModernLeaderboardScreen}
        options={{
          title: 'Rankings',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="Winners"
        component={WinnersScreen}
        options={{
          title: 'Winners Hall',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="UserStats"
        component={UserStatsScreen}
        options={{
          title: 'My Statistics',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="PeriodHistory"
        component={PeriodHistoryScreen}
        options={{
          title: 'History',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
};
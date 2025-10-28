import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MaterialIcons} from '@expo/vector-icons';

import {HomeNavigator} from './HomeNavigator';
import {GameNavigator} from './GameNavigator';
import {WalletNavigator} from './WalletNavigator';
import {LeaderboardNavigator} from './LeaderboardNavigator';
import {ProfileNavigator} from './ProfileNavigator';
import {colors} from '@/styles/colors';

export type MainTabParamList = {
  HomeTab: undefined;
  GameTab: undefined;
  WalletTab: undefined;
  LeaderboardTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'GameTab':
              iconName = 'sports-esports';
              break;
            case 'WalletTab':
              iconName = 'account-balance-wallet';
              break;
            case 'LeaderboardTab':
              iconName = 'leaderboard';
              break;
            case 'ProfileTab':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName as any} size={focused ? 28 : 24} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
          height: 70,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -3},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{tabBarLabel: 'Home'}}
      />
      <Tab.Screen
        name="GameTab"
        component={GameNavigator}
        options={{tabBarLabel: 'Play'}}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletNavigator}
        options={{tabBarLabel: 'Wallet'}}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardNavigator}
        options={{tabBarLabel: 'Rankings'}}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{tabBarLabel: 'Profile'}}
      />
    </Tab.Navigator>
  );
};
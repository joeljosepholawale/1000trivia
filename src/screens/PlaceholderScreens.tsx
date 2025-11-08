import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export const WalletScreen = () => (
  <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 24, fontWeight: 'bold'}}>Wallet Screen</Text>
      <Text style={{color: '#666', marginTop: 8}}>Feature in development</Text>
    </View>
  </SafeAreaView>
);

export const ProfileScreen = () => (
  <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 24, fontWeight: 'bold'}}>Profile Screen</Text>
      <Text style={{color: '#666', marginTop: 8}}>Feature in development</Text>
    </View>
  </SafeAreaView>
);

export const LeaderboardScreen = () => (
  <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 24, fontWeight: 'bold'}}>Leaderboard</Text>
      <Text style={{color: '#666', marginTop: 8}}>Feature in development</Text>
    </View>
  </SafeAreaView>
);

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ModernGameModeSelectionScreen} from '@/screens/game/ModernGameModeSelectionScreen';
import {ModernGameplayScreen} from '@/screens/game/ModernGameplayScreen';
import {ModernGameResultsScreen} from '@/screens/game/ModernGameResultsScreen';

export type GameStackParamList = {
  GameModeSelection: undefined;
  Gameplay: {
    sessionId: string;
    modeId: string;
  };
  GameResults: {
    sessionId: string;
    finalScore: number;
    rank?: number;
  };
};

const Stack = createNativeStackNavigator<GameStackParamList>();

export const GameNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="GameModeSelection"
    >
      <Stack.Screen name="GameModeSelection" component={ModernGameModeSelectionScreen} />
      <Stack.Screen name="Gameplay" component={ModernGameplayScreen} />
      <Stack.Screen name="GameResults" component={ModernGameResultsScreen} />
    </Stack.Navigator>
  );
};
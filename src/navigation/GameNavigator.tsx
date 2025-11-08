import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {GameModeSelection} from '@/screens/game/GameModeSelectionSimple';
import {QuizGameplayScreen} from '@/screens/game/QuizGameplayScreen';

export type GameStackParamList = {
  GameModeSelection: undefined;
  QuizGameplay: {
    gameModeId: string;
  };
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
      <Stack.Screen name="GameModeSelection" component={GameModeSelection} />
      <Stack.Screen name="QuizGameplay" component={QuizGameplayScreen} />
    </Stack.Navigator>
  );
};
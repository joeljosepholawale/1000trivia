import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {GameModeSelectionWrapper} from '@/screens/game/GameModeSelectionWrapper';
import {ModernGameplayScreenContainer} from '@/screens/game/ModernGameplayScreenContainer';
import {ModernGameResultsScreenContainer} from '@/screens/game/ModernGameResultsScreenContainer';
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
      <Stack.Screen name="GameModeSelection" component={GameModeSelectionWrapper} />
      <Stack.Screen name="Gameplay" component={ModernGameplayScreenContainer} />
      <Stack.Screen name="GameResults" component={ModernGameResultsScreenContainer} />
      <Stack.Screen name="QuizGameplay" component={QuizGameplayScreen} />
    </Stack.Navigator>
  );
};
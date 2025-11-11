import React, {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '@/store';
import {GameStackParamList} from '@/navigation/GameNavigator';
import {ModernGameModeSelectionScreen} from './ModernGameModeSelectionScreen';
import {loadGameModes, joinGameMode} from '@/store/slices/gameSlice';
import {Alert} from 'react-native';
import {isEmailVerified, getUserLevel} from '@/utils/userHelpers';

type NavigationProp = NativeStackNavigationProp<GameStackParamList, 'GameModeSelection'>;

export const GameModeSelectionWrapper: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const {credits} = useSelector((state: RootState) => state.wallet);
  const {gameModes, activePeriods, isLoading} = useSelector((state: RootState) => state.game);
  const [joining, setJoining] = useState(false);
  
  const userCredits = credits || 0;
  const userLevel = getUserLevel(user);
  const emailVerified = isEmailVerified(user);

  // Load game modes and active periods from backend on mount
  useEffect(() => {
    dispatch(loadGameModes());
    dispatch(loadActivePeriods());
  }, [dispatch]);

  const handleJoinMode = async (periodId: string) => {
    if (joining) return;
    
    try {
      setJoining(true);
      
      // Join the game mode via API using periodId
      const result = await dispatch(joinGameMode({periodId})).unwrap();
      
      // Navigate to gameplay screen with session ID
      navigation.navigate('Gameplay', {
        periodId,
        sessionId: result.session?.id || result.sessionId,
      });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game mode';
      Alert.alert('Error', errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ModernGameModeSelectionScreen
      userCredits={userCredits}
      userLevel={userLevel}
      isEmailVerified={emailVerified}
      activePeriods={activePeriods}
      isLoading={isLoading || joining}
      onJoinMode={handleJoinMode}
      onBack={handleBack}
    />
  );
};

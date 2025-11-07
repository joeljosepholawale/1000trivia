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
  const {gameModes, isLoading} = useSelector((state: RootState) => state.game);
  const [joining, setJoining] = useState(false);
  
  const userCredits = credits || 0;
  const userLevel = getUserLevel(user);
  const emailVerified = isEmailVerified(user);

  // Load game modes from backend on mount
  useEffect(() => {
    dispatch(loadGameModes());
  }, [dispatch]);

  const handleJoinMode = async (modeId: string) => {
    if (joining) return;
    
    try {
      setJoining(true);
      
      // Join the game mode via API
      const result = await dispatch(joinGameMode({modeId})).unwrap();
      
      // Navigate to gameplay screen with session ID
      navigation.navigate('Gameplay', {
        modeId,
        sessionId: result.session.id,
      });
    } catch (error: any) {
      console.error('Failed to join game:', error);
      Alert.alert('Error', error || 'Failed to join game mode');
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
      onJoinMode={handleJoinMode}
      onBack={handleBack}
    />
  );
};

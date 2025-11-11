import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';

import {RootState, AppDispatch} from '@/store';
import {loadGameModes, loadActivePeriods, joinGameMode} from '@/store/slices/gameSlice';
import {loadWalletInfo} from '@/store/slices/walletSlice';
import {GameStackParamList} from '@/navigation/GameNavigator';
import {colors} from '@/styles/colors';
import {LoadingScreen} from '@/components/LoadingScreen';
import type {GameMode} from '@1000ravier/shared';

type NavigationProp = NativeStackNavigationProp<GameStackParamList, 'GameModeSelection'>;

export const GameModeSelectionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  
  const {gameModes, activePeriods, isLoading, error} = useSelector((state: RootState) => state.game);
  const {balance} = useSelector((state: RootState) => state.wallet);
  
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [joiningGame, setJoiningGame] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadGameModes()),
        dispatch(loadActivePeriods()),
        dispatch(loadWalletInfo()),
      ]);
    } catch (error) {
      // Silently handle load errors - UI will show loading state
    }
  };

  const handleJoinGame = async (mode: GameMode) => {
    if (joiningGame) return;

    // Check if user has enough credits for paid games
    if (mode.entryFeeCredits > 0 && balance < mode.entryFeeCredits) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${mode.entryFeeCredits} credits to play this game. Your current balance is ${balance} credits.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Buy Credits',
            onPress: () => navigation.navigate('WalletTab' as never),
          },
        ]
      );
      return;
    }

    setJoiningGame(true);
    setSelectedMode(mode.id);

    try {
      const result = await dispatch(joinGameMode({
        modeId: mode.id,
      })).unwrap();

      if (result.session) {
        navigation.navigate('Gameplay', {
          sessionId: result.session.id,
          modeId: mode.id,
        });
      }
    } catch (error: any) {
      Alert.alert(
        'Failed to Join Game',
        error || 'Something went wrong. Please try again.'
      );
    } finally {
      setJoiningGame(false);
      setSelectedMode(null);
    }
  };

  const renderGameModeCard = (mode: GameMode) => {
    const isActive = mode.isActive;
    const activePeriod = activePeriods.find(p => p.gameModeId === mode.id);
    const isJoining = selectedMode === mode.id && joiningGame;
    const canAfford = balance >= mode.entryFeeCredits;

    return (
      <TouchableOpacity
        key={mode.id}
        style={[
          styles.gameModeCard,
          !isActive && styles.inactiveCard,
          !canAfford && mode.entryFeeCredits > 0 && styles.unaffordableCard,
        ]}
        onPress={() => isActive ? handleJoinGame(mode) : null}
        disabled={!isActive || isJoining}
      >
        <View style={styles.cardHeader}>
          <View style={styles.modeInfo}>
            <Text style={[styles.modeName, !isActive && styles.inactiveText]}>
              {mode.name}
            </Text>
            <Text style={[styles.modeDescription, !isActive && styles.inactiveText]}>
              {mode.description}
            </Text>
          </View>
          {!isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Coming Soon</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.gameDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons 
                name="quiz" 
                size={16} 
                color={isActive ? colors.textSecondary : colors.textLight} 
              />
              <Text style={[styles.detailText, !isActive && styles.inactiveText]}>
                {mode.questionsCount} Questions
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons 
                name="timer" 
                size={16} 
                color={isActive ? colors.textSecondary : colors.textLight} 
              />
              <Text style={[styles.detailText, !isActive && styles.inactiveText]}>
                {mode.timePerQuestionSeconds}s per question
              </Text>
            </View>
            
            {activePeriod && (
              <View style={styles.detailItem}>
                <MaterialIcons 
                  name="people" 
                  size={16} 
                  color={isActive ? colors.textSecondary : colors.textLight} 
                />
                <Text style={[styles.detailText, !isActive && styles.inactiveText]}>
                  {activePeriod.participantCount || 0} players
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.prizeInfo}>
              <Text style={[styles.prizeLabel, !isActive && styles.inactiveText]}>
                Prize Pool
              </Text>
              <Text style={[styles.prizeAmount, !isActive && styles.inactiveText]}>
                ₦{mode.prizePoolNgn.toLocaleString()}
              </Text>
            </View>

            <View style={styles.entryFee}>
              {mode.entryFeeCredits > 0 ? (
                <View style={[
                  styles.feeContainer,
                  !canAfford && styles.unaffordableFee
                ]}>
                  <MaterialIcons 
                    name="credit-card" 
                    size={16} 
                    color={!canAfford ? colors.error : (isActive ? colors.secondary : colors.textLight)} 
                  />
                  <Text style={[
                    styles.feeText,
                    !isActive && styles.inactiveText,
                    !canAfford && styles.unaffordableText
                  ]}>
                    {mode.entryFeeCredits} Credits
                  </Text>
                </View>
              ) : (
                <View style={styles.freeContainer}>
                  <MaterialIcons 
                    name="free-breakfast" 
                    size={16} 
                    color={isActive ? colors.success : colors.textLight} 
                  />
                  <Text style={[styles.freeText, !isActive && styles.inactiveText]}>
                    Free
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {isJoining && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Joining game...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && gameModes.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Game Mode</Text>
        <Text style={styles.subtitle}>
          Your balance: <Text style={styles.balanceText}>{balance} Credits</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {gameModes.map(renderGameModeCard)}

        {gameModes.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <MaterialIcons name="sports-esports" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>No game modes available</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  balanceText: {
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gameModeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.7,
  },
  unaffordableCard: {
    borderWidth: 1,
    borderColor: colors.errorLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inactiveText: {
    color: colors.textLight,
  },
  inactiveBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveBadgeText: {
    fontSize: 12,
    color: colors.textWhite,
    fontWeight: '600',
  },
  cardContent: {
    gap: 16,
  },
  gameDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  prizeInfo: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  prizeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  entryFee: {
    alignItems: 'flex-end',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  unaffordableFee: {
    backgroundColor: colors.errorLight,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  unaffordableText: {
    color: colors.error,
  },
  freeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  freeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {apiClient} from '@/services/api/client';

export const GameModeSelection = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [modes, setModes] = useState<any[]>([]);

  useEffect(() => {
    loadGameModes();
  }, []);

  const loadGameModes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/game-modes');
      if (response.success && response.data) {
        setModes(response.data);
      }
    } catch (error) {
      console.error('Failed to load game modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForMode = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'free': return 'casino';
      case 'challenge': return 'flash-on';
      case 'tournament': return 'emoji-events';
      case 'super_tournament': return 'stars';
      default: return 'quiz';
    }
  };

  const getColorForMode = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'free': return '#6366f1';
      case 'challenge': return '#8b5cf6';
      case 'tournament': return '#ec4899';
      case 'super_tournament': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  const handlePlayMode = (mode: any) => {
    Alert.alert(
      mode.name,
      `Entry Fee: ${mode.entry_fee === 0 ? 'Free' : mode.entry_fee + ' Credits'}\nReady to play?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Play Now',
          onPress: () => navigation.navigate('QuizGameplay' as never, {gameModeId: mode.id} as never),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Game Mode</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView>
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" style={{marginVertical: 40}} />
          ) : modes.length > 0 ? (
            modes.map((mode) => {
              const color = getColorForMode(mode.type);
              const icon = getIconForMode(mode.type);
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={styles.modeCard}
                  onPress={() => handlePlayMode(mode)}
                >
                  <LinearGradient
                    colors={[color, color + '99']}
                    style={styles.modeGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                  >
                    <View style={styles.modeIcon}>
                      <MaterialIcons name={icon as any} size={40} color="#fff" />
                    </View>
                    <Text style={styles.modeName}>{mode.name}</Text>
                    <Text style={styles.modeDescription}>
                      {mode.description || `Prize pool: ${mode.prizePool || 0} credits`}
                    </Text>
                    <View style={styles.entryFeeContainer}>
                      <Text style={styles.entryFeeLabel}>Entry Fee:</Text>
                      <Text style={styles.entryFeeValue}>
                        {mode.entry_fee === 0 ? 'Free' : `${mode.entry_fee} Credits`}
                      </Text>
                    </View>
                    <View style={styles.playButton}>
                      <Text style={styles.playButtonText}>Play Now</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No game modes available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  modeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modeGradient: {
    padding: 24,
  },
  modeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  entryFeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  entryFeeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 8,
  },
  entryFeeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginVertical: 40,
  },
});

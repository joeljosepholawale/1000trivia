import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';

export const GameModeSelection = () => {
  const navigation = useNavigation();

  const modes = [
    {
      id: 'free',
      name: 'Free Weekly Challenge',
      description: '1000 questions • $100 prize pool',
      icon: 'casino',
      color: '#6366f1',
      entryFee: 'Free',
    },
    {
      id: 'challenge',
      name: 'Premium Challenge',
      description: '1000 questions • $500 prize pool',
      icon: 'flash-on',
      color: '#8b5cf6',
      entryFee: '50 Credits',
    },
    {
      id: 'tournament',
      name: 'Tournament',
      description: '1000 questions • $1000 prize pool',
      icon: 'emoji-events',
      color: '#ec4899',
      entryFee: '100 Credits',
    },
  ];

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
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.modeCard}
              onPress={() => {}}
            >
              <LinearGradient
                colors={[mode.color, mode.color + '99']}
                style={styles.modeGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <View style={styles.modeIcon}>
                  <MaterialIcons name={mode.icon as any} size={40} color="#fff" />
                </View>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
                <View style={styles.entryFeeContainer}>
                  <Text style={styles.entryFeeLabel}>Entry Fee:</Text>
                  <Text style={styles.entryFeeValue}>{mode.entryFee}</Text>
                </View>
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>Play Now</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
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
});

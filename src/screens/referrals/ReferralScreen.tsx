/**
 * Referral Screen
 * Share referral code and enter friend codes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  getOrCreateReferralCode,
  useReferralCode,
  getReferralStatus,
  ReferralStatus,
} from '../../features/referrals/referral';

export default function ReferralScreen() {
  const { theme } = useTheme();
  const [status, setStatus] = useState<ReferralStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    await getOrCreateReferralCode();
    const data = await getReferralStatus();
    setStatus(data);
    setLoading(false);
  };

  const handleShare = async () => {
    if (!status?.myCode) return;
    try {
      await Share.share({
        message: `Spiel mit mir 1000Ravier! Verwende meinen Code "${status.myCode}" und erhalte 100 Credits! 🎴`,
        title: '1000Ravier Einladung',
      });
    } catch (e) {
    }
  };

  const handleSubmit = async () => {
    if (!inputCode.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Code ein.');
      return;
    }

    setSubmitting(true);
    const result = await useReferralCode(inputCode.trim().toUpperCase());
    setSubmitting(false);

    if (result.ok) {
      Alert.alert('Erfolg!', 'Code erfolgreich verwendet! Du hast 100 Credits erhalten.', [
        { text: 'OK', onPress: loadStatus },
      ]);
      setInputCode('');
    } else {
      Alert.alert('Fehler', result.error || 'Unbekannter Fehler');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.title, { color: theme.colors.text }]}>Freunde einladen</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Lade Freunde ein und verdiene gemeinsam Belohnungen!
      </Text>

      {/* My Referral Code */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Dein Einladungscode</Text>
        <View style={[styles.codeBox, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.codeText, { color: theme.colors.primary }]}>
            {status?.myCode || 'Laden...'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>📤 Code teilen</Text>
        </TouchableOpacity>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Teile diesen Code mit Freunden. Ihr bekommt beide 100 Credits!
        </Text>
      </View>

      {/* Use Referral Code */}
      {!status?.usedCode && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Code eingeben
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
            Hast du einen Code von einem Freund? Gib ihn hier ein:
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="z.B. RAV-ABC12345"
            placeholderTextColor={theme.colors.textSecondary}
            value={inputCode}
            onChangeText={setInputCode}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting}
          />
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: submitting
                  ? theme.colors.border
                  : theme.colors.success,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Code verwenden</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Already Used Code */}
      {status?.usedCode && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.success }]}>✅ Code verwendet</Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Du hast bereits den Code <Text style={{ fontWeight: 'bold' }}>{status.usedCode}</Text>{' '}
            verwendet und deine Belohnung erhalten!
          </Text>
        </View>
      )}

      {/* Rewards */}
      {status?.rewards && status.rewards.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Belohnungen</Text>
          {status.rewards.map((reward) => (
            <View
              key={reward.id}
              style={[styles.rewardItem, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.rewardText, { color: theme.colors.text }]}>
                {reward.description}
              </Text>
              {reward.amount && (
                <Text style={[styles.rewardAmount, { color: theme.colors.primary }]}>
                  +{reward.amount}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  codeBox: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rewardText: {
    fontSize: 16,
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

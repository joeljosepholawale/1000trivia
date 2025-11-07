/**
 * Edit Profile Screen
 * Modern UI for editing user profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/styles/theme';

interface EditProfileScreenProps {
  currentUsername: string;
  currentBio?: string;
  currentAvatarUrl?: string;
  onSave: (data: { username?: string; bio?: string; avatar_url?: string }) => Promise<void>;
  onCancel: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  currentUsername,
  currentBio,
  currentAvatarUrl,
  onSave,
  onCancel,
}) => {
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState(currentBio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; bio?: string }>({});

  const validateUsername = (value: string): string | undefined => {
    if (value.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.trim().length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return undefined;
  };

  const validateBio = (value: string): string | undefined => {
    if (value.length > 200) {
      return 'Bio must be less than 200 characters';
    }
    return undefined;
  };

  const handleSave = async () => {
    // Validate fields
    const usernameError = validateUsername(username);
    const bioError = validateBio(bio);

    if (usernameError || bioError) {
      setErrors({
        username: usernameError,
        bio: bioError,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const updates: any = {};
      if (username !== currentUsername) updates.username = username.trim();
      if (bio !== currentBio) updates.bio = bio.trim();
      if (avatarUrl !== currentAvatarUrl) updates.avatar_url = avatarUrl.trim();

      await onSave(updates);
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: onCancel },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      username !== currentUsername ||
      bio !== (currentBio || '') ||
      avatarUrl !== (currentAvatarUrl || '')
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, !hasChanges() && styles.disabledButton]}
            disabled={!hasChanges() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text
                style={[
                  styles.saveText,
                  !hasChanges() && styles.disabledText,
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.section}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="person" size={48} color="#fff" />
              </LinearGradient>
              <TouchableOpacity style={styles.changeAvatarButton}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.changeAvatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="camera-alt" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Tap to change avatar</Text>
          </View>

          {/* Username Input */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.username && styles.inputError]}>
              <MaterialIcons
                name="person-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                placeholder="Enter username"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                maxLength={20}
              />
              <Text style={styles.charCount}>{username.length}/20</Text>
            </View>
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
            <Text style={styles.hint}>
              Letters, numbers, and underscores only
            </Text>
          </View>

          {/* Bio Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Bio</Text>
            <View style={[styles.inputContainer, styles.bioContainer, errors.bio && styles.inputError]}>
              <MaterialIcons
                name="info-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={(text) => {
                  setBio(text);
                  setErrors((prev) => ({ ...prev, bio: undefined }));
                }}
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                maxLength={200}
                numberOfLines={4}
              />
            </View>
            <View style={styles.bioFooter}>
              {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
              <Text style={[styles.charCount, styles.bioCharCount]}>
                {bio.length}/200
              </Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info" size={20} color={theme.colors.info} />
            <Text style={styles.infoText}>
              Your username is visible to other players on the leaderboard
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="lock" size={20} color={theme.colors.success} />
            <Text style={styles.infoText}>
              Your email and other personal information remain private
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disabledText: {
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  changeAvatarButton: {
    position: 'absolute',
    right: '35%',
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  changeAvatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  bioContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bioCharCount: {
    marginLeft: 'auto',
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    lineHeight: 18,
  },
});

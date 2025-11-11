import React, {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {Alert, Share, Modal} from 'react-native';
import {RootState, AppDispatch} from '@/store';
import {EnhancedModernProfileScreen} from './EnhancedModernProfileScreen';
import {EditProfileScreen} from './EditProfileScreen';
import {getUserDisplayName} from '@/utils/userHelpers';
import {logout} from '@/store/slices/authSlice';
import {loadUserProfile, loadUserAchievements, updateUserProfile} from '@/store/slices/userSlice';

export const ProfileScreenContainer = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);
  const {balance} = useSelector((state: RootState) => state.wallet);
  const {profile, stats, achievements} = useSelector((state: RootState) => state.user);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      await Promise.all([
        dispatch(loadUserProfile()),
        dispatch(loadUserAchievements()),
      ]);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  // Map profile data with real stats
  const displayName = profile?.username || getUserDisplayName(user) || 'Guest';

  const profileData = {
    id: user?.id || 'guest',
    username: displayName,
    email: user?.email || profile?.email || 'guest@example.com',
    avatar: undefined,
    level: profile?.level || 1,
    currentXP: profile?.currentXP || 0,
    xpToNextLevel: profile?.xpToNextLevel || 1000,
    memberSince: user?.created_at || new Date().toISOString(),
    rank: stats?.currentRank || undefined,
    title: undefined,
  };

  // Use real stats data
  const statsData = {
    gamesPlayed: stats?.gamesPlayed || 0,
    gamesWon: stats?.gamesWon || 0,
    totalScore: stats?.totalScore || 0,
    winRate: stats?.winRate || 0,
    longestStreak: stats?.longestStreak || 0,
    currentStreak: stats?.currentStreak || 0,
    averageScore: stats?.averageScore || 0,
    creditsEarned: stats?.creditsEarned || balance || 0,
  };

  // Map achievements with proper types
  const achievementsData = achievements.map(achievement => ({
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon as any,
    unlocked: achievement.unlocked,
    rarity: achievement.rarity,
    progress: achievement.progress,
    maxProgress: achievement.maxProgress,
  }));

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async (updates: any) => {
    try {
      await dispatch(updateUserProfile(updates)).unwrap();
      setIsEditModalVisible(false);
    } catch (error: any) {
      throw new Error(error || 'Failed to update profile');
    }
  };

  const handleSettings = () => {
    (navigation as any).navigate('Settings');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  const handleAchievementPress = (achievement: any) => {
    Alert.alert(
      achievement.title,
      achievement.description,
      [{text: 'OK'}]
    );
  };

  const handleShareProfile = async () => {
    try {
      const message = `Check out my profile on 1000 Ravier!\n` +
        `Level ${profileData.level} | ${statsData.gamesPlayed} games played`;

      await Share.share({message});
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <>
      <EnhancedModernProfileScreen
        profile={profileData}
        stats={statsData}
        achievements={achievementsData}
        onEditProfile={handleEditProfile}
        onSettings={handleSettings}
        onLogout={handleLogout}
        onAchievementPress={handleAchievementPress}
        onShareProfile={handleShareProfile}
      />

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <EditProfileScreen
          currentUsername={profileData.username}
          currentBio={profile?.bio}
          currentAvatarUrl={profile?.avatar_url}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditModalVisible(false)}
        />
      </Modal>
    </>
  );
};

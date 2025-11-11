import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';

import {colors} from '@/styles/colors';
import {RootState, AppDispatch} from '@/store';
import {logout} from '@/store/slices/authSlice';
import {isEmailVerified} from '@/utils/userHelpers';

export const SettingsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  
  const {user} = useSelector((state: RootState) => state.auth);
  const adsState = useSelector((state: RootState) => state.ads);
  
  // Local settings state
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    musicEnabled: true,
    adsEnabled: adsState?.adsEnabled ?? true,
    autoPlay: false,
    hapticFeedback: true,
  });

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    
    // Show feedback for important settings changes
    if (key === 'adsEnabled') {
      Alert.alert(
        'Ads Settings',
        !settings.adsEnabled 
          ? 'Ads have been enabled. You can now watch ads to earn free credits!'
          : 'Ads have been disabled. You won\'t see ads or earn credits from watching them.',
        [{text: 'OK'}]
      );
    }
  };

  const settingsGroups = [
    {
      title: 'Notifications',
      settings: [
        {
          key: 'notifications' as const,
          title: 'Push Notifications',
          subtitle: 'Get notified about game updates and rewards',
          icon: 'notifications',
        },
      ],
    },
    {
      title: 'Audio & Visual',
      settings: [
        {
          key: 'soundEffects' as const,
          title: 'Sound Effects',
          subtitle: 'Play sound effects during gameplay',
          icon: 'volume-up',
        },
        {
          key: 'musicEnabled' as const,
          title: 'Background Music',
          subtitle: 'Play background music in game',
          icon: 'music-note',
        },
        {
          key: 'hapticFeedback' as const,
          title: 'Haptic Feedback',
          subtitle: 'Vibrate for interactions and feedback',
          icon: 'vibration',
        },
      ],
    },
    {
      title: 'Monetization',
      settings: [
        {
          key: 'adsEnabled' as const,
          title: 'Enable Ads',
          subtitle: 'Watch ads to earn free credits',
          icon: 'video-library',
        },
      ],
    },
    {
      title: 'Gameplay',
      settings: [
        {
          key: 'autoPlay' as const,
          title: 'Auto-Play Next Question',
          subtitle: 'Automatically advance to next question',
          icon: 'play-arrow',
        },
      ],
    },
  ];

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

  const emailVerified = isEmailVerified(user);

  const accountActions = [
    ...(!emailVerified ? [{
      id: 'email-verification',
      title: 'Verify Email',
      subtitle: 'Required for paid games and prizes',
      icon: 'mark-email-unread',
      badge: 'Required',
      onPress: () => {
        (navigation as any).navigate('EmailVerification');
      },
    }] : []),
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'View our privacy policy',
      icon: 'privacy-tip',
      onPress: () => {
        Alert.alert('Privacy Policy', 'Privacy policy would be displayed here.');
      },
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Read our terms and conditions',
      icon: 'gavel',
      onPress: () => {
        Alert.alert('Terms of Service', 'Terms of service would be displayed here.');
      },
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'info',
      onPress: () => {
        Alert.alert(
          'About 1000 Ravier',
          'Version 1.0.0\n\nA fun Q&A competition app with rewards and leaderboards.',
          [{text: 'OK'}]
        );
      },
    },
    {
      id: 'contact',
      title: 'Contact Support',
      subtitle: 'Get help or report issues',
      icon: 'support-agent',
      onPress: () => {
        Alert.alert(
          'Contact Support',
          'Email: support@1000ravier.com\nPhone: +234-XXX-XXX-XXXX',
          [{text: 'OK'}]
        );
      },
    },
  ];

  const renderSettingItem = (setting: typeof settingsGroups[0]['settings'][0]) => (
    <View key={setting.key} style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <MaterialIcons 
            name={setting.icon as any} 
            size={24} 
            color={colors.primary} 
          />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{setting.title}</Text>
          <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
        </View>
      </View>
      
      <Switch
        value={settings[setting.key]}
        onValueChange={() => handleSettingChange(setting.key)}
        trackColor={{false: colors.border, true: colors.primaryLight}}
        thumbColor={settings[setting.key] ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  const renderActionItem = (action: typeof accountActions[0]) => {
    const isEmailVerification = action.id === 'email-verification';
    
    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.actionItem,
          isEmailVerification && styles.emailVerificationItem,
        ]}
        onPress={action.onPress}
      >
        <View style={styles.settingLeft}>
          <View style={[
            styles.settingIcon,
            isEmailVerification && styles.emailVerificationIcon,
          ]}>
            <MaterialIcons 
              name={action.icon as any} 
              size={24} 
              color={isEmailVerification ? colors.error : colors.primary} 
            />
          </View>
          <View style={styles.settingText}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Text style={styles.settingTitle}>{action.title}</Text>
              {isEmailVerification && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>Required</Text>
                </View>
              )}
            </View>
            <Text style={styles.settingSubtitle}>{action.subtitle}</Text>
          </View>
        </View>
        
        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupContainer}>
              {group.settings.map(renderSettingItem)}
            </View>
          </View>
        ))}
        
        {/* Account Actions */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Support & Legal</Text>
          <View style={styles.groupContainer}>
            {accountActions.map(renderActionItem)}
          </View>
        </View>
        
        {/* Logout Button */}
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            1000 Ravier v1.0.0
          </Text>
          <Text style={styles.versionSubtext}>
            Built with ❤️ for the gaming community
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Settings Groups
  settingsGroup: {
    marginTop: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  groupContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Version Info
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Email Verification
  emailVerificationItem: {
    backgroundColor: colors.errorLight || '#FEE2E2',
  },
  emailVerificationIcon: {
    backgroundColor: colors.errorLight || '#FEE2E2',
  },
  requiredBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
});

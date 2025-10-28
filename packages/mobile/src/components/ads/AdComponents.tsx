import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Ionicons} from '@expo/vector-icons';

import {Colors} from '../../styles/colors';
import {RootState, AppDispatch} from '../../store';
import {
  showRewardedAd,
  loadRewardedAd,
  clearErrors,
  updateAdAvailability,
} from '../../store/slices/adsSlice';

// Banner Ad Component - Placeholder (expo-ads-admob removed in SDK 50+)
interface BannerAdProps {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle' | 'fullBanner' | 'leaderboard';
  style?: any;
}

export const BannerAd: React.FC<BannerAdProps> = ({size = 'banner', style}) => {
  return (
    <View style={[styles.bannerContainer, style]}>
      <View style={styles.adPlaceholder}>
        <Text style={styles.adPlaceholderText}>Ad Placeholder</Text>
      </View>
    </View>
  );
};

// Rewarded Video Ad Button Component
interface RewardedAdButtonProps {
  onRewardEarned?: (credits: number) => void;
  buttonText?: string;
  disabled?: boolean;
  style?: any;
  size?: 'small' | 'medium' | 'large';
}

export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  onRewardEarned,
  buttonText = 'Watch Ad for Credits',
  disabled = false,
  style,
  size = 'medium',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    rewardedAdReady,
    loadingRewardedAd,
    rewardedAdError,
    claimingReward,
    lastRewardAmount,
    adsEnabled,
  } = useSelector((state: RootState) => state.ads);

  const [showingAd, setShowingAd] = useState(false);

  useEffect(() => {
    // Update ad availability when component mounts
    dispatch(updateAdAvailability());
    
    // Load ad if not ready
    if (!rewardedAdReady && !loadingRewardedAd) {
      dispatch(loadRewardedAd());
    }
  }, [dispatch, rewardedAdReady, loadingRewardedAd]);

  useEffect(() => {
    // Notify parent when reward is earned
    if (lastRewardAmount > 0 && onRewardEarned) {
      onRewardEarned(lastRewardAmount);
    }
  }, [lastRewardAmount, onRewardEarned]);

  const handleWatchAd = async () => {
    if (!adsEnabled) {
      Alert.alert('Ads Disabled', 'Ads are currently disabled in settings.');
      return;
    }

    if (!rewardedAdReady && !loadingRewardedAd) {
      Alert.alert(
        'Ad Not Ready',
        'The ad is still loading. Please try again in a moment.',
        [
          {
            text: 'Retry',
            onPress: () => dispatch(loadRewardedAd()),
          },
          {text: 'Cancel', style: 'cancel'},
        ]
      );
      return;
    }

    try {
      setShowingAd(true);
      dispatch(clearErrors());
      await dispatch(showRewardedAd()).unwrap();
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      Alert.alert(
        'Ad Error',
        'Failed to show the ad. Please try again later.',
        [
          {
            text: 'Retry',
            onPress: () => dispatch(loadRewardedAd()),
          },
          {text: 'OK', style: 'cancel'},
        ]
      );
    } finally {
      setShowingAd(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 28;
      default:
        return 20;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return styles.smallButtonText;
      case 'large':
        return styles.largeButtonText;
      default:
        return styles.mediumButtonText;
    }
  };

  const isLoading = loadingRewardedAd || showingAd || claimingReward;
  const isDisabled = disabled || !adsEnabled || (!rewardedAdReady && !loadingRewardedAd);

  return (
    <TouchableOpacity
      style={[
        styles.rewardedAdButton,
        getButtonSize(),
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={handleWatchAd}
      disabled={isDisabled || isLoading}
      activeOpacity={0.8}>
      
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <>
          <Ionicons 
            name="play-circle" 
            size={getIconSize()} 
            color={Colors.white} 
            style={styles.adIcon} 
          />
          <Text style={[styles.rewardedAdButtonText, getTextSize()]}>
            {buttonText}
          </Text>
        </>
      )}
      
      {rewardedAdError && (
        <Text style={styles.adErrorText}>Failed to load</Text>
      )}
    </TouchableOpacity>
  );
};

// Ad Reward Card Component
interface AdRewardCardProps {
  onWatchAd: () => void;
  rewardAmount: number;
  adType: 'video' | 'survey' | 'offer';
  title?: string;
  description?: string;
  disabled?: boolean;
}

export const AdRewardCard: React.FC<AdRewardCardProps> = ({
  onWatchAd,
  rewardAmount,
  adType,
  title,
  description,
  disabled = false,
}) => {
  const {rewardedAdReady, loadingRewardedAd} = useSelector(
    (state: RootState) => state.ads
  );

  const getAdIcon = () => {
    switch (adType) {
      case 'video':
        return 'play-circle';
      case 'survey':
        return 'clipboard';
      case 'offer':
        return 'gift';
      default:
        return 'star';
    }
  };

  const getDefaultTitle = () => {
    switch (adType) {
      case 'video':
        return 'Watch Video';
      case 'survey':
        return 'Complete Survey';
      case 'offer':
        return 'Special Offer';
      default:
        return 'Earn Credits';
    }
  };

  return (
    <View style={styles.adRewardCard}>
      <View style={styles.adRewardHeader}>
        <View style={styles.adRewardIcon}>
          <Ionicons name={getAdIcon()} size={32} color={Colors.primary} />
        </View>
        
        <View style={styles.adRewardInfo}>
          <Text style={styles.adRewardTitle}>
            {title || getDefaultTitle()}
          </Text>
          <Text style={styles.adRewardDescription}>
            {description || `Earn ${rewardAmount} credits`}
          </Text>
        </View>

        <View style={styles.adRewardAmount}>
          <Text style={styles.adRewardCredits}>+{rewardAmount}</Text>
          <Text style={styles.adRewardLabel}>credits</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.adRewardButton,
          (disabled || (!rewardedAdReady && !loadingRewardedAd)) && styles.disabledButton,
        ]}
        onPress={onWatchAd}
        disabled={disabled || (!rewardedAdReady && !loadingRewardedAd)}>
        
        {loadingRewardedAd ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Ionicons name="play" size={16} color={Colors.white} />
            <Text style={styles.adRewardButtonText}>
              {adType === 'video' ? 'Watch Now' : 'Start Now'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Banner Ad Styles
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  adPlaceholder: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  adPlaceholderText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  adErrorContainer: {
    padding: 10,
    backgroundColor: Colors.errorLight,
    borderRadius: 4,
  },
  adErrorText: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
  },

  // Rewarded Ad Button Styles
  rewardedAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
  },
  adIcon: {
    marginRight: 8,
  },
  rewardedAdButtonText: {
    color: Colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  smallButtonText: {
    fontSize: 12,
  },
  mediumButtonText: {
    fontSize: 14,
  },
  largeButtonText: {
    fontSize: 16,
  },

  // Ad Reward Card Styles
  adRewardCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adRewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adRewardIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primaryLight,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adRewardInfo: {
    flex: 1,
  },
  adRewardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  adRewardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  adRewardAmount: {
    alignItems: 'center',
  },
  adRewardCredits: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.success,
  },
  adRewardLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  adRewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  adRewardButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    marginLeft: 6,
  },
});

export default {BannerAd, RewardedAdButton, AdRewardCard};
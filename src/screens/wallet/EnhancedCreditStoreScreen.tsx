import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {StackNavigationProp} from '@react-navigation/stack';
import {Ionicons} from '@expo/vector-icons';

import {Colors} from '../../styles/colors';
import {RootState, AppDispatch} from '../../store';
import {loadCreditBundles} from '../../store/slices/walletSlice';
import {
  initializeAds,
  showRewardedAd,
  setAdsEnabled,
} from '../../store/slices/adsSlice';
import {paymentService} from '../../services/payments/stripeService';
import {RewardedAdButton, AdRewardCard, BannerAd} from '../../components/ads/AdComponents';
import type {WalletStackParamList} from '../../navigation/WalletNavigator';
import type {CreditBundle} from '@1000ravier/shared';

type NavigationProp = StackNavigationProp<WalletStackParamList, 'CreditStore'>;

interface Props {
  navigation: NavigationProp;
}

const EnhancedCreditStoreScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {bundles, loadingBundles, error} = useSelector((state: RootState) => state.wallet);
  const {balance} = useSelector((state: RootState) => state.wallet.walletInfo || {});
  const {
    rewardedAdReady,
    adsEnabled,
    adsWatchedToday,
    totalAdRewards,
  } = useSelector((state: RootState) => state.ads);

  const [refreshing, setRefreshing] = useState(false);
  const [purchasingBundle, setPurchasingBundle] = useState<string | null>(null);
  const [showAdOptions, setShowAdOptions] = useState(true);

  useEffect(() => {
    loadData();
    // Initialize ads
    if (adsEnabled) {
      dispatch(initializeAds());
    }
  }, []);

  const loadData = useCallback(async () => {
    await dispatch(loadCreditBundles());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handlePurchaseBundle = async (bundle: CreditBundle) => {
    setPurchasingBundle(bundle.id);

    try {
      Alert.alert(
        'Purchase Credits',
        `Purchase ${bundle.credits.toLocaleString()} credits for $${bundle.price}?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Buy Now',
            onPress: async () => {
              try {
                const result = await paymentService.purchaseCredits(bundle.id);
                
                if (result.success) {
                  Alert.alert(
                    'Purchase Successful!',
                    `You've purchased ${bundle.credits.toLocaleString()} credits. They have been added to your account.`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          // Refresh wallet data
                          loadData();
                          navigation.goBack();
                        },
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    'Purchase Failed',
                    result.error || 'Something went wrong. Please try again.',
                    [{text: 'OK'}]
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Purchase Error',
                  'An unexpected error occurred. Please try again.',
                  [{text: 'OK'}]
                );
              }
            },
          },
        ]
      );
    } finally {
      setPurchasingBundle(null);
    }
  };

  const handleWatchAd = () => {
    dispatch(showRewardedAd());
  };

  const handleAdRewardEarned = (credits: number) => {
    Alert.alert(
      'Reward Earned!',
      `You've earned ${credits} credits by watching an ad!`,
      [{text: 'Great!'}]
    );
    // Refresh wallet balance
    loadData();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>💰 Credit Store</Text>
      <Text style={styles.subtitle}>Purchase credits or earn them for free!</Text>
      
      <View style={styles.balanceCard}>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>{balance?.toLocaleString() || 0} credits</Text>
        </View>
        <Ionicons name="wallet" size={32} color={Colors.primary} />
      </View>
    </View>
  );

  const renderAdOptions = () => {
    if (!showAdOptions) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎬 Earn Free Credits</Text>
          <View style={styles.adToggleContainer}>
            <Text style={styles.adToggleLabel}>Ads</Text>
            <Switch
              value={adsEnabled}
              onValueChange={(value) => dispatch(setAdsEnabled(value))}
              trackColor={{false: Colors.border, true: Colors.primaryLight}}
              thumbColor={adsEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </View>

        {adsEnabled && (
          <>
            <View style={styles.adStatsContainer}>
              <View style={styles.adStat}>
                <Text style={styles.adStatValue}>{adsWatchedToday}</Text>
                <Text style={styles.adStatLabel}>Today</Text>
              </View>
              <View style={styles.adStat}>
                <Text style={styles.adStatValue}>{totalAdRewards}</Text>
                <Text style={styles.adStatLabel}>Total Earned</Text>
              </View>
            </View>

            <AdRewardCard
              onWatchAd={handleWatchAd}
              rewardAmount={50}
              adType="video"
              title="Watch Video Ad"
              description="Earn 50 credits by watching a short video"
            />

            <View style={styles.adButtonContainer}>
              <RewardedAdButton
                onRewardEarned={handleAdRewardEarned}
                buttonText="Watch Another Ad (+25 Credits)"
                size="medium"
                style={styles.adButton}
              />
            </View>
          </>
        )}

        {!adsEnabled && (
          <View style={styles.adsDisabledContainer}>
            <Ionicons name="ban" size={48} color={Colors.textSecondary} />
            <Text style={styles.adsDisabledText}>Ads are disabled</Text>
            <Text style={styles.adsDisabledSubtext}>
              Enable ads to earn free credits by watching videos
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCreditBundles = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>💎 Credit Bundles</Text>
        <TouchableOpacity onPress={() => setShowAdOptions(!showAdOptions)}>
          <Ionicons 
            name={showAdOptions ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={Colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {bundles.map((bundle) => {
        const isPopular = bundle.id === 'bundle_medium';
        const bonus = bundle.credits > bundle.price * 10 ? Math.round((bundle.credits - bundle.price * 10) / 10) : 0;
        
        return (
          <TouchableOpacity
            key={bundle.id}
            style={[styles.bundleCard, isPopular && styles.popularBundle]}
            onPress={() => handlePurchaseBundle(bundle)}
            disabled={purchasingBundle === bundle.id}>
            
            {isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}

            <View style={styles.bundleHeader}>
              <View style={styles.bundleInfo}>
                <Text style={styles.bundleName}>{bundle.name}</Text>
                <Text style={styles.bundleCredits}>
                  {bundle.credits.toLocaleString()} credits
                </Text>
              </View>

              <View style={styles.bundlePricing}>
                <Text style={styles.bundlePrice}>${bundle.price}</Text>
                {bonus > 0 && (
                  <Text style={styles.bundleBonus}>+{bonus}% bonus</Text>
                )}
              </View>
            </View>

            <View style={styles.bundleDetails}>
              <View style={styles.bundleFeature}>
                <Ionicons name="flash" size={16} color={Colors.warning} />
                <Text style={styles.bundleFeatureText}>
                  ${(bundle.price / bundle.credits * 1000).toFixed(2)} per 1000 credits
                </Text>
              </View>
              
              {bundle.description && (
                <Text style={styles.bundleDescription}>{bundle.description}</Text>
              )}
            </View>

            <View style={styles.bundleFooter}>
              {purchasingBundle === bundle.id ? (
                <View style={styles.purchasingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.purchasingText}>Processing...</Text>
                </View>
              ) : (
                <View style={styles.purchaseButton}>
                  <Ionicons name="card" size={16} color={Colors.white} />
                  <Text style={styles.purchaseButtonText}>Purchase</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerTitle}>Why Purchase Credits?</Text>
      
      <View style={styles.benefitsList}>
        <View style={styles.benefit}>
          <Ionicons name="game-controller" size={20} color={Colors.primary} />
          <Text style={styles.benefitText}>Join premium game modes</Text>
        </View>
        <View style={styles.benefit}>
          <Ionicons name="trophy" size={20} color={Colors.warning} />
          <Text style={styles.benefitText}>Compete for bigger prizes</Text>
        </View>
        <View style={styles.benefit}>
          <Ionicons name="flash" size={20} color={Colors.success} />
          <Text style={styles.benefitText}>Unlock special features</Text>
        </View>
        <View style={styles.benefit}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.info} />
          <Text style={styles.benefitText}>Secure & instant delivery</Text>
        </View>
      </View>

      <Text style={styles.footerNote}>
        All purchases are secure and processed through Stripe. Credits are added instantly to your account.
      </Text>

      {/* Banner Ad at bottom */}
      <BannerAd style={styles.bannerAd} />
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load credit bundles</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }>
      
      {renderHeader()}
      {renderAdOptions()}
      {renderCreditBundles()}
      {renderFooter()}
      
      {loadingBundles && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: Colors.white,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  adToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adToggleLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  adStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  adStat: {
    alignItems: 'center',
  },
  adStatValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  adStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  adButtonContainer: {
    marginTop: 12,
  },
  adButton: {
    marginHorizontal: 0,
  },
  adsDisabledContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  adsDisabledText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  adsDisabledSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bundleCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  popularBundle: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bundleCredits: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  bundlePricing: {
    alignItems: 'flex-end',
  },
  bundlePrice: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  bundleBonus: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.success,
  },
  bundleDetails: {
    marginBottom: 16,
  },
  bundleFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bundleFeatureText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  bundleDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bundleFooter: {
    alignItems: 'center',
  },
  purchasingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  purchasingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginLeft: 8,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    marginLeft: 8,
  },
  footer: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  footerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginLeft: 12,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  bannerAd: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EnhancedCreditStoreScreen;
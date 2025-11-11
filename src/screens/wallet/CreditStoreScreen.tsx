import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';

import {RootState, AppDispatch} from '@/store';
import {loadCreditBundles} from '@/store/slices/walletSlice';
import {WalletStackParamList} from '@/navigation/WalletNavigator';
import {colors} from '@/styles/colors';
import {LoadingScreen} from '@/components/LoadingScreen';
import type {CreditsBundle} from '@/services/api/wallet';

type NavigationProp = NativeStackNavigationProp<WalletStackParamList, 'CreditStore'>;

export const CreditStoreScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  
  const {creditBundles, balance, isLoading} = useSelector((state: RootState) => state.wallet);
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      await dispatch(loadCreditBundles());
    } catch (error) {
    }
  };

  const handlePurchase = async (bundle: CreditsBundle) => {
    if (purchasing) return;

    Alert.alert(
      'Purchase Confirmation',
      `Purchase ${bundle.credits}${bundle.bonusCredits ? ` + ${bundle.bonusCredits} bonus` : ''} credits for ₦${bundle.priceNgn.toLocaleString()}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Purchase',
          onPress: async () => {
            setPurchasing(true);
            setSelectedBundle(bundle.id);
            
            try {
              // In a real app, integrate with Stripe payment processing here
              // For now, simulate successful purchase
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              Alert.alert(
                'Purchase Successful! 🎉',
                `${bundle.credits}${bundle.bonusCredits ? ` + ${bundle.bonusCredits} bonus` : ''} credits have been added to your wallet!`,
                [
                  {
                    text: 'Great!',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                'Purchase Failed',
                error || 'Something went wrong. Please try again.'
              );
            } finally {
              setPurchasing(false);
              setSelectedBundle(null);
            }
          },
        },
      ]
    );
  };

  const renderBundleCard = (bundle: CreditsBundle) => {
    const isSelected = selectedBundle === bundle.id;
    const isPurchasing = purchasing && isSelected;
    
    const totalCredits = bundle.credits + (bundle.bonusCredits || 0);
    const pricePerCredit = bundle.priceNgn / bundle.credits;
    
    return (
      <TouchableOpacity
        key={bundle.id}
        style={[
          styles.bundleCard,
          bundle.popular && styles.popularCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => !isPurchasing && handlePurchase(bundle)}
        disabled={isPurchasing}
      >
        {bundle.popular && (
          <View style={styles.popularBadge}>
            <MaterialIcons name="star" size={16} color={colors.textWhite} />
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.bundleContent}>
          <View style={styles.creditsInfo}>
            <Text style={styles.creditsAmount}>{bundle.credits.toLocaleString()}</Text>
            <Text style={styles.creditsLabel}>Credits</Text>
            
            {bundle.bonusCredits && (
              <View style={styles.bonusContainer}>
                <MaterialIcons name="add" size={16} color={colors.success} />
                <Text style={styles.bonusText}>{bundle.bonusCredits} Bonus</Text>
              </View>
            )}
          </View>
          
          <View style={styles.priceInfo}>
            <Text style={styles.price}>₦{bundle.priceNgn.toLocaleString()}</Text>
            <Text style={styles.pricePerCredit}>
              ₦{pricePerCredit.toFixed(2)} per credit
            </Text>
            
            {bundle.savings && (
              <View style={styles.savingsContainer}>
                <MaterialIcons name="savings" size={14} color={colors.success} />
                <Text style={styles.savingsText}>Save {bundle.savings}%</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.bundleFooter}>
          {totalCredits !== bundle.credits && (
            <Text style={styles.totalCreditsText}>
              Total: {totalCredits.toLocaleString()} Credits
            </Text>
          )}
          
          <View style={styles.purchaseButton}>
            {isPurchasing ? (
              <Text style={styles.purchaseButtonText}>Processing...</Text>
            ) : (
              <>
                <MaterialIcons name="shopping-cart" size={16} color={colors.textWhite} />
                <Text style={styles.purchaseButtonText}>Purchase</Text>
              </>
            )}
          </View>
        </View>

        {isPurchasing && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Processing purchase...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <Text style={styles.title}>Buy Credits</Text>
      
      <View style={styles.balanceContainer}>
        <MaterialIcons name="account-balance-wallet" size={16} color={colors.primary} />
        <Text style={styles.balanceText}>{balance.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderInfoSection = () => (
    <View style={styles.infoSection}>
      <Text style={styles.infoTitle}>Why Buy Credits?</Text>
      <View style={styles.infoItems}>
        <View style={styles.infoItem}>
          <MaterialIcons name="sports-esports" size={20} color={colors.primary} />
          <Text style={styles.infoText}>Play premium game modes</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="emoji-events" size={20} color={colors.secondary} />
          <Text style={styles.infoText}>Compete for bigger prizes</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="flash-on" size={20} color={colors.accent} />
          <Text style={styles.infoText}>Get instant access to games</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading && creditBundles.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderInfoSection()}
        
        <View style={styles.bundlesContainer}>
          <Text style={styles.sectionTitle}>Choose Your Bundle</Text>
          
          {creditBundles.map(renderBundleCard)}
          
          {creditBundles.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="shopping-cart" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>No bundles available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.securityInfo}>
          <MaterialIcons name="security" size={20} color={colors.success} />
          <Text style={styles.securityText}>
            Secure payment powered by Stripe. Your payment information is encrypted and protected.
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
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  balanceText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoItems: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  bundlesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  bundleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularCard: {
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 0.2,
    elevation: 6,
  },
  selectedCard: {
    borderColor: colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 12,
    color: colors.textWhite,
    fontWeight: '600',
  },
  bundleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  creditsInfo: {
    flex: 1,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  creditsLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  bonusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  pricePerCredit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  savingsText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '600',
  },
  bundleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCreditsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  purchaseButtonText: {
    fontSize: 14,
    color: colors.textWhite,
    fontWeight: '600',
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
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.successLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: colors.success,
    lineHeight: 16,
  },
});
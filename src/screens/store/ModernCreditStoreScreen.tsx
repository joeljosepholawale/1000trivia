import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';

const { width } = Dimensions.get('window');

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  bonus?: number;
  popular?: boolean;
  bestValue?: boolean;
  icon: string;
}

interface ModernCreditStoreScreenProps {
  packages: CreditPackage[];
  currentBalance: number;
  onPurchase: (packageId: string) => void;
  onClose: () => void;
}

export const ModernCreditStoreScreen: React.FC<ModernCreditStoreScreenProps> = ({
  packages,
  currentBalance,
  onPurchase,
  onClose,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePurchase = (packageId: string) => {
    setSelectedPackage(packageId);
    // Add haptic feedback here if needed
    setTimeout(() => {
      onPurchase(packageId);
      setSelectedPackage(null);
    }, 200);
  };

  const renderPackageCard = (pkg: CreditPackage, index: number) => {
    const isSelected = selectedPackage === pkg.id;
    const cardWidth = (width - theme.spacing[6] * 3) / 2;
    
    const animatedOpacity = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const animatedTranslateY = slideAnim.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 50],
    });

    return (
      <Animated.View
        key={pkg.id}
        style={[
          styles.packageCardWrapper,
          {
            width: cardWidth,
            opacity: animatedOpacity,
            transform: [{ translateY: animatedTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handlePurchase(pkg.id)}
          activeOpacity={0.9}
          disabled={isSelected}
        >
          <Card
            variant={pkg.popular || pkg.bestValue ? 'elevated' : 'outlined'}
            padding={0}
            style={[
              styles.packageCard,
              isSelected && styles.packageCardSelected,
            ]}
          >
            {/* Badge for popular/best value */}
            {(pkg.popular || pkg.bestValue) && (
              <View style={styles.packageBadgeContainer}>
                {pkg.bestValue && (
                  <Badge variant="success" size="sm">
                    <MaterialIcons name="star" size={12} color={theme.colors.white} />
                    <Text style={styles.badgeText}> Bestes Angebot</Text>
                  </Badge>
                )}
                {pkg.popular && !pkg.bestValue && (
                  <Badge variant="info" size="sm">
                    <MaterialIcons name="trending-up" size={12} color={theme.colors.white} />
                    <Text style={styles.badgeText}> Beliebt</Text>
                  </Badge>
                )}
              </View>
            )}

            {/* Package Icon */}
            <LinearGradient
              colors={
                pkg.bestValue
                  ? [theme.colors.secondary[400], theme.colors.secondary[600]]
                  : pkg.popular
                  ? [theme.colors.primary[400], theme.colors.primary[600]]
                  : [theme.colors.gray[300], theme.colors.gray[500]]
              }
              style={styles.packageIconContainer}
            >
              <MaterialIcons name={pkg.icon as any} size={40} color={theme.colors.white} />
            </LinearGradient>

            {/* Package Content */}
            <View style={styles.packageContent}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              
              <View style={styles.creditsRow}>
                <MaterialIcons name="monetization-on" size={20} color={theme.colors.secondary[500]} />
                <Text style={styles.creditsAmount}>{pkg.credits.toLocaleString()}</Text>
              </View>

              {pkg.bonus && pkg.bonus > 0 && (
                <View style={styles.bonusContainer}>
                  <Badge variant="warning" size="sm">
                    +{pkg.bonus}% Bonus
                  </Badge>
                </View>
              )}

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  {pkg.price.toFixed(2)} {pkg.currency}
                </Text>
              </View>

              {/* Purchase Button */}
              <TouchableOpacity
                style={[styles.purchaseButton, isSelected && styles.purchaseButtonSelected]}
                onPress={() => handlePurchase(pkg.id)}
                activeOpacity={0.8}
                disabled={isSelected}
              >
                <LinearGradient
                  colors={
                    pkg.bestValue || pkg.popular
                      ? [theme.colors.primary[500], theme.colors.primary[700]]
                      : [theme.colors.gray[400], theme.colors.gray[600]]
                  }
                  style={styles.purchaseButtonGradient}
                >
                  <Text style={styles.purchaseButtonText}>
                    {isSelected ? 'Verarbeitung...' : 'Kaufen'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderBalanceHeader = () => (
    <Animated.View
      style={[
        styles.balanceHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card
        gradient
        gradientColors={[theme.colors.primary[400], theme.colors.primary[600]]}
        padding={5}
      >
        <View style={styles.balanceContent}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Aktuelles Guthaben</Text>
            <View style={styles.balanceValueContainer}>
              <MaterialIcons name="account-balance-wallet" size={24} color={theme.colors.white} />
              <AnimatedNumber value={currentBalance} duration={800} style={styles.balanceValue} />
              <Text style={styles.balanceCurrency}>Credits</Text>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderFeatures = () => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionTitle}>Warum Credits kaufen?</Text>
      
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: theme.colors.success[100] }]}>
            <MaterialIcons name="verified" size={24} color={theme.colors.success[500]} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Sichere Zahlung</Text>
            <Text style={styles.featureDescription}>Verschlüsselte Transaktionen</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: theme.colors.info[100] }]}>
            <MaterialIcons name="flash-on" size={24} color={theme.colors.info[500]} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Sofort verfügbar</Text>
            <Text style={styles.featureDescription}>Credits direkt nach Kauf</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: theme.colors.secondary[100] }]}>
            <MaterialIcons name="card-giftcard" size={24} color={theme.colors.secondary[500]} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Bonus-Credits</Text>
            <Text style={styles.featureDescription}>Extra Credits bei größeren Paketen</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Store</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderBalanceHeader()}

        {/* Packages Grid */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Wähle dein Paket</Text>
          <View style={styles.packagesGrid}>
            {packages.map((pkg, index) => renderPackageCard(pkg, index))}
          </View>
        </View>

        {renderFeatures()}

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Zahlungsmethoden</Text>
          <Card variant="outlined" padding={4}>
            <View style={styles.paymentMethods}>
              <MaterialIcons name="credit-card" size={32} color={theme.colors.gray[600]} />
              <MaterialIcons name="account-balance" size={32} color={theme.colors.gray[600]} />
              <MaterialIcons name="phone-android" size={32} color={theme.colors.gray[600]} />
            </View>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Beim Kauf stimmst du unseren{' '}
            <Text style={styles.footerLink}>AGB</Text> zu
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  closeButton: {
    padding: theme.spacing[2],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
  },
  balanceHeader: {
    marginBottom: theme.spacing[6],
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceInfo: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing[2],
  },
  balanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  balanceValue: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
  },
  balanceCurrency: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing[2],
  },
  packagesSection: {
    marginBottom: theme.spacing[8],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  packageCardWrapper: {
    marginBottom: theme.spacing[3],
  },
  packageCard: {
    position: 'relative',
    overflow: 'visible',
  },
  packageCardSelected: {
    opacity: 0.6,
  },
  packageBadgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  packageIconContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  packageContent: {
    padding: theme.spacing[4],
  },
  packageName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
    marginBottom: theme.spacing[2],
  },
  creditsAmount: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.secondary[500],
  },
  bonusContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  price: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  purchaseButton: {
    marginTop: theme.spacing[2],
  },
  purchaseButtonSelected: {
    opacity: 0.7,
  },
  purchaseButtonGradient: {
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  featuresSection: {
    marginBottom: theme.spacing[8],
  },
  featuresList: {
    gap: theme.spacing[4],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  paymentSection: {
    marginBottom: theme.spacing[8],
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[6],
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  footerLink: {
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

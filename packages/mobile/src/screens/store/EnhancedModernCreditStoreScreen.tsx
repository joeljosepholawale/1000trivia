import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Pressable,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  bonus?: number;
  popular?: boolean;
  bestValue?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  savings?: string;
}

interface ModernCreditStoreScreenProps {
  packages: CreditPackage[];
  currentBalance: number;
  onPurchase: (packageId: string) => void;
  onClose?: () => void;
}

export const EnhancedModernCreditStoreScreen: React.FC<ModernCreditStoreScreenProps> = ({
  packages = [],
  currentBalance,
  onPurchase,
  onClose,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(currentBalance)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Animate balance changes
  useEffect(() => {
    Animated.timing(balanceAnim, {
      toValue: currentBalance,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentBalance]);

  const handlePurchase = useCallback((packageId: string) => {
    setSelectedPackage(packageId);
    setTimeout(() => {
      onPurchase(packageId);
      setSelectedPackage(null);
    }, 300);
  }, [onPurchase]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const renderBalanceCard = () => (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <View style={styles.balanceCard}>
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceGradient}
        >
          {/* Background pattern */}
          <View style={styles.balancePattern}>
            {[...Array(15)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.patternDot,
                  {
                    left: `${(i % 5) * 25}%`,
                    top: `${Math.floor(i / 5) * 33}%`,
                  },
                ]}
              />
            ))}
          </View>

          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: 150, height: '100%' }}
            />
          </Animated.View>

          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <View style={styles.balanceRow}>
              <MaterialIcons name="monetization-on" size={32} color="#FFF" />
              <Animated.Text style={styles.balanceValue}>
                {balanceAnim.interpolate({
                  inputRange: [0, currentBalance],
                  outputRange: ['0', currentBalance.toLocaleString()],
                })}
              </Animated.Text>
              <Text style={styles.balanceUnit}>Credits</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const renderPackageCard = (pkg: CreditPackage, index: number) => {
    const isSelected = selectedPackage === pkg.id;
    const cardWidth = (SCREEN_WIDTH - 52) / 2;

    return (
      <Animated.View
        key={pkg.id}
        style={[
          styles.packageCardWrapper,
          { width: cardWidth },
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 50 + index * 10],
                }),
              },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Pressable
          onPress={() => handlePurchase(pkg.id)}
          disabled={isSelected}
          style={({ pressed }) => [
            styles.packageCard,
            pkg.bestValue && styles.packageCardBest,
            isSelected && styles.packageCardSelected,
            { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          {/* Best Value Glow */}
          {pkg.bestValue && (
            <View style={styles.glowContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glow}
              />
            </View>
          )}

          {/* Badge */}
          {(pkg.popular || pkg.bestValue) && (
            <View style={styles.badgeContainer}>
              <LinearGradient
                colors={pkg.bestValue ? ['#FFD700', '#FFA500'] : ['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badge}
              >
                <MaterialIcons
                  name={pkg.bestValue ? 'star' : 'trending-up'}
                  size={10}
                  color="#FFF"
                />
                <Text style={styles.badgeText}>
                  {pkg.bestValue ? 'BEST' : 'POPULAR'}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={pkg.bestValue ? ['#FFD700', '#FFA500'] : ['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <MaterialIcons name={pkg.icon} size={36} color="#FFF" />
            </LinearGradient>
          </View>

          {/* Content */}
          <Text style={styles.packageName}>{pkg.name}</Text>

          <View style={styles.creditsRow}>
            <MaterialIcons name="monetization-on" size={18} color="#F59E0B" />
            <Text style={styles.creditsAmount}>{pkg.credits.toLocaleString()}</Text>
          </View>

          {pkg.bonus && pkg.bonus > 0 && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>+{pkg.bonus}% BONUS</Text>
            </View>
          )}

          {pkg.savings && (
            <Text style={styles.savings}>Save {pkg.savings}</Text>
          )}

          {/* Price */}
          <Text style={styles.price}>
            {pkg.currency}{pkg.price.toFixed(2)}
          </Text>

          {/* Purchase Button */}
          <LinearGradient
            colors={pkg.bestValue || pkg.popular ? ['#3B82F6', '#8B5CF6'] : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.purchaseButton}
          >
            <Text style={styles.purchaseButtonText}>
              {isSelected ? 'Processing...' : 'Buy Now'}
            </Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  const renderFeatures = () => (
    <View style={styles.featuresSection}>
      {[
        { icon: 'security', title: 'Secure Payment', subtitle: 'Protected by encryption' },
        { icon: 'verified', title: 'Instant Delivery', subtitle: 'Credits added immediately' },
        { icon: 'support', title: '24/7 Support', subtitle: 'We\'re here to help' },
      ].map((feature, index) => (
        <Animated.View
          key={feature.title}
          style={[
            styles.featureItem,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.featureIcon}>
            <MaterialIcons name={feature.icon as any} size={20} color="#3B82F6" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Credit Store</Text>
        {onClose && (
          <Pressable style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#1F2937" />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderBalanceCard()}

        <Text style={styles.sectionTitle}>Choose Your Package</Text>

        <View style={styles.packagesGrid}>
          {packages.map((pkg, index) => renderPackageCard(pkg, index))}
        </View>

        {renderFeatures()}

        <View style={styles.disclaimer}>
          <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
          <Text style={styles.disclaimerText}>
            All purchases are final. Credits are non-refundable.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  balanceCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  balanceGradient: {
    position: 'relative',
    padding: 24,
  },
  balancePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  patternDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  balanceContent: {
    position: 'relative',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  packageCardWrapper: {
    marginBottom: 12,
  },
  packageCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  packageCardBest: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  packageCardSelected: {
    opacity: 0.7,
  },
  glowContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    overflow: 'hidden',
  },
  glow: {
    flex: 1,
    opacity: 0.2,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  iconContainer: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  creditsAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  bonusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  savings: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 16,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    gap: 6,
  },
  purchaseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

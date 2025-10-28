import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { Achievement } from '@/types/achievements';
import { haptics, animations } from '@/utils/animations';

const { width, height } = Dimensions.get('window');

interface AchievementNotificationProps {
  achievement: Achievement;
  visible: boolean;
  onClose: () => void;
  showConfetti?: boolean;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  visible,
  onClose,
  showConfetti = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      haptics.success();
      
      // Show notification
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti animation
      if (showConfetti) {
        animateConfetti();
      }

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      resetConfetti();
    }
  }, [visible]);

  const animateConfetti = () => {
    const animations = confettiAnims.map((anim, index) => {
      const randomX = (Math.random() - 0.5) * width;
      const randomRotate = Math.random() * 720;

      return Animated.parallel([
        Animated.timing(anim.x, {
          toValue: randomX,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: height,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: randomRotate,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(50, animations).start();
  };

  const resetConfetti = () => {
    confettiAnims.forEach((anim) => {
      anim.x.setValue(0);
      anim.y.setValue(0);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);
    });
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getRarityColor = (): [string, string] => {
    switch (achievement.rarity) {
      case 'legendary':
        return [theme.colors.secondary[400], theme.colors.secondary[600]];
      case 'epic':
        return [theme.colors.primary[400], theme.colors.primary[600]];
      case 'rare':
        return [theme.colors.info[400], theme.colors.info[600]];
      case 'common':
      default:
        return [theme.colors.success[400], theme.colors.success[600]];
    }
  };

  const getRarityLabel = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return 'Legendär';
      case 'epic':
        return 'Episch';
      case 'rare':
        return 'Selten';
      case 'common':
      default:
        return 'Gewöhnlich';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {showConfetti && visible && (
          <View style={styles.confettiContainer}>
            {confettiAnims.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.confetti,
                  {
                    backgroundColor: [
                      theme.colors.primary[500],
                      theme.colors.secondary[500],
                      theme.colors.success[500],
                      theme.colors.warning[500],
                      theme.colors.info[500],
                    ][index % 5],
                    transform: [
                      { translateX: anim.x },
                      { translateY: anim.y },
                      {
                        rotate: anim.rotate.interpolate({
                          inputRange: [0, 720],
                          outputRange: ['0deg', '720deg'],
                        }),
                      },
                    ],
                    opacity: anim.opacity,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Notification Card */}
        <Animated.View
          style={[
            styles.notificationContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={getRarityColor()}
            style={styles.notification}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>

            {/* Achievement Unlocked */}
            <View style={styles.header}>
              <MaterialIcons name="stars" size={32} color={theme.colors.white} />
              <Text style={styles.headerText}>Erfolg freigeschaltet!</Text>
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialIcons
                  name={achievement.icon as any}
                  size={64}
                  color={theme.colors.white}
                />
              </View>
              
              {/* Rarity Badge */}
              <View style={styles.rarityBadge}>
                <Text style={styles.rarityText}>{getRarityLabel()}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={styles.title}>{achievement.title}</Text>
              <Text style={styles.description}>{achievement.description}</Text>
            </View>

            {/* Rewards */}
            <View style={styles.rewards}>
              {achievement.rewards.credits && (
                <View style={styles.reward}>
                  <MaterialIcons name="monetization-on" size={20} color={theme.colors.white} />
                  <Text style={styles.rewardText}>+{achievement.rewards.credits}</Text>
                </View>
              )}
              {achievement.rewards.xp && (
                <View style={styles.reward}>
                  <MaterialIcons name="stars" size={20} color={theme.colors.white} />
                  <Text style={styles.rewardText}>+{achievement.rewards.xp} XP</Text>
                </View>
              )}
              {achievement.rewards.title && (
                <View style={styles.reward}>
                  <MaterialIcons name="military-tech" size={20} color={theme.colors.white} />
                  <Text style={styles.rewardText}>{achievement.rewards.title}</Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
              <Text style={styles.actionButtonText}>Großartig!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  notificationContainer: {
    width: '100%',
    maxWidth: 400,
  },
  notification: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing[4],
    right: theme.spacing[4],
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  headerText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginTop: theme.spacing[2],
  },
  iconContainer: {
    position: 'relative',
    marginBottom: theme.spacing[6],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  rarityBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  rarityText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
  },
  details: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[6],
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
  },
  rewardText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  actionButton: {
    width: '100%',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[500],
  },
});

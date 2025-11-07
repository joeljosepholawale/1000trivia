import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {colors} from '@/styles/colors';
import {RootState, AppDispatch} from '@/store';
import {authAPI} from '@/services/api/auth';
import {updateUser} from '@/store/slices/authSlice';

export const EmailVerificationScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);
  
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendVerificationEmail = async () => {
    try {
      setIsSending(true);
      const response = await authAPI.sendVerificationEmail();
      
      if (response.success) {
        setEmailSent(true);
        
        // Check if response contains dev mode code
        const message = (response as any).message || '';
        const devCodeMatch = message.match(/Verification code \(DEV MODE\): (\d{6})/);
        
        if (devCodeMatch) {
          // Development mode - show OTP code
          Alert.alert(
            '🔧 Dev Mode - Verification Code',
            `Your verification code is:\n\n${devCodeMatch[1]}\n\nThis is shown because email is not configured. In production, this will be sent via email.`,
            [{text: 'OK'}]
          );
        } else {
          // Production mode - normal message
          Alert.alert(
            'Email Sent',
            'Verification email has been sent. Please check your inbox and click the verification link.',
            [{text: 'OK'}]
          );
        }
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsVerifying(true);
      const response = await authAPI.verifyEmailToken(otpCode);
      
      if (response.success) {
        Alert.alert(
          'Success!',
          'Your email has been verified successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Update user in Redux
                if (response.data?.user) {
                  dispatch(updateUser(response.data.user));
                }
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error?.message || 'Invalid verification code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Email Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={emailSent ? "mark-email-read" : "email"}
            size={80}
            color={emailSent ? colors.success : colors.primary}
          />
        </View>

        <Text style={styles.heading}>
          {emailSent ? 'Check Your Email' : 'Verify Your Email'}
        </Text>
        
        <Text style={styles.description}>
          {emailSent
            ? `We've sent a verification link to ${user?.email}. Click the link to verify your email address.`
            : 'Verifying your email allows you to participate in paid game modes and claim prizes.'}
        </Text>

        <View style={styles.emailBox}>
          <MaterialIcons name="email" size={20} color={colors.textSecondary} />
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {emailSent ? (
          <>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Enter Verification Code:</Text>
              <TextInput
                style={styles.otpInput}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, (isVerifying || otpCode.length !== 6) && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isVerifying || otpCode.length !== 6}
            >
              {isVerifying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color={colors.white} />
                  <Text style={styles.buttonText}>Verify Code</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isSending && styles.buttonDisabled]}
          onPress={handleSendVerificationEmail}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color={colors.white} />
              <Text style={styles.buttonText}>
                {emailSent ? 'Resend Verification Email' : 'Send Verification Email'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {emailSent && (
          <Text style={styles.resendText}>
            Didn't receive the email? Check your spam folder or click resend above.
          </Text>
        )}

        <TouchableOpacity style={styles.laterButton} onPress={handleGoBack}>
          <Text style={styles.laterText}>I'll Do This Later</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  emailText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  instructionsBox: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 8,
    width: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  laterButton: {
    marginTop: 24,
    padding: 12,
  },
  laterText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  otpInput: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: 8,
    marginTop: 12,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    marginTop: 16,
  },
});

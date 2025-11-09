import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {colors} from '@/styles/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isPassword?: boolean;
  onIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  isPassword,
  onIconPress,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(isPassword);

  const handleSecureToggle = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {icon && (
          <TouchableOpacity
            onPress={onIconPress}
            disabled={!onIconPress}
            style={styles.iconContainer}
          >
            <MaterialIcons
              name={icon}
              size={22}
              color={isFocused ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={handleSecureToggle}
            style={styles.iconContainer}
          >
            <MaterialIcons
              name={isSecure ? 'visibility-off' : 'visibility'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
});

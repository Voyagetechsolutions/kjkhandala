import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import COLORS from '../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`button_${size}`],
    };

    if (disabled || loading) {
      return { ...baseStyle, ...styles.button_disabled };
    }

    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.button_secondary };
      case 'outline':
        return { ...baseStyle, ...styles.button_outline };
      case 'danger':
        return { ...baseStyle, ...styles.button_danger };
      default:
        return { ...baseStyle, ...styles.button_primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.text,
      ...styles[`text_${size}`],
    };

    if (disabled || loading) {
      return { ...baseStyle, ...styles.text_disabled };
    }

    switch (variant) {
      case 'outline':
        return { ...baseStyle, ...styles.text_outline };
      default:
        return { ...baseStyle, ...styles.text_primary };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  button_primary: {
    backgroundColor: COLORS.primary,
  },
  button_secondary: {
    backgroundColor: COLORS.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  button_danger: {
    backgroundColor: COLORS.secondary,
  },
  button_disabled: {
    backgroundColor: COLORS.gray400,
  },
  text: {
    fontWeight: '600',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  text_primary: {
    color: COLORS.white,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_disabled: {
    color: COLORS.gray300,
  },
});

export default Button;

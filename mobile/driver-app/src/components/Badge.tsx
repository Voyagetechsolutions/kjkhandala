import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../lib/constants';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  label,
  variant = 'default',
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Variants
  success: {
    backgroundColor: `${COLORS.success}20`,
  },
  successText: {
    color: COLORS.success,
  },
  warning: {
    backgroundColor: `${COLORS.warning}20`,
  },
  warningText: {
    color: '#D97706',
  },
  danger: {
    backgroundColor: `${COLORS.danger}20`,
  },
  dangerText: {
    color: COLORS.danger,
  },
  info: {
    backgroundColor: `${COLORS.info}20`,
  },
  infoText: {
    color: COLORS.info,
  },
  default: {
    backgroundColor: COLORS.gray[200],
  },
  defaultText: {
    color: COLORS.gray[700],
  },
});

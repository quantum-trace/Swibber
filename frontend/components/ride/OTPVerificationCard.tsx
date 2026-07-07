import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface OTPVerificationCardProps {
  otp: string;
  colors: { card: string; text: string; textSub: string; textMuted: string };
}

export const OTPVerificationCard = React.memo(function OTPVerificationCard({
  otp,
  colors,
}: OTPVerificationCardProps) {
  return (
    <View style={[styles.container, { backgroundColor: `${Colors.primary}12` }]}>
      <MaterialIcons name="lock" size={18} color={Colors.primary} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={[Typography.caption, { color: Colors.primary }]}>
          Share this OTP with your driver to start the ride
        </Text>
        <View style={styles.otpRow}>
          {otp.split('').map((digit, i) => (
            <View key={i} style={[styles.digitBox, { backgroundColor: colors.card }]}>
              <Text style={[Typography.h3, { color: Colors.primary }]}>{digit}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.base, borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  otpRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  digitBox: {
    width: 42, height: 48, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
});

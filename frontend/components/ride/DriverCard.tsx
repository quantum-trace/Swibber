import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';
import StarRating from '../common/StarRating';

interface DriverCardProps {
  name: string;
  vehicleNumber: string;
  vehicleModel: string;
  rating: number;
  eta?: number;
  phoneNumber?: string;
  onCall?: () => void;
  onChat?: () => void;
  onSOS?: () => void;
  onShare?: () => void;
}

export default function DriverCard({
  name, vehicleNumber, vehicleModel, rating, eta, phoneNumber,
  onCall, onChat, onSOS, onShare,
}: DriverCardProps) {
  const { colors } = useTheme();

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Driver info */}
      <View style={styles.driverRow}>
        <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[Typography.h4, { color: colors.text }]}>{name}</Text>
          <StarRating rating={rating} size={14} readonly />
          <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {vehicleModel} • {vehicleNumber}
          </Text>
        </View>
        {eta !== undefined && (
          <View style={styles.etaBadge}>
            <Text style={[Typography.captionBold, { color: Colors.primary }]}>{eta} min</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <ActionButton 
          icon="call" 
          label={phoneNumber || "Call"} 
          onPress={onCall ?? (() => {})} 
          color={Colors.success} 
        />
        <ActionButton icon="chat-bubble-outline" label="Chat" onPress={onChat ?? (() => {})} color={Colors.primary} />
        <ActionButton icon="share" label="Share" onPress={onShare ?? (() => {})} color={Colors.accent} />
        <ActionButton icon="sos" label="SOS" onPress={onSOS ?? (() => {})} color={Colors.error} />
      </View>
    </View>
  );
}

function ActionButton({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[Typography.captionBold, { color: colors.textSub, marginTop: 4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.xl, padding: Spacing.base },
  driverRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.h4, color: Colors.white },
  etaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: `${Colors.primary}15` },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  actionBtn: { alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});

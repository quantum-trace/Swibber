import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import Header from '../../components/common/Header';

function ToggleRow({ label, desc, value, onChange, icon, iconColor }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
  icon: string; iconColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => onChange(!value)} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor ?? Colors.primary}15` }]}>
        <MaterialIcons name={icon as any} size={20} color={iconColor ?? Colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[Typography.label, { color: colors.text }]}>{label}</Text>
        {desc && <Text style={[Typography.caption, { color: colors.textSub }]}>{desc}</Text>}
      </View>
      <View style={[styles.toggle, { backgroundColor: value ? Colors.primary : colors.border }]}>
        <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 16 : 2 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

function ThemeSelector() {
  const { colors, mode, setMode } = useTheme();
  const opts = [
    { key: 'light', label: 'Light', icon: 'light-mode' },
    { key: 'dark', label: 'Dark', icon: 'dark-mode' },
    { key: 'system', label: 'System', icon: 'phone-android' },
  ];
  return (
    <View style={styles.themeRow}>
      {opts.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => setMode(o.key as any)}
          style={[styles.themeBtn, { backgroundColor: mode === o.key ? Colors.primary : colors.card, borderColor: mode === o.key ? Colors.primary : colors.border }]}
        >
          <MaterialIcons name={o.icon as any} size={18} color={mode === o.key ? Colors.white : colors.textSub} />
          <Text style={[Typography.captionBold, { color: mode === o.key ? Colors.white : colors.textSub, marginTop: 4 }]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [notifRide, setNotifRide] = useState(true);
  const [notifPromo, setNotifPromo] = useState(true);
  const [notifFood, setNotifFood] = useState(true);
  const [locationBg, setLocationBg] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Appearance */}
        <Text style={styles.sectionTitle(colors)}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[Typography.label, { color: colors.text, padding: Spacing.base, paddingBottom: 8 }]}>Theme</Text>
          <View style={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing.base }}>
            <ThemeSelector />
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle(colors)}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ToggleRow label="Ride updates" desc="Driver location, arrival alerts" value={notifRide} onChange={setNotifRide} icon="local-taxi" />
          <ToggleRow label="Food orders" desc="Order status, delivery alerts" value={notifFood} onChange={setNotifFood} icon="restaurant" />
          <ToggleRow label="Promotions & offers" desc="Deals, discounts, cashback" value={notifPromo} onChange={setNotifPromo} icon="local-offer" iconColor={Colors.warning} />
        </View>

        {/* Privacy */}
        <Text style={styles.sectionTitle(colors)}>PRIVACY & DATA</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ToggleRow label="Background location" desc="For better ride tracking" value={locationBg} onChange={setLocationBg} icon="gps-fixed" iconColor={Colors.accent} />
          <ToggleRow label="Usage analytics" desc="Help improve the app" value={analytics} onChange={setAnalytics} icon="analytics" />
        </View>

        {/* App info */}
        <Text style={styles.sectionTitle(colors)}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {[
            { label: 'App version', value: 'v1.0.0' },
            { label: 'Terms of service', value: '' },
            { label: 'Privacy policy', value: '' },
            { label: 'Licences', value: '' },
          ].map(({ label, value }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: i < 3 ? 1 : 0 }]}
            >
              <Text style={[Typography.body, { color: colors.text }]}>{label}</Text>
              {value ? (
                <Text style={[Typography.body, { color: colors.textSub }]}>{value}</Text>
              ) : (
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: { flex: 1 } as any,
  sectionTitle: (colors: any) => ({
    ...Typography.label,
    color: colors.textMuted,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: 0.8,
  }) as any,
  card: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden' as const },
  settingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: Spacing.base, borderBottomWidth: 1 },
  settingIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center' as const, justifyContent: 'center' as const },
  toggle: { width: 40, height: 22, borderRadius: 11, justifyContent: 'center' as const },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.white as string },
  themeRow: { flexDirection: 'row' as const, gap: 10 },
  themeBtn: { flex: 1, alignItems: 'center' as const, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1.5 },
  infoRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: Spacing.base },
};

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';

const FAQS = [
  { q: 'How do I cancel a ride?', a: 'Go to your active ride screen and tap "Cancel Ride". Cancellations within 2 min are free.' },
  { q: 'When will I get my refund?', a: 'Refunds are processed within 3–5 business days to your original payment method.' },
  { q: 'How does SwibberPay work?', a: 'SwibberPay is your in-app wallet. Add money via UPI or card and use it for instant payments.' },
  { q: 'What is Gold membership?', a: 'Gold members earn 2x reward points, get priority support, and access exclusive deals.' },
  { q: 'How to raise a complaint?', a: 'Use the "Report an issue" option below or contact us via chat.' },
];

const CONTACT_OPTIONS = [
  { icon: 'chat', label: 'Live Chat', desc: 'Avg. response: 2 min', color: Colors.primary },
  { icon: 'call', label: 'Call Us', desc: '1800-123-SWIB', color: Colors.success },
  { icon: 'email', label: 'Email', desc: 'support@swibber.in', color: Colors.accent },
];

type SupportNav = StackNavigationProp<ProfileStackParamList, 'HelpSupport'>;

export default function HelpSupportScreen() {
  const navigation = useNavigation<SupportNav>();
  const { colors } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [issueText, setIssueText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitIssue = async () => {
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setIssueText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Help & Support" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.hero}>
          <Text style={{ fontSize: 40 }}>🤝</Text>
          <Text style={[Typography.h3, { color: Colors.white, marginTop: 10 }]}>How can we help?</Text>
          <Text style={[Typography.body, { color: 'rgba(255,255,255,0.8)', marginTop: 4 }]}>
            We're here for you 24/7
          </Text>
        </LinearGradient>

        {/* Contact options */}
        <Text style={[Typography.label, { color: colors.textSub, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: 10 }]}>CONTACT US</Text>
        <View style={styles.contactRow}>
          {CONTACT_OPTIONS.map((opt) => (
            <TouchableOpacity 
              key={opt.label} 
              style={[styles.contactCard, { backgroundColor: colors.card }]}
              onPress={() => {
                if (opt.label === 'Live Chat') {
                  navigation.navigate('SupportChat');
                }
              }}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${opt.color}15` }]}>
                <MaterialIcons name={opt.icon as any} size={24} color={opt.color} />
              </View>
              <Text style={[Typography.captionBold, { color: colors.text, marginTop: 8 }]}>{opt.label}</Text>
              <Text style={[Typography.caption, { color: colors.textSub, textAlign: 'center' }]}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <Text style={[Typography.label, { color: colors.textSub, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: 10 }]}>FREQUENTLY ASKED</Text>
        <View style={[styles.faqCard, { backgroundColor: colors.card }]}>
          {FAQS.map(({ q, a }, i) => (
            <View key={i} style={[styles.faqItem, { borderBottomColor: colors.border, borderBottomWidth: i < FAQS.length - 1 ? 1 : 0 }]}>
              <TouchableOpacity onPress={() => setExpandedFaq(expandedFaq === i ? null : i)} style={styles.faqQ}>
                <Text style={[Typography.label, { color: colors.text, flex: 1 }]}>{q}</Text>
                <MaterialIcons
                  name={expandedFaq === i ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              {expandedFaq === i && (
                <Text style={[Typography.body, { color: colors.textSub, paddingBottom: Spacing.sm }]}>{a}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Report issue */}
        <Text style={[Typography.label, { color: colors.textSub, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: 10 }]}>REPORT AN ISSUE</Text>
        <View style={[styles.reportCard, { backgroundColor: colors.card }]}>
          {isSubmitted ? (
            <View style={styles.submittedState}>
              <Text style={{ fontSize: 40 }}>✅</Text>
              <Text style={[Typography.label, { color: Colors.success, marginTop: 10 }]}>Issue reported!</Text>
              <Text style={[Typography.body, { color: colors.textSub, marginTop: 4 }]}>Our team will respond within 24h</Text>
            </View>
          ) : (
            <>
              <TextInput
                value={issueText}
                onChangeText={setIssueText}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={[styles.issueInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              />
              <Button
                label="Submit Report"
                onPress={submitIssue}
                isDisabled={issueText.trim().length < 10}
                style={{ marginTop: 12 }}
                size="sm"
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { margin: Spacing.xl, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center' },
  contactRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 10 },
  contactCard: { flex: 1, alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.xl },
  contactIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  faqCard: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  faqItem: { paddingHorizontal: Spacing.base },
  faqQ: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.base, gap: 8 },
  reportCard: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, padding: Spacing.base },
  issueInput: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.sm, height: 100, textAlignVertical: 'top' },
  submittedState: { alignItems: 'center', paddingVertical: Spacing.xl },
});

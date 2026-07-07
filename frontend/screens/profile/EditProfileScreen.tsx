import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Validators } from '../../utils/validators';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateProfile } from '../../hooks/useProfileQuery';
import { useUserProfile } from '../../hooks/useProfileQuery';
import { useDialog } from '../../context/DialogContext';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user: authUser } = useAuth();
  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { showDialog } = useDialog();

  const user = profile ?? authUser;

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState((user as any)?.email ?? '');
  const [phone, setPhone] = useState(((user as any)?.phone ?? '').replace(/^\+91\s?/, ''));
  const [gender, setGender] = useState<string>((user as any)?.gender ?? '');
  const [saved, setSaved] = useState(false);

  const errors = {
    name:  name.length > 0 && !Validators.isValidName(name)   ? 'Enter a valid name'   : '',
    email: email.length > 0 && !Validators.isValidEmail(email) ? 'Enter a valid email'  : '',
    phone: phone.length > 0 && phone.length < 10               ? 'Enter 10-digit number': '',
  };

  const isValid = Validators.isValidName(name) && (email === '' || Validators.isValidEmail(email));

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(
        {
          name,
          email:  email  || undefined,
          phone:  phone  ? `+91 ${phone}` : undefined,
          gender: gender || undefined,
        },
        { onError: () => {} }, // suppress default toast — we show a dialog below
      );
      setSaved(true);
      setTimeout(() => navigation.goBack(), 800);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Failed to update profile. Please try again.';
      showDialog({ title: 'Update Failed', message, type: 'error' });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title="Edit Profile" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View>
              <Avatar name={name || user?.name} size={88} />
              <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: Colors.primary }]}>
                <MaterialIcons name="camera-alt" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={[Typography.caption, { color: colors.textSub, marginTop: 10 }]}>Tap to change photo</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              leftIcon="person"
              error={errors.name}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              leftIcon="email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              leftIcon="phone"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />

            {/* Gender */}
            <Text style={[Typography.label, { color: colors.textSub, marginBottom: 8, marginTop: 4 }]}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => {
                const val = g.toLowerCase();
                const isSelected = gender === val;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(val)}
                    style={[
                      styles.genderBtn,
                      {
                        borderColor: isSelected ? Colors.primary : colors.border,
                        backgroundColor: isSelected ? `${Colors.primary}15` : colors.card,
                      },
                    ]}
                  >
                    <Text style={[Typography.captionBold, { color: isSelected ? Colors.primary : colors.text }]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              label={saved ? 'Saved!' : 'Save Changes'}
              onPress={handleSave}
              isLoading={updateProfile.isPending}
              isDisabled={!isValid || updateProfile.isPending}
              style={{ marginTop: 24 }}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  form: { paddingHorizontal: Spacing.xl },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1.5, alignItems: 'center' },
});

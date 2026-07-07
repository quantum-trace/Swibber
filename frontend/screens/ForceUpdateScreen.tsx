import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import Button from '../components/common/Button';

type DownloadStatus = 'idle' | 'downloading' | 'installing' | 'error';

interface Props {
  apkUrl: string;
}

export default function ForceUpdateScreen({ apkUrl }: Props) {
  const [status, setStatus]     = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);

  // Block Android hardware back — user must update
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const downloadAndInstall = async () => {
    setStatus('downloading');
    setProgress(0);

    try {
      const localUri = `${FileSystem.documentDirectory}swibber-update.apk`;

      const downloadTask = FileSystem.createDownloadResumable(
        apkUrl,
        localUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        },
      );

      const result = await downloadTask.downloadAsync();
      if (!result?.uri) throw new Error('Download failed');

      setStatus('installing');

      // Android requires a content URI (not file URI) to install APKs
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });

      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  const buttonLabel = () => {
    if (status === 'downloading') return `Downloading... ${Math.round(progress * 100)}%`;
    if (status === 'installing')  return 'Opening Installer...';
    if (status === 'error')       return 'Retry Download';
    return 'Download & Install';
  };

  const isbusy = status === 'downloading' || status === 'installing';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0A1A', '#0F0820']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🚀</Text>
          <View style={styles.iconGlow} />
        </View>

        <Text style={styles.appName}>Swibber</Text>
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.subtitle}>
          A new version of Swibber is available with important improvements and fixes.
          Please update to continue.
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>New version available</Text>
        </View>
      </View>

      <View style={styles.cta}>
        {/* Download progress bar */}
        {status === 'downloading' && (
          <View style={styles.progressWrap}>
            <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        )}

        <Button
          label={buttonLabel()}
          onPress={downloadAndInstall}
          gradient={status === 'error' ? ['#FF4444', '#CC2222'] : Colors.gradientPrimary}
          disabled={isbusy}
        />

        {Platform.OS === 'android' && status === 'idle' && (
          <Text style={styles.hint}>
            You'll need to allow "Install unknown apps" when prompted
          </Text>
        )}

        {status === 'error' && (
          <Text style={[styles.hint, { color: '#FF6B6B' }]}>
            Download failed. Check your connection and try again.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 80,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  appName: {
    ...Typography.heading2,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    ...Typography.display2,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: `${Colors.white}70`,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 28,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.primary}60`,
    backgroundColor: `${Colors.primary}15`,
  },
  badgeText: {
    ...Typography.label,
    color: Colors.primary,
  },
  progressWrap: {
    width: '100%',
    height: 4,
    backgroundColor: `${Colors.white}15`,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  cta: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  hint: {
    ...Typography.caption,
    color: `${Colors.white}40`,
    textAlign: 'center',
  },
});

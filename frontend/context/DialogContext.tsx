import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, Animated,
  Pressable, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Colors, Typography, BorderRadius, Spacing } from '../theme';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  buttons?: DialogButton[];
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
}

interface DialogContextValue {
  showDialog: (options: DialogOptions) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

const TYPE_CONFIGS = {
  info:    { color: Colors.primary, icon: 'info'         as const },
  success: { color: Colors.success, icon: 'check-circle' as const },
  error:   { color: Colors.error,   icon: 'error'        as const },
  warning: { color: Colors.warning, icon: 'warning'      as const },
  confirm: { color: Colors.primary, icon: 'help-outline' as const },
};

const { width } = Dimensions.get('window');

function DialogCard({
  options,
  onClose,
}: {
  options: DialogOptions;
  onClose: (btn?: DialogButton) => void;
}) {
  const { colors } = useTheme();
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = (btn?: DialogButton) => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, friction: 6 }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]).start(() => onClose(btn));
  };

  const buttons    = options.buttons?.length ? options.buttons : [{ text: 'OK' }];
  const typeCfg    = TYPE_CONFIGS[options.type ?? 'info'];
  const isStack    = buttons.length > 2;

  return (
    <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} />

      <Animated.View
        style={[styles.card, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}
      >
        {/* Icon circle */}
        <View style={[styles.iconWrap, { backgroundColor: `${typeCfg.color}18` }]}>
          <MaterialIcons name={typeCfg.icon} size={30} color={typeCfg.color} />
        </View>

        {/* Title */}
        <Text style={[Typography.h4, styles.title, { color: colors.text }]} numberOfLines={4}>
          {options.title}
        </Text>

        {/* Message */}
        {!!options.message && (
          <Text style={[Typography.body, styles.message, { color: colors.textSub }]}>
            {options.message}
          </Text>
        )}

        {/* Buttons */}
        <View style={[styles.btnWrap, isStack ? styles.btnStack : styles.btnRow]}>
          {buttons.map((btn, idx) => {
            const isCancel      = btn.style === 'cancel';
            const isDestructive = btn.style === 'destructive';
            const bgColor  = isCancel ? 'transparent' : isDestructive ? Colors.error : typeCfg.color;
            const txtColor = isCancel ? colors.textSub : '#fff';

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => dismiss(btn)}
                style={[
                  styles.btn,
                  isStack ? styles.btnWide : styles.btnFlex,
                  {
                    backgroundColor: bgColor,
                    borderWidth:  isCancel ? 1.5 : 0,
                    borderColor:  isCancel ? colors.border : undefined,
                  },
                ]}
              >
                <Text style={[Typography.label, { color: txtColor }]}>{btn.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const showDialog = useCallback((opts: DialogOptions) => {
    setOptions(opts);
  }, []);

  const handleClose = useCallback((btn?: DialogButton) => {
    setOptions(null);
    btn?.onPress?.();
  }, []);

  return (
    <DialogContext.Provider value={{ showDialog }}>
      {children}
      {!!options && (
        <Modal
          visible
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => handleClose()}
        >
          <DialogCard options={options} onClose={handleClose} />
        </Modal>
      )}
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: Math.min(width - Spacing.xl * 2, 340),
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
  btnWrap: {
    width: '100%',
    marginTop: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnStack: {
    flexDirection: 'column',
    gap: 8,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFlex: {
    flex: 1,
  },
  btnWide: {
    width: '100%',
  },
});

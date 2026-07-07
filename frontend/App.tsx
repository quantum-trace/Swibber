import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { DialogProvider } from './context/DialogContext';
import AppNavigator from './navigation/AppNavigator';
import { useTheme } from './hooks/useTheme';
import { connectSocket } from './socket/socketManager';
import { useAuthContext } from './context/AuthContext';
import { NotificationService } from './services/notificationService';
import { StorageService } from './services/storageService';

LogBox.ignoreLogs([
  'Reanimated 2',
  'Non-serializable values were found',
  'new NativeEventEmitter',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppServices() {
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!isAuthenticated) return;
    connectSocket();

    const registerNotifications = async () => {
      const token = await NotificationService.registerForPushNotifications();
      if (token) {
        await StorageService.set('@swibber/fcm_token', token);
        await NotificationService.updateFcmToken(token);
      }
    };
    registerNotifications();
  }, [isAuthenticated]);

  return null;
}

function AppWithTheme() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <AppServices />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <DialogProvider>
                  <AppWithTheme />
                </DialogProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { SYNC_INTERVAL_MS } from './src/config';
import { syncNow } from './src/sync/syncEngine';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Foreground sync heartbeat — drains the outbox on a fixed cadence. Also catches
  // reconnects (a failed flush just retries next tick).
  useEffect(() => {
    const id = setInterval(() => void syncNow(), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

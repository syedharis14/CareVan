import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { AdminNoticeScreen } from '../screens/InfoScreen';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';
import { DriverNavigator } from './DriverNavigator';
import { ParentNavigator } from './ParentNavigator';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <Text style={styles.brand}>CareVan</Text>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (status === 'anon' || !user) return <LoginScreen />;

  switch (user.role) {
    case 'DRIVER':
      return <DriverNavigator />;
    case 'PARENT':
      return <ParentNavigator />;
    default:
      return <AdminNoticeScreen />;
  }
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
    gap: theme.spacing.xl,
  },
  brand: { fontSize: 36, fontWeight: '800', color: theme.colors.primary },
});

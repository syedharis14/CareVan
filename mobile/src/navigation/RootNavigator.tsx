import { LoginScreen } from '../screens/LoginScreen';
import { AdminNoticeScreen } from '../screens/InfoScreen';
import { useAuthStore } from '../store/authStore';
import { Splash } from '../ui/Splash';
import { DriverNavigator } from './DriverNavigator';
import { ParentNavigator } from './ParentNavigator';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'loading') return <Splash />;
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

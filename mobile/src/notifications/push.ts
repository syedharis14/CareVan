import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { colors } from '../theme/theme';

// Foreground alerts still surface a banner — parents (and drivers, for SOS ack) must
// never miss one because the app happened to be open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push and return the Expo push token, or null if unavailable
 * (simulator, or permission declined). Callers upload it via PUT /me/push-token.
 */
export async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    // MAX importance + PUBLIC lock-screen visibility so BOARDED/REACHED alerts break through
    // Doze and show a heads-up even when the phone is locked. The backend push sets
    // channelId 'default' to target this channel — the two MUST stay in sync.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CareVan alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      lightColor: colors.primary,
      enableVibrate: true,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
}

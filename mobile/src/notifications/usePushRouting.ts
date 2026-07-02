import { useEffect } from 'react';
import { AlertPushDataSchema } from '@carevan/shared';
import * as Notifications from 'expo-notifications';
import { openChild } from '../navigation/navigationRef';

function routeFrom(response: Notifications.NotificationResponse | null): void {
  if (!response) return;
  const parsed = AlertPushDataSchema.safeParse(response.notification.request.content.data);
  if (parsed.success && parsed.data.studentId) openChild(parsed.data.studentId);
}

/**
 * When a parent taps a CareVan alert (BOARDED / REACHED / SOS), open that child's
 * live screen. Handles both a tap while running and a cold start from a notification.
 */
export function usePushRouting(): void {
  useEffect(() => {
    // Cold start: app opened by tapping a notification.
    void Notifications.getLastNotificationResponseAsync().then(routeFrom);

    const sub = Notifications.addNotificationResponseReceivedListener(routeFrom);
    return () => sub.remove();
  }, []);
}

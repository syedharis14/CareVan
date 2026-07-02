import * as Device from 'expo-device';
import { Linking } from 'react-native';
import { kvGet, kvSet } from '../db/database';

/**
 * ColorOS (Oppo/Realme/OnePlus) and MIUI/HyperOS (Xiaomi/Redmi/POCO) aggressively
 * kill background apps — the #1 cause of a missed BOARDED alert on the driver's phone.
 * We can't read the battery-optimization state without a native module in v1, so we
 * detect the OEM, walk the driver through the setting, and record their acknowledgement.
 */
const AGGRESSIVE_BRANDS = ['oppo', 'realme', 'oneplus', 'xiaomi', 'redmi', 'poco'];

const KV_BATTERY_ACK = 'battery_ack';

export function getOemName(): string {
  return Device.manufacturer ?? Device.brand ?? 'your phone';
}

/** True on OEMs known to kill background location unless whitelisted. */
export function isAggressiveOem(): boolean {
  const brand = (Device.brand ?? Device.manufacturer ?? '').toLowerCase();
  return AGGRESSIVE_BRANDS.some((b) => brand.includes(b));
}

/** OEM-specific steps (Roman-Urdu-friendly English) for the onboarding screen. */
export function batterySteps(): string[] {
  const brand = (Device.brand ?? Device.manufacturer ?? '').toLowerCase();
  if (['oppo', 'realme', 'oneplus'].some((b) => brand.includes(b))) {
    return [
      'Open Settings → Battery → App Battery Management (or Power Saving).',
      'Find CareVan and turn OFF "Optimize" / "Sleep" restrictions.',
      'Settings → Apps → CareVan → allow "Auto-start" / "Startup".',
      'Lock CareVan in the recent-apps screen (pull down on the card → lock icon).',
    ];
  }
  if (['xiaomi', 'redmi', 'poco'].some((b) => brand.includes(b))) {
    return [
      'Settings → Apps → Manage apps → CareVan → Battery saver → No restrictions.',
      'On the same screen turn ON "Autostart".',
      'Lock CareVan in recent apps (swipe down on the card → lock).',
    ];
  }
  return [
    'Open Settings → Apps → CareVan → Battery.',
    'Set battery usage to "Unrestricted" so tracking keeps running with the screen off.',
  ];
}

export async function getBatteryAck(): Promise<boolean> {
  return (await kvGet(KV_BATTERY_ACK)) === '1';
}

export async function setBatteryAck(done: boolean): Promise<void> {
  await kvSet(KV_BATTERY_ACK, done ? '1' : null);
}

/** Opens this app's system settings page (closest cross-OEM entry point). */
export async function openBatterySettings(): Promise<void> {
  await Linking.openSettings().catch(() => undefined);
}

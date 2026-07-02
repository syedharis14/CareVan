import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { colors } from '../theme/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type MdiName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Primary icon set (Ionicons) — used everywhere for a consistent line-icon look. */
export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** Material Community icons for the few glyphs Ionicons lacks (school van, etc.). */
export function Mdi({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: MdiName;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

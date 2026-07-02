import { ChildStatus } from '@carevan/shared';
import { colors } from '@carevan/shared';

/** Presentation for a child status — color + icon + label. Color is never the only
 *  signal (always paired with an icon glyph + label). Safe green = child is safe. */
export interface StatusView {
  label: string;
  icon: string;
  color: string;
  /** True while the van is moving with the child — the "en route" amber state. */
  enRoute: boolean;
}

const VIEWS: Record<ChildStatus, StatusView> = {
  AT_SCHOOL: { label: 'At school', icon: '✓', color: colors.safe, enRoute: false },
  AT_HOME: { label: 'Home safe', icon: '✓', color: colors.safe, enRoute: false },
  ON_VAN_TO_SCHOOL: {
    label: 'On the van → school',
    icon: '🚐',
    color: colors.transit,
    enRoute: true,
  },
  ON_VAN_TO_HOME: { label: 'On the van → home', icon: '🚐', color: colors.transit, enRoute: true },
  WAITING: { label: 'Waiting for the van', icon: '•', color: colors.inkSoft, enRoute: false },
  IDLE: { label: 'No trip right now', icon: '•', color: colors.inkSoft, enRoute: false },
};

export function statusView(status: ChildStatus): StatusView {
  return VIEWS[status];
}

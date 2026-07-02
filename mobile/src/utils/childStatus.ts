import { ChildStatus, TripType } from '@carevan/shared';
import { colors } from '../theme/theme';
import { IconName, Step } from '../ui';
import { Tone } from '../ui/Chip';

export interface StatusView {
  label: string;
  icon: IconName;
  color: string;
  tone: Tone;
  /** True while the van is moving with the child — the "en route" amber state. */
  enRoute: boolean;
}

const VIEWS: Record<ChildStatus, StatusView> = {
  AT_SCHOOL: {
    label: 'At school',
    icon: 'checkmark-circle',
    color: colors.safe,
    tone: 'safe',
    enRoute: false,
  },
  AT_HOME: {
    label: 'Home safe',
    icon: 'checkmark-circle',
    color: colors.safe,
    tone: 'safe',
    enRoute: false,
  },
  ON_VAN_TO_SCHOOL: {
    label: 'On the van → school',
    icon: 'bus',
    color: colors.transit,
    tone: 'transit',
    enRoute: true,
  },
  ON_VAN_TO_HOME: {
    label: 'On the van → home',
    icon: 'bus',
    color: colors.transit,
    tone: 'transit',
    enRoute: true,
  },
  WAITING: {
    label: 'Waiting for the van',
    icon: 'time',
    color: colors.inkSoft,
    tone: 'neutral',
    enRoute: false,
  },
  IDLE: {
    label: 'No trip right now',
    icon: 'ellipse-outline',
    color: colors.inkSoft,
    tone: 'neutral',
    enRoute: false,
  },
};

export function statusView(status: ChildStatus): StatusView {
  return VIEWS[status];
}

/** The three-stop journey + how far along the child is (for the Stepper). */
export function journey(
  status: ChildStatus,
  type: TripType | undefined,
): { steps: Step[]; current: number } {
  const dropoff = type === 'DROPOFF';
  const steps: Step[] = dropoff
    ? [
        { icon: 'school', label: 'School' },
        { icon: 'bus', label: 'On the van' },
        { icon: 'home', label: 'Home' },
      ]
    : [
        { icon: 'home', label: 'Home' },
        { icon: 'bus', label: 'On the van' },
        { icon: 'school', label: 'School' },
      ];
  let current = 0;
  if (status === 'ON_VAN_TO_SCHOOL' || status === 'ON_VAN_TO_HOME') current = 1;
  else if (status === 'AT_SCHOOL' || status === 'AT_HOME') current = 3;
  return { steps, current };
}

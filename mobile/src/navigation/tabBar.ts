import { ViewStyle } from 'react-native';
import { colors } from '../theme/theme';

/** Shared bottom-tab bar look — white, hairline top border, comfortable height. */
export const tabBarStyle: ViewStyle = {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  height: 64,
  paddingTop: 6,
  paddingBottom: 10,
};

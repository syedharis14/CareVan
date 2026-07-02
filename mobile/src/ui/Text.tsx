import { Text as RNText, TextProps } from 'react-native';
import { colors, type as typeScale } from '../theme/theme';

type Variant = keyof typeof typeScale;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
}

/** The one text component — always Inter, always from the type scale. */
export function Text({ variant = 'body', color = colors.ink, center, style, ...rest }: Props) {
  return (
    <RNText
      style={[typeScale[variant], { color }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}

import { StyleSheet, View } from 'react-native';
import { colors, withAlpha } from '../theme/theme';
import { Text } from './Text';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({
  name,
  size = 44,
  color = colors.primary,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(color, 0.14),
        },
      ]}
    >
      <Text variant={size >= 44 ? 'title' : 'label'} color={color}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});

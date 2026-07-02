import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/theme';

interface Props {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  padded?: boolean;
  edges?: readonly Edge[];
}

/** Standard screen surface: brand bg, safe areas, optional sticky header/footer. */
export function Screen({
  children,
  header,
  footer,
  scroll,
  refreshing,
  onRefresh,
  contentStyle,
  padded = true,
  edges = ['top'],
}: Props) {
  return (
    <SafeAreaView style={styles.flex} edges={edges}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padded && styles.padded, styles.grow, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, padded && styles.padded, contentStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  grow: { flexGrow: 1 },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
});

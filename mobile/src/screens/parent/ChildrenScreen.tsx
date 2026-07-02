import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { ChildStatusCard } from '../../components/ChildStatusCard';
import { ParentStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useParentStore } from '../../store/parentStore';
import { colors, spacing } from '../../theme/theme';
import { EmptyState, Icon, Logo, Screen, Text } from '../../ui';

type Nav = NativeStackNavigationProp<ParentStackParamList>;
const POLL_MS = 15_000;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function ChildrenScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const { children, loading, error, refresh } = useParentStore();

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const id = setInterval(() => void refresh(), POLL_MS);
      return () => clearInterval(id);
    }, [refresh]),
  );

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const header = (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text variant="caption" color={colors.inkSoft}>
          {greeting()}
        </Text>
        <Text variant="h1" numberOfLines={1}>
          {firstName}
        </Text>
      </View>
      <Logo size={38} wordmark={false} />
    </View>
  );

  return (
    <Screen scroll header={header} refreshing={loading} onRefresh={() => void refresh()}>
      {error ? (
        <View style={styles.error}>
          <Icon name="cloud-offline-outline" size={16} color={colors.ink} />
          <Text variant="caption" color={colors.ink}>
            {error}
          </Text>
        </View>
      ) : null}

      {children.length === 0 && !loading ? (
        <EmptyState
          icon="people-outline"
          title="No children yet"
          subtitle="No children are linked to your account. Contact CareVan to get set up."
        />
      ) : (
        children.map((child) => (
          <ChildStatusCard
            key={child.student.id}
            child={child}
            onPress={() => navigation.navigate('ChildDetail', { studentId: child.student.id })}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  flex: { flex: 1 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
});

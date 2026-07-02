import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChildStatusCard } from '../../components/ChildStatusCard';
import { ParentStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useParentStore } from '../../store/parentStore';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'Children'>;

const POLL_MS = 15_000;

export function ChildrenScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);
  const { children, loading, error, refresh } = useParentStore();

  // Reconcile on open + poll — push is never guaranteed, the UI must not depend on it.
  useFocusEffect(
    useCallback(() => {
      void refresh();
      const id = setInterval(() => void refresh(), POLL_MS);
      return () => clearInterval(id);
    }, [refresh]),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your children</Text>
        <Pressable onPress={logout} accessibilityRole="button">
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {children.length === 0 && !loading ? (
        <Text style={styles.muted}>No children linked to your account yet. Contact CareVan.</Text>
      ) : (
        children.map((child) => (
          <ChildStatusCard
            key={child.student.id}
            child={child}
            onPress={() => navigation.navigate('ChildDetail', { studentId: child.student.id })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: { fontSize: 26, fontWeight: '800', color: theme.colors.ink },
  logout: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.md },
  muted: {
    color: theme.colors.inkSoft,
    fontSize: 15,
    marginTop: theme.spacing.xl,
    textAlign: 'center',
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

/** Simple centered notice used for the PARENT placeholder (Phase 4) and the ADMIN notice. */
export function InfoScreen({ title, body }: { title: string; body: string }) {
  const logout = useAuthStore((s) => s.logout);
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CareVan</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <PrimaryButton label="Log out" variant="ghost" onPress={logout} style={styles.button} />
    </View>
  );
}

export const ParentPlaceholderScreen = () => (
  <InfoScreen
    title="Parent app is coming next"
    body="The parent experience — live tracking and instant alerts — lands in the next update. You're signed in and ready."
  />
);

export const AdminNoticeScreen = () => (
  <InfoScreen
    title="Use the web admin"
    body="Admin accounts manage CareVan from the desktop web panel, not this app."
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xxl,
  },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.ink, textAlign: 'center' },
  body: {
    fontSize: 16,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 23,
  },
  button: { marginTop: theme.spacing.xxl, alignSelf: 'stretch' },
});

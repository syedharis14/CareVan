import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { colors, spacing } from '../theme/theme';
import { Button, EmptyState, Logo } from '../ui';

function Notice({
  icon,
  title,
  body,
}: {
  icon: 'desktop-outline' | 'time-outline';
  title: string;
  body: string;
}) {
  const logout = useAuthStore((s) => s.logout);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Logo size={40} />
      </View>
      <View style={styles.center}>
        <EmptyState icon={icon} title={title} subtitle={body} />
      </View>
      <View style={styles.bottom}>
        <Button
          label="Log out"
          variant="ghost"
          icon="log-out-outline"
          onPress={() => void logout()}
        />
      </View>
    </SafeAreaView>
  );
}

export const AdminNoticeScreen = () => (
  <Notice
    icon="desktop-outline"
    title="Use the web admin"
    body="Admin accounts manage CareVan from the desktop web panel, not this app."
  />
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { alignItems: 'center', paddingTop: spacing.xl },
  center: { flex: 1, justifyContent: 'center' },
  bottom: { padding: spacing.xl },
});

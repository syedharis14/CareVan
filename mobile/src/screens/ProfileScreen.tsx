import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { DriverVan } from '@carevan/shared';
import { driverApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { useParentStore } from '../store/parentStore';
import { colors, radii, spacing, withAlpha } from '../theme/theme';
import { Avatar, Card, Chip, Header, Icon, IconName, Screen, Text } from '../ui';

function Row({
  icon,
  label,
  value,
  tint = colors.primary,
}: {
  icon: IconName;
  label: string;
  value?: string;
  tint?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: withAlpha(tint, 0.12) }]}>
        <Icon name={icon} size={18} color={tint} />
      </View>
      <View style={styles.rowText}>
        <Text variant="caption" color={colors.inkSoft}>
          {label}
        </Text>
        {value ? <Text variant="bodyMd">{value}</Text> : null}
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const children = useParentStore((s) => s.children);
  const refreshChildren = useParentStore((s) => s.refresh);
  const [van, setVan] = useState<DriverVan | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'PARENT') void refreshChildren();
      if (user?.role === 'DRIVER') void driverApi.myVans().then((v) => setVan(v[0] ?? null));
    }, [user?.role, refreshChildren]),
  );

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You can sign back in with your phone and PIN.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const version = Constants.expoConfig?.version ?? '0.1.0';
  const roleLabel =
    user?.role === 'DRIVER' ? 'Driver' : user?.role === 'PARENT' ? 'Parent' : 'Admin';

  return (
    <Screen scroll header={<Header title="Profile" />}>
      <Card style={styles.identity}>
        <Avatar name={user?.name ?? 'U'} size={64} />
        <Text variant="h2" style={styles.name}>
          {user?.name}
        </Text>
        <Chip label={roleLabel} tone="primary" icon="shield-checkmark" />
        <Text variant="body" color={colors.inkSoft} style={styles.phone}>
          {user?.phone}
        </Text>
      </Card>

      {user?.role === 'PARENT' ? (
        <>
          <Text variant="label" color={colors.inkSoft} style={styles.section}>
            YOUR CHILDREN
          </Text>
          <Card padded={false}>
            {children.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text variant="body" color={colors.inkSoft}>
                  No children linked yet.
                </Text>
              </View>
            ) : (
              children.map((c, i) => (
                <View key={c.student.id} style={[styles.childRow, i > 0 && styles.divider]}>
                  <Avatar name={c.student.name} size={38} color={colors.safe} />
                  <View style={styles.rowText}>
                    <Text variant="bodyMd">{c.student.name}</Text>
                    <Text variant="caption" color={colors.inkSoft}>
                      {c.school.name}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}

      {user?.role === 'DRIVER' && van ? (
        <>
          <Text variant="label" color={colors.inkSoft} style={styles.section}>
            YOUR VAN
          </Text>
          <Card>
            <Row
              icon="bus"
              label="Vehicle"
              value={`${van.plateNo} · ${van.students.length} students`}
            />
            <View style={styles.rowGap} />
            <Row icon="school" label="School" value={van.school.name} tint={colors.safe} />
          </Card>
        </>
      ) : null}

      <Text variant="label" color={colors.inkSoft} style={styles.section}>
        APP
      </Text>
      <Card>
        <Row
          icon="notifications"
          label="Alerts"
          value="Push notifications on"
          tint={colors.transit}
        />
        <View style={styles.rowGap} />
        <Row
          icon="information-circle"
          label="Version"
          value={`CareVan ${version}`}
          tint={colors.inkSoft}
        />
      </Card>

      <Pressable onPress={confirmLogout} style={styles.logout}>
        <Icon name="log-out-outline" size={20} color={colors.inkSoft} />
        <Text variant="button" color={colors.inkSoft}>
          Log out
        </Text>
      </Pressable>

      <Text variant="caption" color={colors.inkSoft} center style={styles.legal}>
        CareVan
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  name: { marginTop: spacing.sm },
  phone: { marginTop: 2 },
  section: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowGap: { height: spacing.lg },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  emptyRow: { padding: spacing.lg },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  legal: { marginTop: spacing.sm },
});

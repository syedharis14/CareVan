import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SosButton } from '../../components/SosButton';
import { StudentRow } from '../../components/StudentRow';
import { DriverStackParamList } from '../../navigation/types';
import { useTripStore } from '../../store/tripStore';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<DriverStackParamList, 'ActiveTrip'>;

export function ActiveTripScreen() {
  const navigation = useNavigation<Nav>();
  const {
    trip,
    students,
    statuses,
    pending,
    busy,
    record,
    endTrip,
    refreshStatuses,
    refreshPending,
  } = useTripStore();

  // Reconcile with the server periodically while the screen is open.
  useFocusEffect(
    useCallback(() => {
      void refreshStatuses();
      void refreshPending();
      const id = setInterval(() => {
        void refreshStatuses();
        void refreshPending();
      }, 15_000);
      return () => clearInterval(id);
    }, [refreshStatuses, refreshPending]),
  );

  const confirmEnd = () => {
    Alert.alert(
      'End this trip?',
      'Location tracking will stop and the trip will be marked complete.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'End trip',
          style: 'destructive',
          onPress: async () => {
            await endTrip(false);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (!trip) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No active trip.</Text>
        <PrimaryButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const totalPending = pending.events + pending.pings;
  const isPickup = trip.type === 'PICKUP';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{isPickup ? 'Morning pickup' : 'Afternoon dropoff'}</Text>
          <SosButton />
        </View>
        <Text style={totalPending > 0 ? styles.syncing : styles.synced}>
          {totalPending > 0
            ? `⟳ Syncing ${totalPending} update${totalPending === 1 ? '' : 's'}…`
            : '✓ All synced'}
        </Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <StudentRow
            student={item}
            status={statuses[item.id] ?? 'PENDING'}
            tripType={trip.type}
            onRecord={(type) => record(item.id, type)}
          />
        )}
        ListEmptyComponent={<Text style={styles.muted}>No students on this route.</Text>}
      />

      <View style={styles.footer}>
        <PrimaryButton label="End trip" variant="primary" onPress={confirmEnd} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.ink },
  syncing: { color: theme.colors.transit, marginTop: theme.spacing.xs, fontWeight: '600' },
  synced: { color: theme.colors.safe, marginTop: theme.spacing.xs, fontWeight: '600' },
  list: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xl },
  muted: { color: theme.colors.inkSoft, textAlign: 'center', marginTop: theme.spacing.xl },
  footer: {
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primaryLight,
    backgroundColor: theme.colors.surface,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  emptyText: { fontSize: 18, color: theme.colors.inkSoft },
});

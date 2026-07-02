import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SosButton } from '../../components/SosButton';
import { StudentRow } from '../../components/StudentRow';
import { DriverStackParamList } from '../../navigation/types';
import { useTripStore } from '../../store/tripStore';
import { colors, spacing } from '../../theme/theme';
import { Button, Chip, Header, Screen, Text } from '../../ui';

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
      <Screen header={<Header onBack={() => navigation.goBack()} title="Trip" />}>
        <Text variant="body" color={colors.inkSoft} center>
          No active trip.
        </Text>
      </Screen>
    );
  }

  const totalPending = pending.events + pending.pings;
  const isPickup = trip.type === 'PICKUP';

  return (
    <Screen
      padded={false}
      header={
        <Header
          title={isPickup ? 'Morning pickup' : 'Afternoon dropoff'}
          onBack={() => navigation.goBack()}
          right={<SosButton />}
        />
      }
      footer={
        <View style={styles.footer}>
          <Button label="End trip" icon="stop-circle" onPress={confirmEnd} loading={busy} />
        </View>
      }
    >
      <View style={styles.syncRow}>
        <Chip
          label={
            totalPending > 0
              ? `Syncing ${totalPending} update${totalPending === 1 ? '' : 's'}`
              : 'All synced'
          }
          tone={totalPending > 0 ? 'transit' : 'safe'}
          icon={totalPending > 0 ? 'sync' : 'checkmark-circle'}
        />
      </View>

      <FlatList
        data={students}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StudentRow
            student={item}
            status={statuses[item.id] ?? 'PENDING'}
            tripType={trip.type}
            onRecord={(type) => record(item.id, type)}
          />
        )}
        ListEmptyComponent={
          <Text variant="body" color={colors.inkSoft} center style={styles.empty}>
            No students on this route.
          </Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  syncRow: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  empty: { marginTop: spacing.xxl },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DriverStackParamList } from '../../navigation/types';
import { theme } from '../../theme/theme';
import { batterySteps, getOemName, openBatterySettings, setBatteryAck } from '../../utils/battery';

type Nav = NativeStackNavigationProp<DriverStackParamList, 'BatteryWhitelist'>;

export function BatteryWhitelistScreen() {
  const navigation = useNavigation<Nav>();
  const steps = batterySteps();

  const confirmDone = async () => {
    await setBatteryAck(true);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Keep CareVan running</Text>
      <Text style={styles.intro}>
        {getOemName()} phones can stop apps in the background to save battery. If that happens
        mid-trip, parents stop getting alerts. Please allow CareVan to run — it only tracks during
        an active trip.
      </Text>

      <View style={styles.card}>
        {steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton label="Open phone settings" onPress={openBatterySettings} style={styles.mt} />
      <PrimaryButton
        label="I've enabled it"
        variant="safe"
        onPress={confirmDone}
        style={styles.mt}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.xl },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.ink,
    marginBottom: theme.spacing.sm,
  },
  intro: {
    fontSize: 16,
    color: theme.colors.inkSoft,
    lineHeight: 23,
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    ...theme.cardShadow,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.lg },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  badgeText: { color: theme.colors.surface, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 15, color: theme.colors.ink, lineHeight: 22 },
  mt: { marginTop: theme.spacing.lg },
});

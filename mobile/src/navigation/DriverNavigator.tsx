import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActiveTripScreen } from '../screens/driver/ActiveTripScreen';
import { BatteryWhitelistScreen } from '../screens/driver/BatteryWhitelistScreen';
import { TodayScreen } from '../screens/driver/TodayScreen';
import { theme } from '../theme/theme';
import { DriverStackParamList } from './types';

const Stack = createNativeStackNavigator<DriverStackParamList>();

export function DriverNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="Today" component={TodayScreen} options={{ title: 'CareVan' }} />
      <Stack.Screen
        name="ActiveTrip"
        component={ActiveTripScreen}
        options={{ title: 'Trip', headerBackVisible: false }}
      />
      <Stack.Screen
        name="BatteryWhitelist"
        component={BatteryWhitelistScreen}
        options={{ title: 'Background permission' }}
      />
    </Stack.Navigator>
  );
}

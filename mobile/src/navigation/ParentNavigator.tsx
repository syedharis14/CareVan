import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChildDetailScreen } from '../screens/parent/ChildDetailScreen';
import { ChildrenScreen } from '../screens/parent/ChildrenScreen';
import { theme } from '../theme/theme';
import { ParentStackParamList } from './types';

const Stack = createNativeStackNavigator<ParentStackParamList>();

export function ParentNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="Children" component={ChildrenScreen} options={{ title: 'CareVan' }} />
      <Stack.Screen name="ChildDetail" component={ChildDetailScreen} options={{ title: 'Live' }} />
    </Stack.Navigator>
  );
}

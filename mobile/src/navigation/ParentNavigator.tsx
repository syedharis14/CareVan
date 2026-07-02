import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChildDetailScreen } from '../screens/parent/ChildDetailScreen';
import { ChildrenScreen } from '../screens/parent/ChildrenScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/theme';
import { Icon } from '../ui';
import { tabBarStyle } from './tabBar';
import { ParentStackParamList, ParentTabParamList } from './types';

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createNativeStackNavigator<ParentStackParamList>();

function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ChildrenScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'person' : 'person-outline'} size={23} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function ParentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={ParentTabs} />
      <Stack.Screen name="ChildDetail" component={ChildDetailScreen} />
    </Stack.Navigator>
  );
}

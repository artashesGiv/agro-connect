import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Icon, type IconName } from '../components/Icon';
import CreateScreen from '../features/create/screens/CreateScreen';
import HomeScreen from '../features/home/screens/HomeScreen';
import MapScreen from '../features/map/screens/MapScreen';
import PlaceholderScreen from '../features/placeholder/screens/PlaceholderScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import { CreateTabButton } from './CreateTabButton';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Partial<
  Record<keyof RootTabParamList, { active: IconName; inactive: IconName }>
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Map: { active: 'map', inactive: 'map-outline' },
  Placeholder: { active: 'help-circle', inactive: 'help-circle-outline' },
  Profile: { active: 'account', inactive: 'account-outline' },
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const set = TAB_ICONS[route.name];
          if (!set) return null;
          return (
            <Icon
              name={focused ? set.active : set.inactive}
              color={color}
              size={size}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Главная', headerShown: false }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Карта', headerShown: true }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          title: 'Создать',
          headerShown: true,
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Placeholder"
        component={PlaceholderScreen}
        options={{ title: '?', headerShown: true }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль', headerShown: true }}
      />
    </Tab.Navigator>
  );
}

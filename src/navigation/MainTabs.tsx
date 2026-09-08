import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Icon, type IconName } from '../components/Icon';
import DataScreen from '../features/data/screens/DataScreen';
import HomeScreen from '../features/home/screens/HomeScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<
  keyof RootTabParamList,
  { active: IconName; inactive: IconName }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Data: { active: 'chart-box', inactive: 'chart-box-outline' },
  Settings: { active: 'cog', inactive: 'cog-outline' },
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const set = TAB_ICONS[route.name];
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
        name="Data"
        component={DataScreen}
        options={{ title: 'Данные', headerShown: true }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Параметры', headerShown: true }}
      />
    </Tab.Navigator>
  );
}

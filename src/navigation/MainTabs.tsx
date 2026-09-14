import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '../components/Icon';
import { useNotifications } from '../features/notifications/NotificationsProvider';
import CreateScreen from '../features/create/screens/CreateScreen';
import HomeScreen from '../features/home/screens/HomeScreen';
import MapScreen from '../features/map/screens/MapScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import QuestionsScreen from '../features/questions/screens/QuestionsScreen';
import { useAppTheme } from '../theme';
import { CreateTabButton } from './CreateTabButton';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Partial<
  Record<keyof RootTabParamList, { active: IconName; inactive: IconName }>
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Map: { active: 'map', inactive: 'map-outline' },
  Questions: { active: 'help-circle', inactive: 'help-circle-outline' },
  Profile: { active: 'account', inactive: 'account-outline' },
};

export function MainTabs() {
  const theme = useAppTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const set = TAB_ICONS[route.name];
          if (!set) return null;
          return (
            <View>
              <Icon
                name={focused ? set.active : set.inactive}
                color={color}
                size={size}
              />
              {route.name === 'Profile' && unreadCount > 0 ? (
                <View
                  style={[
                    styles.badgeDot,
                    { backgroundColor: theme.colors.error, borderColor: theme.colors.surface },
                  ]}
                />
              ) : null}
            </View>
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
        options={{
          title: 'Карта',
          // Хедер рисует сам экран (общий `AppHeader`), нативный выключен.
          headerShown: false,
          // Единственная вкладка с `lazy: false`: WebView с картой поднимается
          // секунду-другую, и делать это в момент перехода значит показывать
          // спиннер каждый раз. Геолокацию и загрузку полей это не трогает —
          // они висят на `useFocusEffect`.
          lazy: false,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          title: 'Создать',
          headerShown: false,
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Questions"
        component={QuestionsScreen}
        options={{ title: 'Вопросы', headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});

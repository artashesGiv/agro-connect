import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import HomeScreen from './src/features/home/screens/HomeScreen';
import DataScreen from './src/features/data/screens/DataScreen';
import SettingsScreen from './src/features/settings/screens/SettingsScreen';
import { Icon, type IconName } from './src/components/Icon';
import { RootTabParamList } from './src/navigation/types';
import { appTheme, navigationTheme } from './src/theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<
  keyof RootTabParamList,
  { active: IconName; inactive: IconName }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Data: { active: 'chart-box', inactive: 'chart-box-outline' },
  Settings: { active: 'cog', inactive: 'cog-outline' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
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
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

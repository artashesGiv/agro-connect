import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import DataScreen from './src/screens/DataScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { RootTabParamList } from './src/navigation/types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabBarIcon({
  name,
  color,
  size = 24,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Data: '📊',
    Settings: '⚙️',
  };
  return <Text style={{ fontSize: size, color }}>{icons[name]}</Text>;
}

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name={route.name} color={color} size={size} />
          ),
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: '#F8FAFC',
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Главная',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Data"
          component={DataScreen}
          options={{
            title: 'Данные',
            headerShown: true,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Параметры',
            headerShown: true,
          }}
        />
      </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  tabBar: {
    backgroundColor: '#111827',
    borderTopColor: '#1E293B',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 64,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  header: {
    backgroundColor: '#111827',
    borderBottomColor: '#1E293B',
    borderBottomWidth: 1,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
});

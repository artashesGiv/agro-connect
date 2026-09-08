import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AuthNavigator } from '../features/auth';
import { useAuth } from '../services/auth';
import { appTheme, navigationTheme } from '../theme';
import { MainTabs } from './MainTabs';

/**
 * Гейт авторизации. Пока `status === 'loading'` — читаем токен из хранилища,
 * держим пустой экран цвета фона. Дальше показываем либо стек логина/регистрации,
 * либо основные табы. Навигатор переключается целиком — без `navigate`.
 */
export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="light" />
      {status === 'authenticated' ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

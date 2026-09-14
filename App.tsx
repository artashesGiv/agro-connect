import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { NotificationsProvider } from './src/features/notifications/NotificationsProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/services/auth';
import { appTheme } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <AuthProvider>
          <NotificationsProvider>
            <RootNavigator />
          </NotificationsProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

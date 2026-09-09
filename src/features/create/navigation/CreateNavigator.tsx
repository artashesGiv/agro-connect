import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { CreateStackParamList } from '@/navigation/types';
import CreateTitleScreen from '../screens/create/CreateTitleScreen';
import CreateBodyScreen from '../screens/create/CreateBodyScreen';
import CreatePhotosScreen from '../screens/create/CreatePhotosScreen';
import CreateFieldScreen from '../screens/create/CreateFieldScreen';
import CreatePreviewScreen from '../screens/create/CreatePreviewScreen';

const Stack = createNativeStackNavigator<CreateStackParamList>();

/**
 * Вложенный стек мастера создания поста. Форма — в `CreatePostProvider` над этим
 * навигатором. `goBack` доступен со второго шага (на первом кнопки нет).
 */
export function CreateNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="CreateTitle" component={CreateTitleScreen} />
      <Stack.Screen name="CreateBody" component={CreateBodyScreen} />
      <Stack.Screen name="CreatePhotos" component={CreatePhotosScreen} />
      <Stack.Screen name="CreateField" component={CreateFieldScreen} />
      <Stack.Screen name="CreatePreview" component={CreatePreviewScreen} />
    </Stack.Navigator>
  );
}

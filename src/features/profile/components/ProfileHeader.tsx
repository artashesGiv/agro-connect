import { Appbar } from 'react-native-paper';

import { useAuth } from '@/services/auth';

/**
 * Шапка вкладки «Профиль» вместо навигационного хедера:
 * колокольчик (уведомления) слева — шестерёнка (настройки) справа.
 * Верхнюю safe-area врезку `Appbar.Header` добавляет сам.
 */
export function ProfileHeader() {
  const { signOut } = useAuth();

  return (
    <Appbar.Header mode="center-aligned">
      <Appbar.Action
        icon="bell-outline"
        onPress={() => {}}
        accessibilityLabel="Уведомления"
      />
      <Appbar.Content title="" />
      {/* TODO: заменить на переход в экран настроек; выход — временно здесь. */}
      <Appbar.Action
        icon="cog-outline"
        onPress={signOut}
        accessibilityLabel="Настройки"
      />
    </Appbar.Header>
  );
}

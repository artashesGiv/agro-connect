import { Appbar } from 'react-native-paper';

import { useAuth } from '@/services/auth';

/**
 * Шапка вкладки «Профиль» вместо навигационного хедера:
 * колокольчик (уведомления) — @имя по центру — шестерёнка (настройки).
 * Верхнюю safe-area врезку `Appbar.Header` добавляет сам.
 */
export function ProfileHeader() {
  const { profile, signOut } = useAuth();
  const handle = profile?.name ?? 'аккаунт';

  return (
    <Appbar.Header mode="center-aligned">
      <Appbar.Action
        icon="bell-outline"
        onPress={() => {}}
        accessibilityLabel="Уведомления"
      />
      <Appbar.Content title={`@${handle}`} />
      {/* TODO: заменить на переход в экран настроек; выход — временно здесь. */}
      <Appbar.Action
        icon="cog-outline"
        onPress={signOut}
        accessibilityLabel="Настройки"
      />
    </Appbar.Header>
  );
}

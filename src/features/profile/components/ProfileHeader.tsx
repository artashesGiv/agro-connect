import { AppHeader } from '@/components/AppHeader';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = {
  navigation: ProfileScreenProps['navigation'];
};

/**
 * Шапка вкладки «Профиль» — общий `AppHeader`: колокольчик (уведомления) слева,
 * шестерёнка (настройки) справа — открывает экран `Settings`. На колокольчике —
 * точка, пока есть непрочитанные уведомления.
 */
export function ProfileHeader({ navigation }: Props) {
  const { unreadCount } = useNotifications();

  return (
    <AppHeader
      title="Профиль"
      centerTitle
      leading={{
        icon: 'bell-outline',
        onPress: () => navigation.navigate('Notifications'),
        accessibilityLabel: 'Уведомления',
        badge: unreadCount > 0,
      }}
      actions={[
        {
          icon: 'cog-outline',
          onPress: () => navigation.navigate('Settings'),
          accessibilityLabel: 'Настройки',
        },
      ]}
    />
  );
}

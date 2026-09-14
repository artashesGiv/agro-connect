import { AppHeader } from '@/components/AppHeader';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = {
  navigation: ProfileScreenProps['navigation'];
};

/**
 * Шапка вкладки «Профиль» — общий `AppHeader`: колокольчик (уведомления) слева,
 * шестерёнка (настройки) справа — открывает экран `Settings`.
 */
export function ProfileHeader({ navigation }: Props) {
  return (
    <AppHeader
      leading={{
        icon: 'bell-outline',
        onPress: () => navigation.navigate('Notifications'),
        accessibilityLabel: 'Уведомления',
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

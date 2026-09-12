import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, List, type MD3Theme } from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';
import type { NotificationsScreenProps } from '@/navigation/types';
import { useAppTheme } from '@/theme';

import {
  MOCK_NOTIFICATIONS,
  NOTIFICATION_ICONS,
  type MockNotification,
} from '../data/mockNotifications';

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

/**
 * Экран уведомлений — полностью моковый: на бэке нет ни таблицы уведомлений,
 * ни Realtime (см. `mockNotifications.ts`). Прочитанность — обычный React
 * state, сбрасывается при перезапуске (данные всё равно фейковые).
 */
export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [items, setItems] = useState<MockNotification[]>(MOCK_NOTIFICATIONS);

  const hasUnread = items.some((item) => !item.read);

  const markRead = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title="Уведомления"
        onBack={navigation.goBack}
        actions={
          hasUnread
            ? [
                {
                  icon: 'check-all',
                  onPress: markAllRead,
                  accessibilityLabel: 'Прочитать все',
                },
              ]
            : []
        }
      />

      {items.length === 0 ? (
        <ScreenPlaceholder text="Уведомлений пока нет" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <Divider /> : null}
              <List.Item
                title={item.title}
                titleStyle={item.read ? undefined : styles.unreadTitle}
                description={`${item.body}\n${formatWhen(item.createdAt)}`}
                descriptionNumberOfLines={3}
                left={(props) => (
                  <List.Icon {...props} icon={NOTIFICATION_ICONS[item.type]} />
                )}
                right={() =>
                  item.read ? null : <View style={styles.unreadDot} />
                }
                onPress={() => markRead(item.id)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingBottom: 24,
    },
    unreadTitle: {
      fontWeight: '700',
    },
    unreadDot: {
      alignSelf: 'center',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
  });

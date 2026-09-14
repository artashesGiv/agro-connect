import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, List, Text, type MD3Theme } from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { Icon, type IconName } from '@/components/Icon';
import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';
import type { NotificationsScreenProps } from '@/navigation/types';
import type { NotificationRow, NotificationType } from '@/services/notifications';
import { useAppTheme } from '@/theme';

import { useNotifications } from '../NotificationsProvider';
import { openNotification } from '../utils/notificationNavigation';

/** Иконка на каждый реально генерируемый бэкендом тип (см. NOTIFICATIONS_FRONTEND.md, п.5/7). */
const NOTIFICATION_ICONS: Record<NotificationType, IconName> = {
  answer_created: 'comment-outline',
  answer_reply: 'comment-arrow-left-outline',
  ai_reply_ready: 'robot-outline',
  ai_reply_failed: 'robot-off-outline',
  weather_alert: 'weather-lightning-rainy',
  reputation_star_up: 'star-outline',
  post_reaction: 'heart-outline',
  answer_vote: 'thumb-up-outline',
  system: 'bullhorn-outline',
};

function iconFor(type: string): IconName {
  return (NOTIFICATION_ICONS as Record<string, IconName>)[type] ?? 'bell-outline';
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

/**
 * Экран уведомлений — реальные данные из `NotificationsProvider` (poll каждые
 * 5с, без Realtime/push — см. план). Тап по строке помечает прочитанным и
 * ведёт к посту/полю/профилю, на которые ссылается уведомление.
 */
export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { notifications, loading, error, refetch } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={styles.root}>
      <AppHeader title="Уведомления" onBack={navigation.goBack} />

      {loading && notifications.length === 0 ? (
        <ActivityIndicator style={styles.loader} />
      ) : error && notifications.length === 0 ? (
        <Text style={styles.stateText}>{error}</Text>
      ) : notifications.length === 0 ? (
        <ScreenPlaceholder text="Уведомлений пока нет" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
          }
        >
          {notifications.map((item, index) => (
            <NotificationRowItem
              key={item.id}
              item={item}
              showDivider={index > 0}
              styles={styles}
              navigation={navigation}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function NotificationRowItem({
  item,
  showDivider,
  styles,
  navigation,
}: {
  item: NotificationRow;
  showDivider: boolean;
  styles: ReturnType<typeof makeStyles>;
  navigation: NotificationsScreenProps['navigation'];
}) {
  const { markRead } = useNotifications();
  const unread = !item.read_at;

  const handlePress = () => {
    if (unread) void markRead(item.id).catch(() => {});
    openNotification(item, navigation);
  };

  return (
    <View>
      {showDivider ? <Divider /> : null}
      <List.Item
        title={item.title}
        titleStyle={unread ? styles.unreadTitle : undefined}
        description={`${item.body}\n${formatWhen(item.created_at)}`}
        descriptionNumberOfLines={3}
        left={(props) => <List.Icon {...props} icon={() => <Icon name={iconFor(item.type)} />} />}
        right={() => (unread ? <View style={styles.unreadDot} /> : null)}
        onPress={handlePress}
      />
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
    loader: {
      marginTop: 32,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      textAlign: 'center',
      marginTop: 32,
      paddingHorizontal: 24,
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

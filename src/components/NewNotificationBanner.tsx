import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Text, type MD3Theme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { useAppTheme } from '@/theme';

const ANIM_DURATION = 200;

type Props = {
  /** Не тянем сюда типы навигации ради одного вызова — достаточно функции. */
  onPress: () => void;
};

/**
 * Компактный баннер сверху экрана — появляется, когда `NotificationsProvider`
 * находит новые непрочитанные уведомления при очередном опросе, сам
 * скрывается через несколько секунд. Рисуется в `RootNavigator` поверх любой
 * вкладки (та же идея, что `OfflineBanner`, но плавающий поверх контента, а
 * не сдвигающий его — баннер временный, а не постоянное состояние).
 */
export function NewNotificationBanner({ onPress }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { bannerVisible, dismissBanner } = useNotifications();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: bannerVisible ? 0 : -80,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: bannerVisible ? 1 : 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bannerVisible, translateY, opacity]);

  const styles = makeStyles(theme);

  return (
    <Animated.View
      pointerEvents={bannerVisible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8, opacity, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        style={styles.banner}
        onPress={() => {
          dismissBanner();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Новое уведомление"
      >
        <Icon name="bell-ring-outline" size={18} color={theme.colors.onPrimary} />
        <Text style={styles.text}>Новое уведомление</Text>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 50,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
    },
    text: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
  });

import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppTheme } from '@/theme';

import { Icon } from './Icon';

/**
 * Тонкая полоса над всем приложением (монтируется в `RootNavigator`, ДО
 * `NavigationContainer` — видна на любой вкладке), пока нет сети. Рисуется
 * первой в обычном потоке (не `position: absolute`), поэтому сама себе
 * добавляет верхнюю safe-area врезку — приложение edge-to-edge, и без нее
 * текст полосы попадал бы под системную строку состояния. Ничего не
 * рендерит, когда есть подключение — не занимает места в layout.
 */
export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: theme.colors.errorContainer, paddingTop: insets.top + 6 },
      ]}
    >
      <Icon name="wifi-off" size={14} color={theme.colors.onErrorContainer} />
      <Text style={[styles.text, { color: theme.colors.onErrorContainer }]}>
        Нет подключения — показаны сохранённые данные
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

import { Icon } from '../components/Icon';
import { useAppTheme } from '../theme';

/**
 * Центральная кнопка навбара — крупный круглый «+». В одну линию с остальными
 * вкладками (без выступа над панелью).
 */
export function CreateTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={(event: GestureResponderEvent) => onPress?.(event)}
        accessibilityRole="button"
        accessibilityLabel="Создать"
        accessibilityState={accessibilityState}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.colors.primary },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="plus" color={theme.colors.onPrimary} size={30} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});

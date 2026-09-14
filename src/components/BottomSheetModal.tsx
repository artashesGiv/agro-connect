import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

const ANIM_DURATION = 220;
const BACKDROP_OPACITY = 0.4;

/**
 * Лист, выезжающий снизу — общая замена `Dialog`/самодельным `Modal` там, где
 * нужен именно bottom sheet. Рендерится через Paper `Portal` (тот же слой,
 * что `Dialog`/`Menu`/`ConfirmDialog`), а не через нативный RN `Modal`: у
 * `Modal` свой отдельный нативный layer поверх всего приложения, и вложенные
 * Paper-компоненты со своим `Portal` (например `Menu` из «⋮» внутри контента)
 * рендерятся в общий `Portal.Host`, а не в этот layer — их не видно и по ним
 * не кликается. `Portal` держит всё в одном дереве, поэтому вложенные меню
 * работают как обычно. Аппаратную кнопку «назад» на Android эмулируем сами
 * через `BackHandler` — её раньше давал `Modal` бесплатно.
 *
 * Фон и лист анимируются **раздельно** (`Animated.parallel`, оба — прямые
 * соседние элементы, не один внутри другого) — иначе тёмная подложка
 * визуально «едет» вместе с листом вместо мгновенного fade. Ручки-«потяни»
 * специально нет — перетаскивания в списке всё равно нет, рисовать
 * несуществующий жест не нужно.
 */
export function BottomSheetModal({ visible, onClose, children, contentStyle }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Монтирует лист (если ещё не смонтирован) — саму анимацию не трогает.
  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  // Стартует анимацию только когда лист уже в дереве: если запустить
  // `Animated.timing` в том же эффекте, что и `setMounted(true)`, на этот
  // момент `Animated.View` ещё не существует — `useNativeDriver` не может
  // подключиться, и лист «телепортируется» вместо честного слайда.
  useEffect(() => {
    if (!mounted) return;

    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: BACKDROP_OPACITY,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [mounted, visible, screenHeight, backdropOpacity, translateY]);

  // `Modal` ловил аппаратную кнопку «назад» сам через `onRequestClose` —
  // без него делаем то же самое вручную, только пока лист открыт.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  if (!mounted) return null;

  return (
    <Portal>
      <Pressable
        style={styles.backdropTouchable}
        onPress={onClose}
        accessibilityLabel="Закрыть"
      >
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </Pressable>

      <Animated.View
        style={[styles.sheetPosition, { transform: [{ translateY }] }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: insets.bottom + 16,
              maxHeight: screenHeight * 0.75,
            },
            contentStyle,
          ]}
          onPress={() => {}}
        >
          {children}
        </Pressable>
      </Animated.View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  sheetPosition: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});

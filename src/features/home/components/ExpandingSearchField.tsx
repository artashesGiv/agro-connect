import { useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  TextInput as RNTextInput,
} from 'react-native';
import { type MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

type Props = {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  /** Заголовок, показываемый вместо поля, пока оно свёрнуто. */
  title: string;
};

const ANIM_DURATION = 200;
/** Фиксированный сдвиг въезда/выезда — без зависимости от измеренной ширины
 *  контейнера (та зависимость и была источником бага "поле не видно"). */
const SLIDE_DISTANCE = 24;

/**
 * «Въезжающее» поле поиска внутри `AppHeader` (через `titleSlot`): заголовок
 * всегда на месте, поле поверх него въезжает/выезжает через `Animated.timing`
 * (`opacity` + фиксированный `translateX`, оба native-driver-совместимые).
 * Обычный RN `TextInput`, а не Paper — у Paper-инпута своя внутренняя
 * раскладка под плавающий label, которая не обязана уместиться в жёсткую
 * высоту хедера.
 */
export function ExpandingSearchField({ visible, value, onChangeText, title }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start();

    if (visible) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [visible, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SLIDE_DISTANCE, 0],
  });
  const titleOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <Animated.View style={styles.root}>
      <Animated.Text
        style={[styles.title, { opacity: titleOpacity }]}
        numberOfLines={1}
      >
        {title}
      </Animated.Text>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.overlay,
          { opacity: progress, transform: [{ translateX }] },
        ]}
      >
        <RNTextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="Поиск по постам"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={styles.input}
        />
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignSelf: 'stretch',
      height: 40,
      paddingLeft: 16,
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
      paddingVertical: 0,
    },
  });

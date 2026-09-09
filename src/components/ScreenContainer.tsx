import { useMemo, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme';

type ScreenContainerProps = {
  children: ReactNode;
  /** Обернуть контент в `ScrollView` (для форм и длинного контента). */
  scroll?: boolean;
  /** Обернуть в `KeyboardAvoidingView` — активное поле не уходит под клавиатуру. */
  keyboardAvoiding?: boolean;
  /**
   * Какие края учитывать под системные врезки. По умолчанию верх и низ —
   * для экранов без навигационного хедера и без таб-бара (логин, регистрация).
   * Таб-экраны с хедером/таб-баром передают `['top']` или `[]`.
   */
  edges?: readonly Edge[];
  /** Стиль контента: `contentContainerStyle` у `ScrollView` либо стиль корневого `View`. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Единая оболочка экрана: фон темы + safe-area врезки (edge-to-edge на Android
 * всегда включён) + опциональные `ScrollView` / `KeyboardAvoidingView`.
 * Экраны не задают отступ под статус-бар руками — только через этот компонент.
 */
export function ScreenContainer({
  children,
  scroll = false,
  keyboardAvoiding = false,
  edges = ['top', 'bottom'],
  contentContainerStyle,
  style,
}: ScreenContainerProps) {
  const theme = useAppTheme();
  const rootStyle = useMemo(
    () => [
      styles.root,
      { backgroundColor: theme.colors.background },
      style,
    ],
    [theme, style],
  );

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={rootStyle}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView behavior="height" style={styles.flex}>
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

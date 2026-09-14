import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, type MD3Theme } from 'react-native-paper';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme';

export type ComposerEditing = { id: string; initialText: string } | null;
export type ComposerReplyTo = { id: string; authorName: string } | null;

type Props = {
  editing: ComposerEditing;
  /** Не null исключает `editing` — экран держит их взаимоисключающими. */
  replyTo: ComposerReplyTo;
  submitting: boolean;
  /** Плейсхолдер поля («Комментарий» / «Ответить»). */
  placeholder: string;
  /** Подпись кнопки в режиме создания («Отправить» / «Ответить»). */
  submitLabel: string;
  /** Текст баннера в режиме правки («Редактирование комментария» / «…ответа»). */
  editingLabel: string;
  /** Возвращает `true`, если отправка прошла успешно (тогда поле очищается). */
  onSubmit: (text: string) => Promise<boolean>;
  onCancelEdit: () => void;
  onCancelReply: () => void;
};

/**
 * Прибитое к низу PostDetail поле ввода. Три режима: новый комментарий,
 * ответ на конкретный комментарий (баннер «Ответ для …») и правка своего
 * (текст подставляется, кнопка → «Сохранить», баннер «Редактирование…»).
 */
export function CommentComposer({
  editing,
  replyTo,
  submitting,
  placeholder,
  submitLabel,
  editingLabel,
  onSubmit,
  onCancelEdit,
  onCancelReply,
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [text, setText] = useState('');

  // Вход/выход из режима правки перезаливает поле.
  useEffect(() => {
    setText(editing ? editing.initialText : '');
  }, [editing]);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !submitting;

  const handleSend = async () => {
    const ok = await onSubmit(trimmed);
    // В режиме правки успех уводит editing → null, и текст очистит эффект.
    if (ok && !editing) setText('');
  };

  return (
    <View style={styles.wrap}>
      {editing ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{editingLabel}</Text>
          <Pressable
            onPress={onCancelEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Отмена"
          >
            <Icon name="close" size={16} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        </View>
      ) : replyTo ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText} numberOfLines={1}>
            Ответ для {replyTo.authorName}
          </Text>
          <Pressable
            onPress={onCancelReply}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Отмена"
          >
            <Icon name="close" size={16} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          style={styles.input}
        />
        <Button
          mode="contained"
          compact
          disabled={!canSend}
          loading={submitting}
          onPress={handleSend}
        >
          {editing ? 'Сохранить' : submitLabel}
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    wrap: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outline,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingBottom: 6,
    },
    bannerText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    input: {
      flex: 1,
    },
  });

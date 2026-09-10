import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, type MD3Theme } from 'react-native-paper';

import { Icon, type IconName } from './Icon';
import { useAppTheme } from '@/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Иконка над заголовком; без неё диалог просто текстовый. */
  icon?: IconName;
  /** Красит подтверждение в цвет ошибки — для необратимых действий. */
  destructive?: boolean;
  loading?: boolean;
  /** Ошибка операции показывается здесь же: снекбар ушёл бы под диалог. */
  error?: string | null;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/**
 * Подтверждение необратимого действия в стиле приложения, а не системный
 * `Alert`: тот игнорирует тему и на Android выглядит чужеродно.
 *
 * Пока идёт операция, диалог не закрывается ни кнопкой, ни тапом по фону —
 * иначе можно уйти, не узнав, чем кончилось.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  icon,
  destructive = false,
  loading = false,
  error = null,
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const confirmColor = destructive ? theme.colors.error : theme.colors.primary;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={loading ? () => {} : onCancel}
        dismissable={!loading}
      >
        {icon ? (
          <Dialog.Icon icon={() => <Icon name={icon} size={24} color={confirmColor} />} />
        ) : null}
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.message}>{message}</Text>
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            onPress={() => void onConfirm()}
            loading={loading}
            disabled={loading}
            textColor={confirmColor}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    title: {
      textAlign: 'center',
    },
    message: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

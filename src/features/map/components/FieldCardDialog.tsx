import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, type MD3Theme, Portal } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import type { Field } from '../repository/fieldsRepository';

type FieldCardDialogProps = {
  field: Field | null;
  onClose: () => void;
  onEditInfo: () => void;
  onEditGeometry: () => void;
};

/**
 * Карточка поля по тапу на карте: что это за поле и что с ним можно сделать.
 * Правка разведена на две кнопки, потому что это две разные операции —
 * одна правит строку в базе, другая возвращает на карту в режим рисования.
 */
export function FieldCardDialog({
  field,
  onClose,
  onEditInfo,
  onEditGeometry,
}: FieldCardDialogProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Portal>
      <Dialog visible={field !== null} onDismiss={onClose}>
        <Dialog.Title>{field?.name ?? ''}</Dialog.Title>
        <Dialog.Content>
          <Row label="Регион" value={field?.region ?? 'не указан'} styles={styles} />
          <Row
            label="Границы"
            value={field?.boundary ? `контур, ${field.boundary.length} точек` : 'только точка'}
            styles={styles}
          />
          <Row label="Создано" value={formatDate(field?.created_at)} styles={styles} />
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={onEditGeometry}>Координаты</Button>
          <Button onPress={onEditInfo}>Название и регион</Button>
          <Button mode="contained" onPress={onClose}>
            Закрыть
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

/** Дата в локальном формате; на кривой строке из базы не падаем. */
function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU');
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
      paddingVertical: 4,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    value: {
      color: theme.colors.onSurface,
      fontSize: 14,
      flexShrink: 1,
      textAlign: 'right',
    },
    actions: {
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
  });

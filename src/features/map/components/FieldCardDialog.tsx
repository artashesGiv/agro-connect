import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, type MD3Theme, Portal } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import type { Field } from '@/services/fields';

type FieldCardDialogProps = {
  field: Field | null;
  /** Своё поле — можно править и удалять; чужое — только просмотр + владелец. */
  isMine: boolean;
  onClose: () => void;
  onEditInfo: () => void;
  onEditCrops: () => void;
  onEditGeometry: () => void;
  onDelete: () => void;
  onViewOwner: () => void;
};

/**
 * Карточка поля по тапу на карте: что это за поле и что с ним можно сделать.
 * Отдельные действия для культур, названия/региона, геометрии и удаления —
 * но только для своего поля. Карточка чужого поля показывает те же сведения
 * плюс строку с владельцем и кнопку «Профиль» — но ни одной кнопки правки: у
 * чужого поля нельзя ни менять данные, ни удалить его.
 */
export function FieldCardDialog({
  field,
  isMine,
  onClose,
  onEditInfo,
  onEditCrops,
  onEditGeometry,
  onDelete,
  onViewOwner,
}: FieldCardDialogProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Portal>
      <Dialog visible={field !== null} onDismiss={onClose}>
        <Dialog.Title>{field?.name ?? ''}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {!isMine ? (
              <Row label="Владелец" value={field?.owner?.name ?? 'без имени'} styles={styles} />
            ) : null}
            <Row label="Регион" value={field?.region ?? 'не указан'} styles={styles} />
            <Row
              label="Границы"
              value={field?.boundary ? `контур, ${field.boundary.length} точек` : 'только точка'}
              styles={styles}
            />
            <Row
              label="Культуры"
              value={field?.crops.map((crop) => crop.name).join(', ') || 'не выбраны'}
              styles={styles}
            />
            <Row label="Основная культура" value={field?.current_crop?.name ?? 'не указана'} styles={styles} />
            <Row label="Создано" value={formatDate(field?.created_at)} styles={styles} />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.actions}>
          {isMine
            ? [
                <Button key="delete" textColor={theme.colors.error} onPress={onDelete}>
                  Удалить
                </Button>,
                <Button
                  key="crops"
                  onPress={onEditCrops}
                  accessibilityLabel="Изменить культуры поля"
                >
                  Культуры
                </Button>,
                <Button key="geometry" onPress={onEditGeometry}>
                  Координаты
                </Button>,
                <Button key="info" onPress={onEditInfo}>
                  Название и регион
                </Button>,
              ]
            : (
                <Button onPress={onViewOwner}>Профиль</Button>
              )}
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
    scrollArea: {
      maxHeight: 320,
    },
    scrollContent: {
      paddingVertical: 12,
    },
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

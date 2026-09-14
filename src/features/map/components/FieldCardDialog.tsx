import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  Menu,
  Text,
  type MD3Theme,
  Portal,
} from 'react-native-paper';

import { Icon } from '@/components/Icon';
import { dictionaries, type PostStage } from '@/services/supabase';
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
  onEditStage: () => void;
  onDelete: () => void;
  onViewOwner: () => void;
  onRelatedPosts: () => void;
};

/**
 * Карточка поля по тапу на карте: что это за поле и что с ним можно сделать.
 * Своё поле — «⋮» у заголовка открывает меню редактирования (культуры,
 * координаты, название/регион, удаление красным) — тот же приём, что меню
 * «Редактировать/Удалить» в `PostCard`. Внизу — только «Связанные посты» и
 * «Закрыть», без разнобоя из полудюжины кнопок. Карточка чужого поля — те же
 * сведения плюс строка с владельцем и кнопка «Профиль», без «⋮»: у чужого
 * поля нечего редактировать.
 */
export function FieldCardDialog({
  field,
  isMine,
  onClose,
  onEditInfo,
  onEditCrops,
  onEditGeometry,
  onEditStage,
  onDelete,
  onViewOwner,
  onRelatedPosts,
}: FieldCardDialogProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stages, setStages] = useState<PostStage[]>([]);

  // Справочник маленький (5 строк) и не критичен: не находим имя — просто
  // покажем «стадия #N» вместо падения карточки.
  useEffect(() => {
    let active = true;
    dictionaries.getPostStages().then((data) => {
      if (active) setStages(data);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const stageName = field?.current_stage_id
    ? stages.find((s) => s.id === field.current_stage_id)?.name ?? `стадия #${field.current_stage_id}`
    : 'не указан';

  return (
    <Portal>
      <Dialog visible={field !== null} onDismiss={onClose}>
        <View style={styles.header}>
          <Text
            variant="headlineSmall"
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {field?.name ?? ''}
          </Text>
          {isMine ? (
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              contentStyle={styles.menuContent}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuOpen(true)}
                  accessibilityLabel="Действия с полем"
                />
              }
            >
              <Menu.Item
                leadingIcon={() => (
                  <Icon name="sprout-outline" size={20} color={theme.colors.onSurface} />
                )}
                title="Культуры"
                titleStyle={styles.menuItemText}
                onPress={() => {
                  setMenuOpen(false);
                  onEditCrops();
                }}
              />
              <Menu.Item
                leadingIcon={() => (
                  <Icon name="vector-polygon" size={20} color={theme.colors.onSurface} />
                )}
                title="Координаты"
                titleStyle={styles.menuItemText}
                onPress={() => {
                  setMenuOpen(false);
                  onEditGeometry();
                }}
              />
              <Menu.Item
                leadingIcon={() => (
                  <Icon name="progress-check" size={20} color={theme.colors.onSurface} />
                )}
                title="Статус"
                titleStyle={styles.menuItemText}
                onPress={() => {
                  setMenuOpen(false);
                  onEditStage();
                }}
              />
              <Menu.Item
                leadingIcon={() => (
                  <Icon name="pencil-outline" size={20} color={theme.colors.onSurface} />
                )}
                title="Название и регион"
                titleStyle={styles.menuItemText}
                onPress={() => {
                  setMenuOpen(false);
                  onEditInfo();
                }}
              />
              <Menu.Item
                leadingIcon={() => (
                  <Icon name="trash-can-outline" size={20} color={theme.colors.error} />
                )}
                title="Удалить"
                titleStyle={styles.menuItemDanger}
                onPress={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              />
            </Menu>
          ) : null}
          <IconButton icon="close" onPress={onClose} accessibilityLabel="Закрыть" />
        </View>
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
            <Row label="Статус" value={stageName} styles={styles} />
            <Row label="Создано" value={formatDate(field?.created_at)} styles={styles} />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.actions}>
          {isMine ? (
            <Button onPress={onRelatedPosts}>Связанные посты</Button>
          ) : (
            <Button onPress={onViewOwner}>Профиль</Button>
          )}
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
      <RNText style={styles.label}>{label}</RNText>
      <RNText style={styles.value}>{value}</RNText>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 24,
      paddingRight: 12,
      marginBottom: 16,
    },
    headerTitle: {
      flex: 1,
      color: theme.colors.onSurface,
    },
    menuContent: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    menuItemText: {
      color: theme.colors.onSurface,
    },
    menuItemDanger: {
      color: theme.colors.error,
    },
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
      justifyContent: 'flex-end',
    },
  });

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  List,
  Text,
  type MD3Theme,
} from 'react-native-paper';

import type { Field } from '@/services/fields';
import { useAppTheme } from '@/theme';

type Props = {
  fields: Field[];
  loading: boolean;
  error: string | null;
  /** Свой профиль — можно добавлять/править/удалять; чужой — только просмотр. */
  editable: boolean;
  onOpen: (fieldId: string | null, withCard: boolean) => void;
  onDelete?: (field: Field) => void;
};

/**
 * Секция «Поля» на профиле: список полей, тап по строке — переход на карту.
 * Для своего профиля (`editable`) — кнопка «+» в шапке и карандаш/корзина на
 * каждой строке; для чужого — только просмотр, без единого действия правки.
 */
export function FieldsSection({ fields, loading, error, editable, onOpen, onDelete }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (error) return <Text style={styles.stateText}>{error}</Text>;
  if (loading && fields.length === 0) return <ActivityIndicator style={styles.loader} />;

  if (fields.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {editable
            ? 'Полей пока нет. Добавьте первое — карта откроется на вашем местоположении.'
            : 'У пользователя нет полей.'}
        </Text>
        {editable ? (
          <Button
            mode="contained"
            icon="plus"
            onPress={() => onOpen(null, false)}
            accessibilityLabel="Добавить поле на карте"
          >
            Добавить поле
          </Button>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      {editable ? (
        <View style={styles.fieldsHeader}>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => onOpen(null, false)}
            accessibilityLabel="Добавить поле на карте"
          />
        </View>
      ) : null}
      {fields.map((field, index) => (
        <View key={field.id}>
          {index > 0 ? <Divider /> : null}
          <List.Item
            title={field.name}
            description={describe(field)}
            onPress={() => onOpen(field.id, false)}
            right={
              editable
                ? () => (
                    <View style={styles.itemActions}>
                      <IconButton
                        icon="pencil-outline"
                        size={20}
                        onPress={() => onOpen(field.id, true)}
                        accessibilityLabel={`Редактировать поле ${field.name}`}
                      />
                      <IconButton
                        icon="trash-can-outline"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => onDelete?.(field)}
                        accessibilityLabel={`Удалить поле ${field.name}`}
                      />
                    </View>
                  )
                : undefined
            }
          />
        </View>
      ))}
    </View>
  );
}

/** Вторая строка в списке: чем поле описано, тем и описываем. */
function describe(field: Field): string {
  const shape = field.boundary ? `контур, ${field.boundary.length} точек` : 'точка';
  return field.region ? `${field.region} · ${shape}` : shape;
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    loader: {
      marginTop: 32,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 32,
      paddingHorizontal: 24,
    },
    fieldsHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingRight: 4,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    empty: {
      alignItems: 'center',
      gap: 16,
      marginTop: 32,
      paddingHorizontal: 24,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'center',
    },
  });

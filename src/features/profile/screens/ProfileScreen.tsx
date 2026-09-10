import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  type MD3Theme,
  Portal,
  Snackbar,
} from 'react-native-paper';

import { useFields } from '@/hooks/useFields';
import type { ProfileScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { deleteField, type Field } from '@/services/fields';
import { storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile, signOut } = useAuth();
  const { fields, loading, error, reload } = useFields();

  const [pendingDelete, setPendingDelete] = useState<Field | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  // Поля правятся на карте, поэтому список обновляем при каждом возврате.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  // avatar_path хранится в БД, публичный URL строим локально.
  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : null;

  /** Параметры чистим явно: таб помнит их между переходами. */
  const openOnMap = useCallback(
    (field: Field, withCard: boolean) => {
      navigation.navigate('Map', { focusFieldId: field.id, openCard: withCard });
    },
    [navigation],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteField(pendingDelete.id);
      setPendingDelete(null);
      setSnack('Поле удалено');
      await reload();
    } catch (cause) {
      setSnack(toUserMessage(cause));
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, reload]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.info}>
          {avatarUrl ? (
            <Avatar.Image size={72} source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : null}
          <Text style={styles.name}>{profile?.name ?? 'Профиль'}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          {profile?.specialization ? (
            <Text style={styles.meta}>{profile.specialization}</Text>
          ) : null}
          {profile?.region ? <Text style={styles.meta}>{profile.region}</Text> : null}
          <Text style={styles.meta}>{`Репутация: ${profile?.reputation ?? 0}`}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Мои поля</Text>
          {fields.length > 0 ? (
            <IconButton
              icon="plus"
              size={20}
              onPress={() => navigation.navigate('Map', { focusFieldId: undefined })}
              accessibilityLabel="Добавить поле на карте"
            />
          ) : null}
        </View>

        {loading && fields.length === 0 ? (
          <ActivityIndicator style={styles.listState} color={theme.colors.primary} />
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && fields.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Полей пока нет. Добавьте первое — карта откроется на вашем
              местоположении.
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate('Map', { focusFieldId: undefined })}
              accessibilityLabel="Добавить поле на карте"
            >
              Добавить поле
            </Button>
          </View>
        ) : null}

        {fields.map((field, index) => (
          <View key={field.id}>
            {index > 0 ? <Divider /> : null}
            <List.Item
              title={field.name}
              description={describe(field)}
              onPress={() => openOnMap(field, false)}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
              right={() => (
                <View style={styles.itemActions}>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    onPress={() => openOnMap(field, true)}
                    accessibilityLabel={`Редактировать поле ${field.name}`}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => setPendingDelete(field)}
                    accessibilityLabel={`Удалить поле ${field.name}`}
                  />
                </View>
              )}
            />
          </View>
        ))}

        <Button
          mode="contained"
          buttonColor={theme.colors.errorContainer}
          textColor={theme.colors.onErrorContainer}
          onPress={signOut}
          style={styles.signOutButton}
          accessibilityLabel="Выйти из аккаунта"
        >
          Выйти
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={pendingDelete !== null}
          onDismiss={deleting ? () => {} : () => setPendingDelete(null)}
          dismissable={!deleting}
        >
          <Dialog.Title>Удалить поле?</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.meta}>
              {`«${pendingDelete?.name ?? ''}» будет удалено безвозвратно.`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingDelete(null)} disabled={deleting}>
              Отмена
            </Button>
            <Button
              onPress={() => void confirmDelete()}
              loading={deleting}
              disabled={deleting}
              textColor={theme.colors.error}
            >
              Удалить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={snack !== null} onDismiss={() => setSnack(null)} duration={4000}>
        {snack ?? ''}
      </Snackbar>
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
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    info: {
      marginBottom: 24,
    },
    name: {
      color: theme.colors.onBackground,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 8,
    },
    email: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },
    meta: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 4,
    },
    avatar: {
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: theme.colors.onBackground,
      fontSize: 18,
      fontWeight: '700',
    },
    listState: {
      marginVertical: 16,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      marginVertical: 12,
    },
    empty: {
      alignItems: 'flex-start',
      gap: 12,
      marginTop: 8,
      marginBottom: 16,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
    },
    itemTitle: {
      color: theme.colors.onBackground,
    },
    itemDescription: {
      color: theme.colors.onSurfaceVariant,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    signOutButton: {
      marginTop: 'auto',
    },
  });

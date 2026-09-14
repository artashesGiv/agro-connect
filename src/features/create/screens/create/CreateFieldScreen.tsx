import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useFormContext, useWatch } from 'react-hook-form';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  List,
  Menu,
  Text,
  type MD3Theme,
} from 'react-native-paper';

import { Icon } from '@/components/Icon';
import { useFields } from '@/hooks/useFields';
import type { CreateFieldScreenProps, RootTabParamList } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { dictionaries, type PostStage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { CreateStepLayout } from '../../components/CreateStepLayout';
import type { CreatePostFormValues } from '../../schemas/createPostSchema';

type FieldOption = { id: string | null; name: string; description?: string };

export default function CreateFieldScreen({ navigation }: CreateFieldScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { control, setValue } = useFormContext<CreatePostFormValues>();
  const fieldId = useWatch({ control, name: 'fieldId' });
  const stageId = useWatch({ control, name: 'stageId' });
  const { user } = useAuth();
  const { fields: allFields, loading, error, reload } = useFields();
  const [stages, setStages] = useState<PostStage[]>([]);
  const [stageMenuOpen, setStageMenuOpen] = useState(false);

  useEffect(() => {
    dictionaries.getPostStages().then(setStages).catch(() => {});
  }, []);
  // «Проблема» временно скрыта из выбора — но имя уже выставленного статуса
  // (`currentStageName` ниже) резолвится из полного `stages`, не отсюда.
  const selectableStages = useMemo(
    () => stages.filter((stage) => stage.code !== 'problem'),
    [stages],
  );
  // `useFields` возвращает все поля (SELECT на `fields` публичный — нужен карте),
  // а привязать пост можно только к своему полю (это же проверяет RLS на posts).
  const fields = useMemo(
    () => allFields.filter((field) => field.owner_id === user?.id),
    [allFields, user?.id],
  );

  // Список — маленький и без пагинации; освежаем при каждом возврате на шаг
  // (например, после добавления поля на карте).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const select = (id: string | null) => {
    setValue('fieldId', id, { shouldDirty: true });
    const selectedField = id ? fields.find((field) => field.id === id) : null;
    setValue('stageId', selectedField?.current_stage_id ?? null, { shouldDirty: true });
    setStageMenuOpen(false);
  };

  const currentStageName = stageId === null
    ? 'Не указан'
    : stages.find((stage) => stage.id === stageId)?.name ?? 'Не указан';

  const openMap = () => {
    navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()?.navigate('Map');
  };

  const options: FieldOption[] = [
    { id: null, name: 'Без поля' },
    ...fields.map((field) => ({
      id: field.id,
      name: field.name,
      description: field.region ?? undefined,
    })),
  ];

  return (
    <CreateStepLayout
      step={3}
      title="Поле"
      subtitle="К какому полю относится пост — необязательно."
      onBack={navigation.goBack}
      onNext={() => navigation.navigate('CreatePreview')}
    >
      {loading && fields.length === 0 ? (
        <ActivityIndicator style={styles.loader} />
      ) : error ? (
        <Text style={styles.stateText}>{error}</Text>
      ) : fields.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="map-outline" size={28} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyText}>
            У вас пока нет полей. Пост можно опубликовать без привязки или сначала
            добавить поле на карте.
          </Text>
          <Button
            mode="outlined"
            icon="plus"
            onPress={openMap}
            accessibilityLabel="Добавить поле на карте"
          >
            Добавить поле
          </Button>
        </View>
      ) : (
        <View>
          {options.map((option, index) => {
            const selected = option.id === fieldId;
            return (
              <View key={option.id ?? '__none__'}>
                {index > 0 ? <Divider /> : null}
                <List.Item
                  title={option.name}
                  description={option.description}
                  onPress={() => select(option.id)}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={selected ? 'radiobox-marked' : 'radiobox-blank'}
                      color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                  )}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                />
                {selected && option.id !== null ? (
                  <Menu
                    visible={stageMenuOpen}
                    onDismiss={() => setStageMenuOpen(false)}
                    contentStyle={styles.stageMenuContent}
                    anchor={
                      <Chip
                        icon="chevron-down"
                        onPress={() => setStageMenuOpen(true)}
                        style={styles.stageChip}
                      >
                        {`Статус: ${currentStageName}`}
                      </Chip>
                    }
                  >
                    <Menu.Item
                      title="Не указано"
                      onPress={() => {
                        setValue('stageId', null, { shouldDirty: true });
                        setStageMenuOpen(false);
                      }}
                    />
                    {selectableStages.map((stage) => (
                      <Menu.Item
                        key={stage.id}
                        title={stage.name}
                        onPress={() => {
                          setValue('stageId', stage.id, { shouldDirty: true });
                          setStageMenuOpen(false);
                        }}
                      />
                    ))}
                  </Menu>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </CreateStepLayout>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    loader: {
      marginTop: 16,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      textAlign: 'center',
    },
    stageChip: {
      alignSelf: 'flex-start',
      marginLeft: 16,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
    },
    stageMenuContent: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    empty: {
      alignItems: 'center',
      gap: 12,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

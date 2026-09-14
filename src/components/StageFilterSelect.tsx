import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip, Menu, type MD3Theme } from 'react-native-paper';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme';
import type { PostStage } from '@/services/supabase';

type Props = {
  stages: PostStage[];
  value: number[];
  onChange: (ids: number[]) => void;
};

function summarize(stages: PostStage[], value: number[]): string {
  if (value.length === 0) return 'Статус';
  if (value.length === 1) {
    return stages.find((stage) => stage.id === value[0])?.name ?? 'Статус';
  }
  return `Статус (${value.length})`;
}

/**
 * Селект-мультивыбор по статусу (стадии) поста: чип-триггер + всплывающее
 * `Menu` — точная копия паттерна `CropFilterSelect.tsx`, только по `post_stages`.
 */
export function StageFilterSelect({ stages, value, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  if (stages.length === 0) return null;

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      contentStyle={styles.menuContent}
      anchor={
        <Chip
          icon="chevron-down"
          selected={value.length > 0}
          onPress={() => setOpen(true)}
          style={styles.chip}
        >
          {summarize(stages, value)}
        </Chip>
      }
    >
      <ScrollView style={styles.scrollArea}>
        {value.length > 0 ? (
          <Menu.Item title="Сбросить всё" onPress={() => onChange([])} />
        ) : null}
        {stages.map((stage) => {
          const checked = value.includes(stage.id);
          return (
            <Menu.Item
              key={stage.id}
              leadingIcon={() => (
                <Icon
                  name={checked ? 'check-circle' : 'circle-outline'}
                  size={20}
                  color={checked ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              )}
              title={stage.name}
              titleStyle={styles.menuItemText}
              onPress={() => toggle(stage.id)}
            />
          );
        })}
      </ScrollView>
    </Menu>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    chip: {
      alignSelf: 'flex-start',
      marginLeft: 6,
      marginRight: 16,
      marginVertical: 8,
      backgroundColor: theme.colors.surface,
    },
    menuContent: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    scrollArea: {
      maxHeight: 320,
    },
    menuItemText: {
      color: theme.colors.onSurface,
    },
  });

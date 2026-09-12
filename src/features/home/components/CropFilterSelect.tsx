import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip, Menu, type MD3Theme } from 'react-native-paper';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme';

import type { CropOption } from '../hooks/useCrops';

type Props = {
  crops: CropOption[];
  value: number[];
  onChange: (ids: number[]) => void;
};

function summarize(crops: CropOption[], value: number[]): string {
  if (value.length === 0) return 'Культура';
  if (value.length === 1) {
    return crops.find((crop) => crop.id === value[0])?.name ?? 'Культура';
  }
  return `Культура (${value.length})`;
}

/**
 * Селект-мультивыбор по культуре: чип-триггер + всплывающее `Menu` рядом с ним
 * (тот же приём, что попап реакций по кнопке лайка — `ReactionControl.tsx`).
 * В отличие от него тап по пункту не закрывает меню — реакция там одна, тут
 * можно отметить несколько культур подряд.
 */
export function CropFilterSelect({ crops, value, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  if (crops.length === 0) return null;

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
          {summarize(crops, value)}
        </Chip>
      }
    >
      <ScrollView style={styles.scrollArea}>
        {value.length > 0 ? (
          <Menu.Item title="Сбросить всё" onPress={() => onChange([])} />
        ) : null}
        {crops.map((crop) => {
          const checked = value.includes(crop.id);
          return (
            <Menu.Item
              key={crop.id}
              leadingIcon={() => (
                <Icon
                  name={checked ? 'check-circle' : 'circle-outline'}
                  size={20}
                  color={checked ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              )}
              title={crop.name}
              titleStyle={styles.menuItemText}
              onPress={() => toggle(crop.id)}
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
      marginHorizontal: 16,
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

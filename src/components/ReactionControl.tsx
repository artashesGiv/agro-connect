import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Menu, Text, type MD3Theme } from 'react-native-paper';

import type { ReactionSummary } from '@/types/reactions';
import { useAppTheme } from '@/theme';
import { Icon } from './Icon';

type Props = {
  reactions: ReactionSummary[];
  /** `code` тапнутого типа. Если он уже стоял — экран трактует как снятие. */
  onToggle: (code: string) => void;
  disabled?: boolean;
};

/**
 * Кнопка реакций в ряду действий поста. Реакция эксклюзивна: за раз активен
 * не больше одного типа. Тап по кнопке открывает Paper `Menu` со всеми
 * активными типами и счётчиками; список приходит из справочника, поэтому новый
 * тип реакции на бэке появляется здесь сам.
 */
export function ReactionControl({ reactions, onToggle, disabled }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  const mine = reactions.find((r) => r.mine) ?? null;
  const total = reactions.reduce((sum, r) => sum + r.count, 0);

  const accent = mine ? theme.colors.primary : theme.colors.onSurfaceVariant;

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      contentStyle={styles.menuContent}
      anchor={
        <Pressable
          onPress={() => setOpen(true)}
          disabled={disabled}
          hitSlop={6}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={mine ? `Ваша реакция: ${mine.name}` : 'Поставить реакцию'}
          accessibilityState={{ selected: Boolean(mine), disabled: Boolean(disabled) }}
        >
          <Icon name={mine ? 'thumb-up' : 'thumb-up-outline'} size={18} color={accent} />
          {total > 0 ? (
            <Text style={[styles.count, { color: accent }]}>{total}</Text>
          ) : null}
        </Pressable>
      }
    >
      {reactions.map((reaction) => (
        <Menu.Item
          key={reaction.code}
          leadingIcon={() => (
            <Icon
              name={reaction.mine ? 'check-circle' : 'circle-outline'}
              size={20}
              color={reaction.mine ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          )}
          title={`${reaction.name} · ${reaction.count}`}
          titleStyle={styles.menuItemText}
          onPress={() => {
            setOpen(false);
            onToggle(reaction.code);
          }}
        />
      ))}
    </Menu>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    trigger: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pressed: {
      opacity: 0.6,
    },
    count: {
      fontSize: 13,
      fontWeight: '600',
    },
    menuContent: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    menuItemText: {
      color: theme.colors.onSurface,
    },
  });

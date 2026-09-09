import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

import { Icon, type IconName } from '../../../components/Icon';
import { useAppTheme } from '../../../theme';

export type ProfileSection = 'posts' | 'bookmarks';

type Props = {
  value: ProfileSection;
  onChange: (section: ProfileSection) => void;
};

const TABS: { key: ProfileSection; icon: IconName; label: string }[] = [
  { key: 'posts', icon: 'view-grid-outline', label: 'Мои посты' },
  { key: 'bookmarks', icon: 'bookmark-outline', label: 'Закладки' },
];

/** Плоский переключатель двух секций профиля — только иконки, без подписей. */
export function ProfileSectionTabs({ value, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {TABS.map(({ key, icon, label }) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            <Icon
              name={icon}
              color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    tab: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: theme.colors.primary,
    },
  });

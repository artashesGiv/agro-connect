import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, type MD3Theme } from 'react-native-paper';

import { BottomSheetModal } from './BottomSheetModal';
import { useAppTheme } from '@/theme';
import { REPUTATION_RANKS, getReputationRank } from '@/utils/reputationRanks';

type Props = {
  visible: boolean;
  /** Репутация владельца бейджа — её ранг подсвечивается в списке. */
  value: number;
  /** Имя владельца бейджа — для подписи «Ранг Имя» у чужого профиля. */
  nickname: string;
  /** Свой профиль — подпись «Ваш ранг» вместо «Ранг Имя». */
  isMine?: boolean;
  onClose: () => void;
};

/** Заголовок диапазона ранга: «0–9 баллов» / «2000+ баллов». */
function rangeLabel(min: number, max: number | null): string {
  return max === null ? `${min}+ баллов` : `${min}–${max} баллов`;
}

/**
 * Список всех рангов и условие их получения. Открывается тапом по
 * `ReputationBadge` — общий выезжающий снизу лист, см. `BottomSheetModal`.
 */
export function RankInfoModal({ visible, value, nickname, isMine, onClose }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const currentRank = getReputationRank(value);
  const currentLabel = isMine ? 'Ваш ранг' : `Ранг ${nickname}`;

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <Text style={styles.title}>Ранг по репутации</Text>
      <Text style={styles.intro}>
        Получайте баллы за полезные посты и ответы — чем их больше, тем выше ранг.
      </Text>
      <ScrollView style={styles.list}>
        {REPUTATION_RANKS.map((rank) => {
          const isCurrent = rank.title === currentRank.title;
          return (
            <View
              key={rank.title}
              style={[styles.row, isCurrent && { backgroundColor: `${rank.color}1A` }]}
            >
              <View style={[styles.dot, { backgroundColor: rank.color }]} />
              <View style={styles.rowText}>
                <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
                <Text style={styles.rankRange}>{rangeLabel(rank.min, rank.max)}</Text>
              </View>
              {isCurrent ? <Text style={styles.currentLabel}>{currentLabel}</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </BottomSheetModal>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    title: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    intro: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    rowText: {
      flex: 1,
    },
    rankTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    rankRange: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      marginTop: 1,
    },
    currentLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: '600',
    },
  });

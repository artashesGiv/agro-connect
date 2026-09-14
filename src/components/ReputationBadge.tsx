import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { RankInfoModal } from './RankInfoModal';
import { getReputationRank } from '@/utils/reputationRanks';

type Props = {
  value: number;
  /** Имя владельца бейджа — для подписи «Ранг Имя» в окне-подробностях. */
  nickname: string;
  /** Свой профиль/пост/комментарий — окно подпишет «Ваш ранг». */
  isMine?: boolean;
  size?: number;
};

/**
 * Ранг по репутации — маленький цветной бейдж рядом/над именем, вместо
 * ⭐+число. Тап открывает окно снизу со списком всех рангов и условием их
 * получения.
 */
export function ReputationBadge({ value, nickname, isMine, size = 12 }: Props) {
  const rank = getReputationRank(value);
  const styles = useMemo(() => makeStyles(rank.color), [rank.color]);
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setInfoVisible(true)}
        hitSlop={4}
        style={styles.badge}
        accessibilityRole="button"
        accessibilityLabel={`Ранг: ${rank.title}. Подробнее о рангах`}
      >
        <Text style={[styles.text, { fontSize: size }]}>{rank.title}</Text>
      </Pressable>
      <RankInfoModal
        visible={infoVisible}
        value={value}
        nickname={nickname}
        isMine={isMine}
        onClose={() => setInfoVisible(false)}
      />
    </>
  );
}

const makeStyles = (color: string) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: `${color}26`,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    text: {
      color,
      fontWeight: '600',
    },
  });

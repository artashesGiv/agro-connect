export type ReputationRank = {
  min: number;
  max: number | null;
  title: string;
  color: string;
};

/**
 * Схема рангов по репутации. Цвета намеренно не через `useAppTheme()` —
 * у темы всего один акцентный цвет, а рангов пять — заведены здесь как
 * самостоятельная мини-палитра. Прогрессия по редкости (как у скинов в CS):
 * серый → синий → фиолетовый → красный → золотой.
 */
export const REPUTATION_RANKS: ReputationRank[] = [
  { min: 0, max: 9, title: 'Новичок в посеве', color: '#8A7A63' },
  { min: 10, max: 99, title: 'Сеятель', color: '#6B8E4E' },
  { min: 100, max: 499, title: 'Агроном', color: '#6635BF' },
  { min: 500, max: 1999, title: 'Хлебороб', color: '#CC4444' },
  { min: 2000, max: null, title: 'Легенда полей', color: '#B8860B' },
];

export function getReputationRank(value: number): ReputationRank {
  return (
    REPUTATION_RANKS.find(
      (rank) => value >= rank.min && (rank.max === null || value <= rank.max),
    ) ?? REPUTATION_RANKS[0]
  );
}

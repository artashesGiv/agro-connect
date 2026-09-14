import { StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

import { Icon, type IconName } from '@/components/Icon';

type FeatureBadgeProps = {
  icon: IconName;
  accent: string;
  theme: MD3Theme;
};

/** Круглый бейдж иконки поверх пары органичных «клякс» акцентного цвета. */
export function FeatureBadge({ icon, accent, theme }: FeatureBadgeProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.blob, styles.blobBack, { backgroundColor: withAlpha(accent, 0.14) }]} />
      <View style={[styles.blob, styles.blobFront, { backgroundColor: withAlpha(accent, 0.22) }]} />
      <View style={[styles.circle, { backgroundColor: accent }]}>
        <Icon name={icon} size={46} color={theme.colors.onPrimary} />
      </View>
    </View>
  );
}

/** Хекс + альфа → rgba(), только для полупрозрачных клякс за бейджем. */
function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  wrap: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  blob: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 44,
  },
  blobBack: {
    transform: [{ rotate: '24deg' }],
  },
  blobFront: {
    transform: [{ rotate: '-16deg' }],
  },
  circle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
});

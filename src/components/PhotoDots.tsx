import { StyleSheet, View } from 'react-native';

type Props = {
  count: number;
  activeIndex: number;
};

/**
 * Точки-пагинатор поверх фото — общий для карусели в карточке и полноэкранного
 * просмотра. Цвета фиксированные (не из темы): накладываются на произвольные
 * фото, а не на фон приложения, поэтому белый полупрозрачный/непрозрачный —
 * тот же приём, что у сторис/каруселей в Instagram/VK.
 */
export function PhotoDots({ count, activeIndex }: Props) {
  return (
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});

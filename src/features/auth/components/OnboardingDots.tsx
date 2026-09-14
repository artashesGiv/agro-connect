import { Animated, StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

type OnboardingDotsProps = {
  count: number;
  scrollX: Animated.Value;
  width: number;
  theme: MD3Theme;
};

export function OnboardingDots({ count, scrollX, width, theme }: OnboardingDotsProps) {
  return (
    <Animated.View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 22, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.35, 1, 0.35],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { width: dotWidth, opacity, backgroundColor: theme.colors.primary },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

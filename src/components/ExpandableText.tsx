import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { useAppTheme } from '@/theme';

type Props = {
  children: string;
  /** Строк до обрезки, пока не раскрыто. */
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
};

/**
 * Текст с обрезкой в N строк и кнопкой «Ещё»/«Свернуть», если он не влезает.
 * Однопроходный приём: `numberOfLines` уже даёт нужную визуальную обрезку,
 * `onTextLayout` только определяет, стоит ли вообще показывать кнопку —
 * если реально отрисованных строк меньше лимита, текст короткий и кнопка не нужна.
 */
export function ExpandableText({ children, numberOfLines = 4, style }: Props) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const onTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (!expanded && !truncated && event.nativeEvent.lines.length >= numberOfLines) {
      setTruncated(true);
    }
  };

  return (
    <>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : numberOfLines}
        onTextLayout={onTextLayout}
      >
        {children}
      </Text>
      {truncated ? (
        <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={6}>
          <Text style={[styles.toggle, { color: theme.colors.primary }]}>
            {expanded ? 'Свернуть' : 'Ещё'}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  toggle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },
});

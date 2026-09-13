import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import { PhotoDots } from './PhotoDots';
import { PhotoViewerModal } from './PhotoViewerModal';

type Props = {
  images: string[];
};

/**
 * Фото-блок карточки поста: свайпаемая карусель (точки внизу, если фото
 * больше одного) + тап по фото открывает полноэкранный просмотр. Инкапсулирует
 * всё сам — наружу только `images`, `PostCard` от смены поведения не меняется.
 */
export function PostPhotos({ images }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <>
      <View style={styles.wrap}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {images.map((uri, index) => (
            <Pressable key={uri + index} style={{ width }} onPress={() => setViewerIndex(index)}>
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          ))}
        </ScrollView>
        {images.length > 1 ? <PhotoDots count={images.length} activeIndex={activeIndex} /> : null}
      </View>

      <PhotoViewerModal
        visible={viewerIndex !== null}
        images={images}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      aspectRatio: 4 / 3,
      marginTop: 12,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
  });

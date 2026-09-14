import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import { Icon } from './Icon';
import { PhotoDots } from './PhotoDots';
import { PhotoViewerModal } from './PhotoViewerModal';

type Props = {
  images: string[];
  /**
   * Показать плейсхолдер вместо реальных фото: для ленты офлайн — подписанные
   * URL на приватный бакет протухают за 10 минут, без сети их не обновить.
   */
  unavailable?: boolean;
};

/**
 * Фото-блок карточки поста: свайпаемая карусель (точки внизу, если фото
 * больше одного) + тап по фото открывает полноэкранный просмотр. Инкапсулирует
 * всё сам — наружу только `images`, `PostCard` от смены поведения не меняется.
 */
export function PostPhotos({ images, unavailable }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  if (unavailable) {
    return (
      <View style={[styles.wrap, styles.placeholder]}>
        <Icon name="image-off-outline" size={28} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.placeholderText}>
          {images.length > 1 ? `${images.length} фото` : 'Фото'} — доступны при
          подключении к интернету
        </Text>
      </View>
    );
  }

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
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 24,
    },
    placeholderText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      textAlign: 'center',
    },
  });

import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './Icon';
import { PhotoDots } from './PhotoDots';

type Props = {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

/** Полноэкранный просмотр фото поста — свайп между фото (горизонталь), закрытие крестиком/«Назад». */
export function PhotoViewerModal({ visible, images, initialIndex, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setActiveIndex(initialIndex);
    // Без анимации и на следующем кадре — модалка ещё не успела отрисоваться.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initialIndex * width, animated: false });
    });
  }, [visible, initialIndex, width]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  // Внутри голого Modal (особенно со statusBarTranslucent) insets.top на Android
  // не всегда надёжен — подстраховываемся StatusBar.currentHeight, который Android
  // даёт напрямую, независимо от особенностей Modal.
  const topOffset =
    (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top) + 16;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {images.map((uri, index) => (
            <View key={uri + index} style={{ width, height }}>
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
          ))}
        </ScrollView>

        {images.length > 1 ? <PhotoDots count={images.length} activeIndex={activeIndex} /> : null}

        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={[styles.close, { top: topOffset }]}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        >
          <Icon name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});

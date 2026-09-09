import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, type MD3Theme, Snackbar } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import { MapGLView, type MapGLViewHandle } from '../components/MapGLView';
import { USER_ZOOM } from '../components/mapHtml';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

/**
 * Показываем предупреждение о неудачной геолокации один раз за запуск
 * приложения: вкладку открывают часто, и снекбар на каждый заход раздражал бы
 * сильнее, чем сама Москва вместо своего города.
 */
let warnedThisSession = false;

/**
 * Вкладка «Карта»: карта 2GIS и ничего больше.
 *
 * При каждом появлении вкладки камера едет на местоположение пользователя.
 * Если местоположения нет, карта остаётся там, где открылась (Москва, обзорный
 * зум) — уводить туда камеру повторно не нужно, это только сбрасывало бы то,
 * что человек рассматривал.
 *
 * Верхние отступы даёт шапка вкладки (`headerShown: true` в `MainTabs`),
 * поэтому обёртка `Screen` здесь не нужна.
 */
export default function MapScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const mapRef = useRef<MapGLViewHandle>(null);
  const { locate } = useCurrentLocation();
  const [locating, setLocating] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);

  const goToUser = useCallback(async () => {
    setLocating(true);
    try {
      const outcome = await locate((center) => {
        mapRef.current?.flyTo(center, USER_ZOOM);
      });
      if (outcome !== 'ok' && !warnedThisSession) {
        warnedThisSession = true;
        setWarningVisible(true);
      }
    } finally {
      setLocating(false);
    }
  }, [locate]);

  useFocusEffect(
    useCallback(() => {
      void goToUser();
    }, [goToUser]),
  );

  return (
    <View style={styles.container}>
      <MapGLView ref={mapRef} />

      <IconButton
        icon="crosshairs-gps"
        mode="contained"
        size={24}
        disabled={locating}
        onPress={() => void goToUser()}
        accessibilityLabel="Показать моё местоположение"
        containerColor={theme.colors.surface}
        iconColor={theme.colors.primary}
        style={styles.recenter}
      />

      <Snackbar
        visible={warningVisible}
        onDismiss={() => setWarningVisible(false)}
        duration={4000}
      >
        Не удалось определить местоположение
      </Snackbar>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    recenter: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      margin: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
  });

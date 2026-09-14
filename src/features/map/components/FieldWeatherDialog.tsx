import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, type MD3Theme } from 'react-native-paper';

import { BottomSheetModal } from '@/components/BottomSheetModal';
import { Icon, type IconName } from '@/components/Icon';
import { toUserMessage } from '@/services/supabase';
import { getFieldWeather, type FieldWeatherResponse } from '@/services/weather';
import { useAppTheme } from '@/theme';
import { describeWeatherCode } from '@/utils/weatherCodes';

type Props = {
  fieldId: string | null;
  fieldName: string;
  visible: boolean;
  onClose: () => void;
};

/**
 * Погода и почасовой прогноз на 24 часа по конкретному полю — данные из Edge
 * Function `field-weather` (Open-Meteo), кешируются на сервере на 15 минут.
 * Открывается кнопкой-«облачком» в `FieldCardDialog`. Атрибуция провайдера и
 * пометка об устаревших данных — обязательное условие их лицензии.
 */
export function FieldWeatherDialog({ fieldId, fieldName, visible, onClose }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [data, setData] = useState<FieldWeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !fieldId) {
      setData(null);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    getFieldWeather(fieldId, 24)
      .then((response) => {
        if (active) setData(response);
      })
      .catch((cause) => {
        if (active) setError(toUserMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, fieldId]);

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={1}>
          Погода: {fieldName}
        </Text>
        <IconButton icon="close" onPress={onClose} accessibilityLabel="Закрыть" />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : data ? (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {data.meta.stale ? (
            <Text style={styles.staleText}>Данные могут быть устаревшими</Text>
          ) : null}

          <View style={styles.summaryRow}>
            <SummaryItem
              icon="thermometer"
              label={`${round(data.summary.temperature_min_c)}…${round(data.summary.temperature_max_c)}°C`}
              styles={styles}
            />
            <SummaryItem
              icon="water-outline"
              label={`${data.summary.precipitation_total_mm ?? '—'} мм`}
              styles={styles}
            />
            <SummaryItem
              icon="weather-windy"
              label={`до ${round(data.summary.wind_speed_max_ms)} м/с`}
              styles={styles}
            />
          </View>

          {data.hourly.map((hour) => {
            const { icon, label } = describeWeatherCode(hour.weather_code);
            return (
              <View key={hour.time} style={styles.hourRow}>
                <Text style={styles.hourTime}>{formatHour(hour.time)}</Text>
                <Icon name={icon} size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.hourLabel} numberOfLines={1}>
                  {label}
                </Text>
                <Text style={styles.hourTemp}>{round(hour.temperature_2m)}°C</Text>
                <Text style={styles.hourRain}>{hour.precipitation_probability ?? 0}%</Text>
              </View>
            );
          })}

          <Text style={styles.attribution}>Данные: Open-Meteo</Text>
        </ScrollView>
      ) : null}
    </BottomSheetModal>
  );
}

function SummaryItem({
  icon,
  label,
  styles,
}: {
  icon: IconName;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.summaryItem}>
      <Icon name={icon} size={20} />
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function round(value: number | null): string {
  return value === null ? '—' : String(Math.round(value));
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    headerTitle: {
      flex: 1,
      color: theme.colors.onSurface,
    },
    loader: {
      marginVertical: 32,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginVertical: 24,
      paddingHorizontal: 8,
    },
    scrollArea: {
      maxHeight: 420,
    },
    scrollContent: {
      paddingBottom: 12,
    },
    staleText: {
      color: theme.colors.error,
      fontSize: 12,
      marginBottom: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 12,
    },
    summaryItem: {
      alignItems: 'center',
      gap: 4,
    },
    summaryLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '600',
    },
    hourRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    hourTime: {
      width: 44,
      color: theme.colors.onSurface,
      fontSize: 13,
    },
    hourLabel: {
      flex: 1,
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    hourTemp: {
      width: 44,
      textAlign: 'right',
      color: theme.colors.onSurface,
      fontSize: 13,
      fontWeight: '600',
    },
    hourRain: {
      width: 36,
      textAlign: 'right',
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    attribution: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 12,
    },
  });

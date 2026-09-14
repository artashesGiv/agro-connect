import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, type MD3Theme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

import { formatSummaryText, getPostSummary, type PostSummaryJobResponse } from '@/services/postSummary';
import { useAppTheme } from '@/theme';

import { BottomSheetModal } from './BottomSheetModal';
import { Icon } from './Icon';

type Props = {
  /** `null` — окно закрыто. Открытие всегда с конкретным заданием. */
  jobId: string | null;
  onClose: () => void;
};

/**
 * Окно снизу с результатом AI-разбора поста — открывается по тапу на
 * уведомление `post_summary_ready`/`post_summary_failed` или сразу, если
 * бэкенд вернул уже готовый результат (`reused`). Без поллинга: сигнал
 * «готово» — само уведомление, а не опрос этого окна.
 */
export function PostSummarySheet({ jobId, onClose }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [job, setJob] = useState<PostSummaryJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      setCopied(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    getPostSummary(jobId)
      .then((result) => {
        if (active) setJob(result);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить разбор.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jobId]);

  const text = job?.status === 'completed' ? formatSummaryText(job.analysis) : null;

  const handleCopy = async () => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomSheetModal visible={jobId !== null} onClose={onClose}>
      <Text variant="headlineSmall" style={styles.title}>
        AI-разбор поста
      </Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : job?.status === 'failed' ? (
        <Text style={styles.errorText}>Не удалось выполнить AI-разбор.</Text>
      ) : job?.status === 'queued' || job?.status === 'processing' ? (
        <Text style={styles.stateText}>Разбор ещё готовится.</Text>
      ) : text ? (
        <>
          <ScrollView style={styles.scrollArea}>
            <Text style={styles.body}>{text}</Text>
          </ScrollView>
          <Button
            mode="contained"
            icon={() => (
              <Icon
                name={copied ? 'check' : 'content-copy'}
                size={18}
                color={theme.colors.onPrimary}
              />
            )}
            onPress={handleCopy}
            style={styles.copyButton}
          >
            {copied ? 'Скопировано' : 'Скопировать'}
          </Button>
        </>
      ) : null}
    </BottomSheetModal>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    title: {
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    loader: {
      marginVertical: 32,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 15,
      textAlign: 'center',
      marginVertical: 24,
      paddingHorizontal: 8,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      textAlign: 'center',
      marginVertical: 24,
      paddingHorizontal: 8,
    },
    scrollArea: {
      maxHeight: 420,
    },
    body: {
      color: theme.colors.onSurface,
      fontSize: 14,
      lineHeight: 21,
      paddingBottom: 12,
    },
    copyButton: {
      marginTop: 12,
    },
  });

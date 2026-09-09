import { useMemo, type ReactNode } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { Button, IconButton, type MD3Theme } from 'react-native-paper';

import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAppTheme } from '@/theme';

const TOTAL_STEPS = 5;

type CreateStepLayoutProps = {
  /** Номер шага, 1..5 — для прогресс-бара. */
  step: number;
  title: string;
  subtitle?: string;
  /** Не передаётся на первом шаге — там кнопки «назад» нет. */
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
  nextDisabled?: boolean;
  children: ReactNode;
};

/**
 * Оболочка шага мастера создания поста: назад + прогресс + заголовок + тело +
 * кнопка. Почти копия `RegisterStepLayout` — при желании позже вынести общий
 * `WizardStepLayout` в `src/components`.
 */
export function CreateStepLayout({
  step,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = 'Далее',
  nextLoading = false,
  nextDisabled = false,
  children,
}: CreateStepLayoutProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        {onBack ? (
          <IconButton
            icon="arrow-left"
            onPress={onBack}
            accessibilityLabel="Назад"
            style={styles.backButton}
          />
        ) : (
          <View style={styles.backSpacer} />
        )}
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]}
          />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.stepCounter}>{`Шаг ${step} из ${TOTAL_STEPS}`}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.fields}>{children}</View>

        <Button
          mode="contained"
          onPress={() => {
            Keyboard.dismiss();
            onNext();
          }}
          loading={nextLoading}
          disabled={nextDisabled || nextLoading}
          style={styles.nextButton}
          accessibilityLabel={nextLabel}
        >
          {nextLabel}
        </Button>
      </View>
    </KeyboardAwareScreen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 16,
      paddingTop: 8,
    },
    backButton: {
      margin: 0,
    },
    backSpacer: {
      width: 16,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      marginLeft: 4,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceVariant,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: theme.colors.primary,
    },
    body: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    stepCounter: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    title: {
      color: theme.colors.onBackground,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 8,
    },
    fields: {
      marginTop: 20,
    },
    nextButton: {
      marginTop: 8,
    },
  });

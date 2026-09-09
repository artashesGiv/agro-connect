import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, type MD3Theme } from 'react-native-paper';

import { Icon } from '@/components/Icon';
import type { CreateFieldScreenProps } from '@/navigation/types';
import { useAppTheme } from '@/theme';

import { CreateStepLayout } from '../../components/CreateStepLayout';

export default function CreateFieldScreen({ navigation }: CreateFieldScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <CreateStepLayout
      step={4}
      title="Поле"
      subtitle="К какому полю относится пост."
      onBack={navigation.goBack}
      onNext={() => navigation.navigate('CreatePreview')}
    >
      <View style={styles.card}>
        <Icon name="map-outline" size={28} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.text}>
          Привязка к полю появится позже. Пока пост создаётся без поля.
        </Text>
      </View>
    </CreateStepLayout>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      gap: 12,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    text: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, type MD3Theme } from 'react-native-paper';

import { useAuth } from '../../../services/auth';
import { useAppTheme } from '../../../theme';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { signOut } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Параметры</Text>
        <Text style={styles.headerSubtitle}>Настройка приложения</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уведомления</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Включить уведомления</Text>
            <Text style={styles.settingDescription}>
              Получайте важные обновления и оповещения
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{
              false: theme.colors.surfaceVariant,
              true: theme.colors.primary,
            }}
            thumbColor={
              notificationsEnabled ? theme.colors.onPrimary : theme.colors.outline
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Аналитика</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Отправлять аналитику</Text>
            <Text style={styles.settingDescription}>
              Помогите улучшить приложение, отправляя анонимные данные
            </Text>
          </View>
          <Switch
            value={analyticsEnabled}
            onValueChange={setAnalyticsEnabled}
            trackColor={{
              false: theme.colors.surfaceVariant,
              true: theme.colors.primary,
            }}
            thumbColor={
              analyticsEnabled ? theme.colors.onPrimary : theme.colors.outline
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О приложении</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Версия приложения</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Версия Android</Text>
            <Text style={styles.infoValue}>Переменная</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Идентификатор устройства</Text>
            <Text style={styles.infoValue}>Неизвестен</Text>
          </View>
        </View>
      </View>

      <Button
        mode="contained"
        buttonColor={theme.colors.errorContainer}
        textColor={theme.colors.onErrorContainer}
        onPress={signOut}
        style={styles.signOutButton}
        accessibilityLabel="Выйти из аккаунта"
      >
        Выйти
      </Button>
    </ScrollView>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    header: {
      marginBottom: 32,
    },
    headerTitle: {
      color: theme.colors.onBackground,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 8,
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
    },
    settingInfo: {
      flex: 1,
      marginRight: 12,
    },
    settingLabel: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    settingDescription: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      lineHeight: 18,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    infoRowBorder: {
      borderTopColor: theme.colors.outline,
      borderTopWidth: 1,
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
    },
    infoLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    infoValue: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: '600',
    },
    signOutButton: {
      marginTop: 'auto',
    },
  });

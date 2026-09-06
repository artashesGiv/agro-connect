import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Параметры</Text>
          <Text style={styles.headerSubtitle}>
            Настройка приложения
          </Text>
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
              trackColor={{ false: '#374151', true: '#2563EB' }}
              thumbColor={notificationsEnabled ? '#93C5FD' : '#9CA3AF'}
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
              trackColor={{ false: '#374151', true: '#2563EB' }}
              thumbColor={analyticsEnabled ? '#93C5FD' : '#9CA3AF'}
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

        <Pressable style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Сбросить всё к значениям по умолчанию</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#93C5FD',
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
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
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
    borderTopColor: '#1E293B',
    borderTopWidth: 1,
    borderBottomColor: '#1E293B',
    borderBottomWidth: 1,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    marginTop: 'auto',
    paddingVertical: 14,
  },
  resetButtonText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '600',
  },
});

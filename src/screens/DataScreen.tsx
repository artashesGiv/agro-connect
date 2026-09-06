import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface DataItem {
  id: number;
  title: string;
  description: string;
  value: string;
}

const testData: DataItem[] = [
  {
    id: 1,
    title: 'TypeScript',
    description: 'Строгая типизация',
    value: 'Включен',
  },
  {
    id: 2,
    title: 'React Native',
    description: 'Фреймворк для мобильных приложений',
    value: '0.86.3',
  },
  {
    id: 3,
    title: 'Expo SDK',
    description: 'Плагины и инструменты для разработки',
    value: '57.0.19',
  },
  {
    id: 4,
    title: 'Навигация',
    description: 'React Navigation для переключения экранов',
    value: 'Активна',
  },
  {
    id: 5,
    title: 'Темизация',
    description: 'Тёмная тема приложения',
    value: 'По умолчанию',
  },
  {
    id: 6,
    title: 'Безопасность',
    description: 'Safe Area для отступа от краёв',
    value: 'Включена',
  },
];

export default function DataScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Тестовые данные</Text>
          <Text style={styles.headerSubtitle}>
            Информация о конфигурации проекта
          </Text>
        </View>

        {testData.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardValue}>{item.value}</Text>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Всего элементов: {testData.length}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
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
  card: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  cardValue: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardDescription: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 24,
    paddingVertical: 16,
    borderTopColor: '#1E293B',
    borderTopWidth: 1,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});

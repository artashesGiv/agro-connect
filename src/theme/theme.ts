import {
  DarkTheme as NavigationDarkBase,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

// ─── Правьте эти цвета под свой бренд ──────────────────────────────────────────
// Это единственное место с палитрой приложения. Экраны и навигация берут цвета
// отсюда через useAppTheme() / navigationTheme.
const brand = {
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  accentSoft: '#172554', // фон бейджей / чипов
  onAccentSoft: '#93C5FD', // текст на accentSoft
  background: '#0B1020', // фон экранов
  surface: '#111827', // карточки, строки, навбар, хедер
  text: '#F8FAFC', // основной текст
  textMuted: '#94A3B8', // вторичный текст
  border: '#1E293B', // рамки, разделители
  danger: '#7F1D1D', // опасное действие (фон)
  onDanger: '#FCA5A5', // текст на danger
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Тема Material Design 3 для React Native Paper.
 * Светлую основу можно получить, заменив `MD3DarkTheme` на `MD3LightTheme`
 * и добавив `dark: false`.
 */
export const appTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brand.primary,
    onPrimary: brand.onPrimary,
    primaryContainer: brand.accentSoft,
    onPrimaryContainer: brand.onAccentSoft,
    background: brand.background,
    onBackground: brand.text,
    surface: brand.surface,
    onSurface: brand.text,
    surfaceVariant: brand.border,
    onSurfaceVariant: brand.textMuted,
    outline: brand.border,
    outlineVariant: brand.border,
    error: brand.danger,
    errorContainer: brand.danger,
    onErrorContainer: brand.onDanger,
  },
};

/** Тема навигации (навбар, хедер, активный таб) из той же палитры. */
export const navigationTheme: NavigationTheme = {
  ...NavigationDarkBase,
  colors: {
    ...NavigationDarkBase.colors,
    primary: appTheme.colors.primary,
    background: appTheme.colors.background,
    card: appTheme.colors.surface,
    text: appTheme.colors.onSurface,
    border: appTheme.colors.outline,
    notification: appTheme.colors.error,
  },
};

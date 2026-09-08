import {
  DefaultTheme as NavigationLightBase,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

// ─── Правьте эти цвета под свой бренд ──────────────────────────────────────────
// Это единственное место с палитрой приложения. Экраны и навигация берут цвета
// отсюда через useAppTheme() / navigationTheme.
const brand = {
  primary: '#6B4A2E', // цвет земли, кофейно-коричневый
  onPrimary: '#FFFFFF',
  accentSoft: '#E4D3B0', // фон бейджей / чипов (светлый пшенично-коричневый)
  onAccentSoft: '#4A3520', // тёмно-коричневый текст на accentSoft
  background: '#F6EBD2', // фон экранов — пшеничный крем (цвет колоска)
  surface: '#EEDFBE', // шапка, карты, навбар, таб-бар — оттенок поглубже
  text: '#3B2E1A', // основной текст — тёмно-коричневый
  textMuted: '#6E5C3E', // вторичный текст
  border: '#D8C49B', // рамки, разделители
  danger: '#8E2A2A', // опасное действие (фон)
  onDanger: '#FFFFFF', // текст на danger
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Светлая тёплая тема Material Design 3 «пшеница + кофе» для React Native Paper.
 * Вернуть тёмную основу можно, заменив `MD3LightTheme` на `MD3DarkTheme`,
 * `DefaultTheme` на `DarkTheme` и подставив тёмные значения в `brand`.
 */
export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
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
  ...NavigationLightBase,
  colors: {
    ...NavigationLightBase.colors,
    primary: appTheme.colors.primary,
    background: appTheme.colors.background,
    card: appTheme.colors.surface,
    text: appTheme.colors.onSurface,
    border: appTheme.colors.outline,
    notification: appTheme.colors.error,
  },
};

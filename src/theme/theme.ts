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
    onError: brand.onDanger,
    onErrorContainer: brand.onDanger,

    // Нейтрализуем дефолтные фиолетовые роли MD3, которые не покрыты `brand`:
    // без этого Menu / Dialog / SegmentedButtons уезжают в лаванду.
    elevation: {
      level0: 'transparent',
      level1: brand.surface,
      level2: brand.surface, // фон Menu
      level3: brand.surface, // фон Dialog
      level4: brand.surface,
      level5: brand.surface,
    },
    secondary: brand.primary,
    onSecondary: brand.onPrimary,
    secondaryContainer: brand.accentSoft, // выбранный сегмент SegmentedButtons
    onSecondaryContainer: brand.onAccentSoft,
    tertiary: brand.primary,
    onTertiary: brand.onPrimary,
    tertiaryContainer: brand.accentSoft,
    onTertiaryContainer: brand.onAccentSoft,
    backdrop: 'rgba(59, 46, 26, 0.45)', // тёплый коричневый скрим (brand.text @ 45%)
    surfaceDisabled: 'rgba(59, 46, 26, 0.12)',
    onSurfaceDisabled: 'rgba(59, 46, 26, 0.38)',
    inverseSurface: brand.text,
    inverseOnSurface: brand.background,
    inversePrimary: brand.accentSoft,
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

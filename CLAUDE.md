# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The rules in `AGENTS.md` (Expo SDK 57 versioned docs, `npx expo install`, don't hand-edit `android/`/`ios/`, keep the `preview` EAS profile installable, read/update `SPEC.md`, smallest-solution preference, run typecheck/check, accessibility) apply and are not repeated below.

## Commands

- `npm start` — Expo dev server (scan QR with Expo Go on Android)
- `npm run android` / `npm run ios` — build & run on emulator/device
- `npm run typecheck` — `tsc --noEmit`; run after every code change
- `npm run check` — typecheck + `expo-doctor`; run before a build
- `npm run build:apk` — EAS `preview` build → installable APK (`eas-cli login` first)
- `npm run start:mcp` — dev server with the unstable Expo MCP server enabled

There is no test runner, linter, or formatter configured. "Tests" in `SPEC.md` means the manual acceptance checklist (APK installs, tabs work offline, app survives reboot without the dev server).

## Architecture

Single-package Expo app, no backend. Entry: `index.ts` → `App.tsx`.

- **`App.tsx`** is the whole navigation shell. Provider tree: `SafeAreaProvider` → `PaperProvider theme={appTheme}` → `NavigationContainer theme={navigationTheme}` → one `createBottomTabNavigator` with `Home`/`Data`/`Settings`. Tab bar and headers take their colors from `navigationTheme` automatically — `App.tsx` sets no colors of its own beyond the emoji `TabBarIcon`. One `<StatusBar style="light">` here, not per-screen.
- **`app.config.js`** — dynamic Expo config (replaces the old `app.json`). Portrait-locked, `userInterfaceStyle: 'dark'`, Android package `com.a1.contestapp` (placeholder — replace before final submission), EAS `projectId` in `extra.eas`.
- **`eas.json`** — `preview` (internal-distribution APK) and `production` (app-bundle) profiles only.

### UI & theming

- **React Native Paper** (`react-native-paper`, MD3) is the component library. Icons come from `@expo/vector-icons` (`expo-font` is its required peer dep) — Paper auto-detects it, no icon config needed.
- **`src/theme/theme.ts` is the single source for the palette.** Edit the `brand` object at the top (≈10 hexes: `primary`, `background`, `surface`, `text`, `border`, `danger`, …) and everything follows. It builds:
  - `appTheme: MD3Theme` — `MD3DarkTheme` with `colors` overridden from `brand` (mapped to MD3 roles). One fixed dark theme — no light/dark switching. To go light: base on `MD3LightTheme` + `dark: false`.
  - `navigationTheme` — React Navigation theme built from the same `appTheme.colors`.
- `src/theme/useAppTheme.ts` — `useAppTheme()`, a typed `useTheme<MD3Theme>()` wrapper. `src/theme/index.ts` re-exports `appTheme`, `navigationTheme`, `useAppTheme`.
- **Screens get colors only from `useAppTheme()`** — never hard-code hex. Pattern: `const styles = useMemo(() => makeStyles(theme), [theme])` where `makeStyles(theme: MD3Theme)` returns `StyleSheet.create({...})` referencing `theme.colors.*`. See any of the 3 screens.

### Icons

- Library: **`@expo/vector-icons`**, set **MaterialCommunityIcons** (~7400 glyphs) — the font loads itself and is the same one Paper uses. Stick to this one set so the app stays visually consistent.
- Wrapper: **`src/components/Icon.tsx`** → `<Icon name="…" />`. Default color is `theme.colors.onSurface`; pass `color` / `size` to override. `IconName` is a typed union — TS autocompletes valid names and rejects typos.
- **Add a new icon:**
  1. Find its name at https://icons.expo.fyi (filter to `MaterialCommunityIcons`) or https://pictogrammers.com/library/mdi/ — a kebab-case id like `magnify`, `chevron-right`, `trash-can-outline`.
  2. In a screen: `import { Icon } from '<rel>/components/Icon'` then `<Icon name="magnify" color={theme.colors.primary} />`.
  3. In the tab bar: add an entry to `TAB_ICONS` in `App.tsx` (filled name + its `-outline` variant).
  4. In Paper components with an `icon` prop (`Button`, `List.Icon`, `TextInput.Icon`, `Appbar.Action`): pass the MCI name as a plain string — no `Icon` import needed.
- Another set (Ionicons, Feather, FontAwesome6, …) all ship inside `@expo/vector-icons`; import the set directly where needed, or generalize `Icon.tsx`.

### Folder layout — where code goes

```
src/
├── app/                    # (empty) reserved for future navigator/route config moved out of App.tsx
├── navigation/
│   └── types.ts            # RootTabParamList + a BottomTabScreenProps alias per route. Add new routes HERE first.
├── features/               # one folder per feature; a feature owns its screens + the code only it uses
│   ├── home/    data/    settings/     # the 3 demo tabs, each: screens/<Name>Screen.tsx
│   └── fields/             # (empty) reference template for a real feature:
│       ├── components/     #   UI used only by this feature
│       ├── hooks/          #   hooks used only by this feature (e.g. useFields)
│       ├── repository/     #   data access for this feature — hides the source (AsyncStorage / API) behind an interface
│       └── screens/        #   the feature's screens
├── components/             # shared "dumb" UI reused across features — Icon.tsx; add Button, Card, ...
├── hooks/                  # (empty) shared hooks — useDebounce, useKeyboardVisible, ...
├── utils/                  # (empty) pure functions, formatters, constants
├── services/               # (empty) app-wide singletons — storage, notifications, analytics
├── theme/                  # Paper theme (theme.ts) + useAppTheme — the app's one palette (see "UI & theming")
└── types/                  # (empty) global TS types
```

New screen → `src/features/<feature>/screens/`, and register the route in `src/navigation/types.ts` + `App.tsx`. Component/hook used by one feature → that feature's folder; used by two or more → `src/components/` or `src/hooks/`.

### Import rules

- A feature **must not** import from another feature. Shared code moves up to `src/components`, `src/hooks`, `src/utils`, `src/services`, `src/theme`, or `src/types`.
- Allowed direction: `features/*` → `components|hooks|utils|services` → (leaf, no `src/` imports). Never the reverse (shared code never imports a feature).
- `src/theme` and `src/types` are foundational — any layer may import them (e.g. `src/components/Icon.tsx` uses `useAppTheme`).
- Screens read/write data only through their feature's `repository/` layer, never `AsyncStorage`/`fetch` directly — so the source can be swapped later.
- No path aliases configured; use relative imports (`../../components/Button`). `tsconfig.json` is `strict`.

### Project status

This is a **contest-app boilerplate**, not a finished product. Despite the `agro-connect` repo name, the app is currently a generic 3-tab demo (counter, static data list, settings toggles) and `SPEC.md` still has open questions about the actual app idea. A prior commit added a full `src/map/` agricultural-field feature (map view, weather tile overlay, AsyncStorage field repository, mocked other-users' markers) that was **reverted** — check `git show 7a5c58a` if that direction is revived (its data-access layer maps onto `src/features/fields/repository/`). Read and update `SPEC.md` before building real features.

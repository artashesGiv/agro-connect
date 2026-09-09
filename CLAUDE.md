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

- **`App.tsx`** is tiny: provider tree only — `SafeAreaProvider` → `PaperProvider theme={appTheme}` → `AuthProvider` → `RootNavigator`. All navigator wiring lives in `src/navigation/`.
- **`src/navigation/`** — the composition root for navigation:
  - `RootNavigator.tsx` — the auth gate. `status === 'loading'` → blank background view (native splash still up); else `<NavigationContainer theme={navigationTheme}>` + `<StatusBar style="light">` wrapping either `<MainTabs>` (authenticated) or `<AuthNavigator>` (not). Whole navigator is swapped, never `navigate()`.
  - `MainTabs.tsx` — the 5-tab bottom navigator: `Home`, `Map`, `Create`, `Placeholder` (`?`, temporary), `Profile`. Icons for all but `Create` come from `TAB_ICONS`; `Create` uses a custom `tabBarButton` (`CreateTabButton.tsx` — a big round `+`). Colors come from `navigationTheme` automatically. Every tab except `Home` is a placeholder for now.
  - `types.ts` — `RootTabParamList` + `AuthStackParamList` and per-screen prop aliases. Add new routes HERE first.
- **`app.config.js`** — dynamic Expo config (replaces the old `app.json`). Portrait-locked, `userInterfaceStyle: 'dark'`, `plugins: ['expo-secure-store']`, Android package `com.a1.contestapp` (placeholder — replace before final submission), EAS `projectId` in `extra.eas`.
- **`eas.json`** — `preview` (internal-distribution APK) and `production` (app-bundle) profiles only.

### UI & theming

- **React Native Paper** (`react-native-paper`, MD3) is the component library. Icons come from `@expo/vector-icons` (`expo-font` is its required peer dep) — Paper auto-detects it, no icon config needed.
- **`src/theme/theme.ts` is the single source for the palette.** Edit the `brand` object at the top (≈10 hexes: `primary`, `background`, `surface`, `text`, `border`, `danger`, …) and everything follows. It builds:
  - `appTheme: MD3Theme` — `MD3LightTheme` with `colors` overridden from `brand` (mapped to MD3 roles). One fixed **light "wheat + coffee"** theme (warm cream surfaces `#F6EBD2` / `#EEDFBE`, brown primary `#6B4A2E`) — no light/dark switching. To go dark: base on `MD3DarkTheme` + `DarkTheme` (from `@react-navigation/native`) + dark `brand` values (a full "earth + wheat" dark palette is recorded in the `theme-palettes` memory).
  - `navigationTheme` — React Navigation theme (`DefaultTheme` base) built from the same `appTheme.colors`.
- `src/theme/useAppTheme.ts` — `useAppTheme()`, a typed `useTheme<MD3Theme>()` wrapper. `src/theme/index.ts` re-exports `appTheme`, `navigationTheme`, `useAppTheme`.
- **Screens get colors only from `useAppTheme()`** — never hard-code hex. Pattern: `const styles = useMemo(() => makeStyles(theme), [theme])` where `makeStyles(theme: MD3Theme)` returns `StyleSheet.create({...})` referencing `theme.colors.*`. See any of the 3 screens.

### Icons

- Library: **`@expo/vector-icons`**, set **MaterialCommunityIcons** (~7400 glyphs) — the font loads itself and is the same one Paper uses. Stick to this one set so the app stays visually consistent.
- Wrapper: **`src/components/Icon.tsx`** → `<Icon name="…" />`. Default color is `theme.colors.onSurface`; pass `color` / `size` to override. `IconName` is a typed union — TS autocompletes valid names and rejects typos.
- **Add a new icon:**
  1. Find its name at https://icons.expo.fyi (filter to `MaterialCommunityIcons`) or https://pictogrammers.com/library/mdi/ — a kebab-case id like `magnify`, `chevron-right`, `trash-can-outline`.
  2. In a screen: `import { Icon } from '<rel>/components/Icon'` then `<Icon name="magnify" color={theme.colors.primary} />`.
  3. In the tab bar: add an entry to `TAB_ICONS` in `src/navigation/MainTabs.tsx` (filled name + its `-outline` variant).
  4. In Paper components with an `icon` prop (`Button`, `List.Icon`, `TextInput.Icon`, `Appbar.Action`): pass the MCI name as a plain string — no `Icon` import needed.
- Another set (Ionicons, Feather, FontAwesome6, …) all ship inside `@expo/vector-icons`; import the set directly where needed, or generalize `Icon.tsx`.

### Forms

**react-hook-form + zod** (`@hookform/resolvers/zod`). `zod` is pinned to `^3.25.x` on purpose — Expo's tooling already pulls exactly that version transitively, so the pin dedupes to one copy (v3 API: `z.string().email()`).

- **Schema per feature** in `src/features/<feature>/schemas/` — e.g. `loginSchema.ts` exports `loginSchema`, `type LoginFormValues = z.infer<typeof loginSchema>`, and `loginDefaults`. The schema is the single source for both validation and the values type.
- **`src/features/auth/components/FormTextInput.tsx`** — the bridge: `Controller` (rhf) ↔ Paper `TextInput` + `HelperText`. Generic over the form type (`control` + `name` + `label` + passthrough `TextInputProps`); shows the field's zod error beneath it; renders an eye toggle when `secureTextEntry` is set. This is the pattern for every form — promote it to `src/components/` once a second feature has a form.
- **Screen wiring:** `useForm<Values>({ resolver: zodResolver(schema), defaultValues, mode: 'onTouched' })`, submit via `handleSubmit(values => signIn(values))`. Field errors render under the fields; a server/auth error comes from `useAuth().error` shown above the form (it self-clears on the next submit).
- **Multi-step form (Register):** one `useForm` for the whole wizard in `src/features/auth/forms/RegisterFormProvider.tsx` (RHF `FormProvider`); each step screen pulls it via `useFormContext<RegisterFormValues>()`. A step validates only its own fields with `await trigger(REGISTER_STEP_FIELDS.<step>)` before `navigation.navigate(...)`. `RegisterStepLayout` is the shared step shell (back + progress bar + title + footer button). The steps are screens of a nested native-stack (`RegisterNavigator`), so `navigation.goBack()` moves between steps and, on step 1, bubbles up to `Login`.

### Auth & data layer

On launch the app shows `AuthNavigator` until there's a session, then `MainTabs`. Login is a real form (email + password); Register is a 4-step wizard (email → confirmation code → name/surname/nickname → password ×2). The confirmation code is UI-only — `authApi.requestCode` / `verifyCode` are fire-and-forget stubs that accept anything. The last step maps the form to `RegisterPayload` and calls `signUp`. **Logout** lives on the Profile tab (`src/features/profile/screens/ProfileScreen.tsx`) — a `signOut()` button. The backend plumbing is real but stubbed — see below.

- **`src/services/http/`** — the network layer.
  - `config.ts` — `API_BASE_URL` = `process.env.EXPO_PUBLIC_API_URL` ?? JSONPlaceholder (`.env.example` documents it; `.env` is gitignored).
  - `httpClient.ts` — `http.get/post/put/patch/delete`, `HttpError`, `AbortController` timeout, JSON in/out. Attaches `Authorization: Bearer <token>` from `authToken` unless `{ auth: false }`.
  - `authToken.ts` — in-memory token holder (`get/set/clear`), the synchronous source the client reads per request. Written only by `AuthProvider`.
- **`src/services/auth/`** — the session.
  - `AuthProvider` + `useAuth()` → `{ status, user, error, signIn, signUp, signOut }`. `status`: `loading | authenticating | authenticated | unauthenticated`. Any feature may import `useAuth`.
  - `authApi.ts` — `login`/`register` hit JSONPlaceholder `POST /users`, `requestCode`/`verifyCode` hit `POST /posts`; **responses are ignored and a stub `Session` is returned** — replace endpoints + response mapping when the real API lands (marked `TODO(backend)`). `useAuth()` covers session-changing calls; `authApi` is also re-exported for the stateless code-verification calls the register steps make directly.
  - `tokenStorage.ts` — the access token in `expo-secure-store` (key `auth.accessToken`). The only thing that survives a restart.
- **Three tiers for the session — know which holds what:**
  | tier | where | lifetime | holds | read by |
  |---|---|---|---|---|
  | persistent | `tokenStorage` (SecureStore) | across restarts | access token | `AuthProvider.bootstrap()` only |
  | reactive store | `AuthProvider` context | app session | `status`, `user`, `error` | UI via `useAuth()`, `RootNavigator` |
  | sync holder | `authToken` module var | app session | token string | `httpClient` per request |
  The store is reactive but not readable outside React; SecureStore is persistent but async — hence the in-memory mirror. The raw token is **not** in the context value.
- **Flow:** cold start → `status:'loading'` → read token from SecureStore → `authenticated`/`unauthenticated` (no network needed, so a stored session opens straight to tabs offline). `signIn`→ `authApi.login` → write token to SecureStore + `authToken` → `authenticated`. `signOut` → clear both → `unauthenticated`.

### Folder layout — where code goes

```
src/
├── app/                    # (empty) reserved for future navigator/route config
├── navigation/             # composition root: RootNavigator (auth gate), MainTabs, types.ts
├── features/               # one folder per feature; a feature owns its screens + the code only it uses
│   ├── home/               # the one real tab (demo counter); screens/<Name>Screen.tsx
│   ├── create/  placeholder/  profile/   # tab placeholders (profile also holds the logout button)
│   ├── auth/               # auth UI: screens/ (+ screens/register/ wizard), navigation/ (Auth + nested Register),
│   │                       #   schemas/ (zod), forms/RegisterFormProvider.tsx, components/ (FormTextInput, RegisterStepLayout)
│   │                       #   (session logic lives in src/services/auth — see "Auth & data layer")
│   └── map/                # the "Карта" tab (placeholder screen) + reference feature template:
│       ├── components/     #   UI used only by this feature
│       ├── hooks/          #   hooks used only by this feature (e.g. useFields)
│       ├── repository/     #   data access for this feature — hides the source (AsyncStorage / API) behind an interface
│       └── screens/        #   the feature's screens
├── components/             # shared "dumb" UI reused across features — Icon.tsx; add Button, Card, ...
├── hooks/                  # (empty) shared hooks — useDebounce, useKeyboardVisible, ...
├── utils/                  # (empty) pure functions, formatters, constants
├── services/               # app-wide singletons — http/ (fetch client), auth/ (session), posts/ (mock post fetch)
├── theme/                  # Paper theme (theme.ts) + useAppTheme — the app's one palette (see "UI & theming")
└── types/                  # (empty) global TS types
```

New screen → `src/features/<feature>/screens/`, and register the route in `src/navigation/types.ts` + the relevant navigator. Component/hook used by one feature → that feature's folder; used by two or more → `src/components/` or `src/hooks/`.

### Import rules

- A feature **must not** import from another feature. Shared code moves up to `src/components`, `src/hooks`, `src/utils`, `src/services`, `src/theme`, or `src/types`.
- Allowed direction: `features/*` → `components|hooks|utils|services` → (leaf, no `src/` imports). Never the reverse (shared code never imports a feature).
- **`App.tsx` and `src/navigation/` are the composition root** — they may import from any feature (that's their job: wiring). Features still must not import each other.
- `src/theme` and `src/types` are foundational — any layer may import them (e.g. `src/components/Icon.tsx` uses `useAppTheme`).
- Screens read/write data only through a `repository/` (feature) or `src/services/` layer, never `AsyncStorage`/`fetch`/`SecureStore` directly — so the source can be swapped later.
- No path aliases configured; use relative imports (`../../components/Button`). `tsconfig.json` is `strict`.

### Project status

This is a **contest-app boilerplate**, not a finished product. Despite the `agro-connect` repo name, the app is an auth flow (real Login form + 4-step Register wizard) in front of a 5-tab shell where only Home (a demo counter) has content — Map / Create / `?` / Profile are placeholders. `SPEC.md` still has open questions about the actual app idea. A prior commit added a full `src/map/` agricultural-field feature (map view, weather tile overlay, AsyncStorage field repository, mocked other-users' markers) that was **reverted** — check `git show 7a5c58a` if that direction is revived (its data-access layer maps onto `src/features/map/repository/`). Read and update `SPEC.md` before building real features.

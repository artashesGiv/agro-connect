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
- `npm run types:supabase` — regenerate `src/types/database.types.ts` from the live schema (needs `npx supabase login` first)

There is no test runner, linter, or formatter configured. "Tests" in `SPEC.md` means the manual acceptance checklist (APK installs, tabs work offline, app survives reboot without the dev server).

## Architecture

Single-package Expo app. The backend is **Supabase** (hosted Postgres + Auth + Storage) — there is no server of our own. Entry: `index.ts` → `App.tsx`.

- **`App.tsx`** is tiny: provider tree only — `SafeAreaProvider` → `PaperProvider theme={appTheme}` → `AuthProvider` → `RootNavigator`. All navigator wiring lives in `src/navigation/`.
- **`src/navigation/`** — the composition root for navigation:
  - `RootNavigator.tsx` — the auth gate. `status === 'loading'` → blank background view (native splash still up); else `<NavigationContainer theme={navigationTheme}>` + `<StatusBar style="light">` wrapping either `<MainTabs>` (`authenticated`) or `<AuthNavigator>` (everything else, **including `registering`** — during sign-up a session exists before the profile is written, and the user must not reach the tabs yet). Whole navigator is swapped, never `navigate()`.
  - `MainTabs.tsx` — the 5-tab bottom navigator: `Home`, `Map`, `Create`, `Placeholder` (`?`, temporary), `Profile`. Icons for all but `Create` come from `TAB_ICONS`; `Create` uses a custom `tabBarButton` (`CreateTabButton.tsx` — a big round `+`). Colors come from `navigationTheme` automatically. Every tab except `Home` is a placeholder for now.
  - `types.ts` — `RootTabParamList` + `AuthStackParamList` and per-screen prop aliases. Add new routes HERE first.
- **`app.config.js`** — dynamic Expo config (replaces the old `app.json`). Portrait-locked, `userInterfaceStyle: 'dark'`, no config plugins, Android package `com.a1.contestapp` (placeholder — replace before final submission), EAS `projectId` in `extra.eas`.
- **`eas.json`** — `preview` (internal-distribution APK) and `production` (app-bundle) profiles only.
- **`tsconfig.json`** — `strict`, plus `paths: { "@/*": ["./src/*"] }`. No `baseUrl` (deprecated in TS 6) and no babel/metro config: Expo SDK 57 enables `experiments.tsconfigPaths` by default and resolves `paths` relative to the config's own directory.

### UI & theming

- **React Native Paper** (`react-native-paper`, MD3) is the component library. Icons come from `@expo/vector-icons` (`expo-font` is its required peer dep) — Paper auto-detects it, no icon config needed.
- **`src/theme/theme.ts` is the single source for the palette.** Edit the `brand` object at the top (≈10 hexes: `primary`, `background`, `surface`, `text`, `border`, `danger`, …) and everything follows. It builds:
  - `appTheme: MD3Theme` — `MD3LightTheme` with `colors` overridden from `brand` (mapped to MD3 roles). One fixed **light "wheat + coffee"** theme (warm cream surfaces `#F6EBD2` / `#EEDFBE`, brown primary `#6B4A2E`) — no light/dark switching. To go dark: base on `MD3DarkTheme` + `DarkTheme` (from `@react-navigation/native`) + dark `brand` values (a full "earth + wheat" dark palette is recorded in the `theme-palettes` memory).
  - `navigationTheme` — React Navigation theme (`DefaultTheme` base) built from the same `appTheme.colors`.
- `src/theme/useAppTheme.ts` — `useAppTheme()`, a typed `useTheme<MD3Theme>()` wrapper. `src/theme/index.ts` re-exports `appTheme`, `navigationTheme`, `useAppTheme`.
- **Screens get colors only from `useAppTheme()`** — never hard-code hex. Pattern: `const styles = useMemo(() => makeStyles(theme), [theme])` where `makeStyles(theme: MD3Theme)` returns `StyleSheet.create({...})` referencing `theme.colors.*`. See any of the 3 screens.

### Safe area & keyboard

Android draws the app **edge-to-edge** (RN 0.81+), so content runs under the status bar and under the system navigation bar. Nothing is inset for free.

- What already handles itself: the bottom tab bar and every `headerShown: true` screen — `BottomTabView` and the navigation `Header` apply insets internally. Those four tabs (Map / Create / `?` / Profile) need no wrapper.
- What must wrap itself: any screen with no header. `Home` (`headerShown: false`) and the whole auth stack (`headerShown: false`).
- **`src/components/Screen.tsx`** — `SafeAreaView` + themed background, `edges` defaults to `['top']` (inside tabs the bar covers the bottom). Use it for plain screens.
- **`src/components/KeyboardAwareScreen.tsx`** — the form variant: safe area (`['top','bottom']` by default) + `ScrollView` that pulls the focused field into the **centre of the visible area** instead of leaving it at the edge of the keyboard.
  - `FormTextInput` reports its wrapper via `useFieldFocus()` on focus; the container measures with `measureInWindow` and scrolls by the difference. Geometry is in screen coordinates on purpose, so the same math holds whether the window is resized by `adjustResize` or merely covered by the keyboard under edge-to-edge — the visible bottom is `min(scrollView bottom, keyboard top)`.
  - The viewport is re-measured on every focus rather than trusted from `onLayout`, because a screen can arrive via a stack transition.
  - A spacer at the end of the content grows while the keyboard is up; without it the last field hits the end of the content and can never reach the centre.
  - Hand-rolled on purpose: `KeyboardAvoidingView` only shrinks the container (field ends up flush against the keyboard), and `react-native-keyboard-controller` is a native module absent from Expo Go, which is how this app is debugged.
- A new screen without a header **must** use one of these two wrappers. A new form field must go through `FormTextInput`, or it will not be centred.

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
- Only the last step touches the network (`useAuth().signUp`); steps 1-2 are pure local validation. The step-2 fields (`name`, `specialization`, `region`) mirror the `profiles` columns exactly — the schema has no first/last-name or nickname column, so do not reintroduce them in the form.

### Backend — Supabase

The whole backend is one hosted Supabase project (`api-docs/` holds the schema doc the backend team ships). There is **no** custom HTTP client any more: `supabase-js` is the only transport, and it attaches the JWT, refreshes it and persists the session itself.

- **`src/services/supabase/`** — the shared layer, everything a feature cannot own alone:
  - `client.ts` — the single `createClient<Database>()`. Session lives in `AsyncStorage` (`persistSession`, `autoRefreshToken`, `detectSessionInUrl: false`). Throws at import time with a readable message if `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are missing — an EAS build without `.env` must fail loudly, not silently ship `undefined`.
  - `errors.ts` — `toUserMessage(error)`: the only place a Supabase error becomes screen text. Maps known `AuthError.code` and Postgres SQLSTATE/PostgREST codes to Russian; everything else collapses to a generic line. Never show `error.message` to the user — it is English and leaks RLS details.
  - `dictionaries.ts` — `post_types`, `post_stages`, `post_statuses`, `reaction_types`, `crops`. Match on `code`, never on hard-coded ids.
  - `storage.ts` — the two buckets. `avatars` is public (`getAvatarUrl` builds the URL locally); `post-media` is private (`getPostMediaUrl` / `getPostMediaUrls` sign it). Both bucket policies require the object path to start with the user id, so `userId` is a required argument. RN has only a file URI, so uploads go through `fetch(uri).arrayBuffer()` — passing the URI or a Blob uploads a 0-byte file.
- **`src/services/profile/`** — `getProfile` / `updateProfile`. Sits in services rather than the profile feature because `AuthProvider` needs it too. The `profiles` row is created by a DB trigger on sign-up; the client never inserts it.
- **`src/types/database.types.ts`** — generated from the live schema; `npm run types:supabase` refreshes it. `api-docs/database.types.ts` is the incoming copy from the backend team — import from `src/types`, never from `api-docs/`.
- **Env** — `.env` (gitignored) + `.env.example` both carry the real URL and publishable key. That key is designed for clients and is baked into the APK bundle regardless; the secret `service_role` key must never reach the app.

### Auth — the session

`AuthProvider` + `useAuth()` → `{ status, user, profile, error, signIn, signUp, signOut, refreshProfile }`.

- **Source of truth is `supabase.auth.onAuthStateChange`.** The callback is deliberately synchronous (only dispatches) — awaiting inside it can deadlock the Supabase client. `getSession()` is also called once at mount as a fallback so a missing `INITIAL_SESSION` cannot strand the app on the blank `loading` screen.
- `user` is the Supabase `User` (id, email). `profile` is the `profiles` row, loaded by a separate effect once the session exists — it can legitimately be `null`, so screens must tolerate that.
- **`status`: `loading | authenticating | registering | authenticated | unauthenticated`.** `registering` carries design weight: email confirmation is disabled on the backend (`mailer_autoconfirm: true`), so `signUp` returns a live session *before* the profile row is filled in. Without that state the listener would flip to `authenticated` and swap the navigator to the tabs mid-write. The reducer refuses to promote a session to `authenticated` while the status is `registering`.
- **Registration is a 3-step wizard** (email → name/specialization/region → password) and hits the network exactly once, on the last step: `signUp(payload)` → `supabase.auth.signUp()` → `updateProfile()` → `authenticated`. It returns `boolean`; the screen shows `error` and stays put on `false`.
  - `signUp` keeps the created user in a ref. If the account was created but the profile write failed (network drop between the two calls), a retry skips the auth call — retrying it would fail with "email already registered" and strand a user who *does* have an account. That is also why the failure path keeps the status at `registering` instead of dropping to `unauthenticated`.
  - There is no e-mail step and no OTP: nothing is verified, so "this email is taken" surfaces only at the final submit.
  - `authApi.signUpWithPassword` throws explicitly when Supabase returns no session — that happens only if the backend re-enables email confirmation, and a loud error beats a hung screen.
- `signIn` is plain `signInWithPassword`; the status flip is left to the listener. `signOut` clears the Supabase session (and treats a network failure as signed-out anyway).
- Cold start needs no network: `supabase-js` restores the session from `AsyncStorage`, so a stored session opens straight into the tabs offline.

### Data access per feature

Screens never touch `supabase` directly — they go through a feature `repository/` (and usually a thin hook next to it).

- `features/map/repository/fieldsRepository.ts` + `hooks/useFields.ts` — CRUD over `fields`. The domain type is `{ latitude, longitude }`; writes serialize to WKT `POINT(lon lat)` (**longitude first**). Reads deliberately do **not** select `center` / `boundary`: PostgREST returns PostGIS columns as hex EWKB, which is why the generated types say `unknown`. **TODO(backend):** a view/RPC with `st_asgeojson` is needed before the map can draw anything.
- `features/home/repository/postsRepository.ts` + `hooks/useFeed.ts` — the feed: one select with all joins (author profile, crop, type, stage, status, media) instead of N follow-up queries. Filtering on an embedded table needs `!inner`, otherwise PostgREST nulls the embedded object instead of dropping the parent row — hence `feedSelect(innerPostType)`.
- The hooks are intentionally hand-rolled (`loading` / `error` / `reload`, no cache). When caching actually becomes a problem, react-query slots in behind the same hook signature and no screen changes.
- Not wrapped yet, by design: `post_reactions`, `answers`, `answer_votes` — trivial insert/delete that should be written against the screen that needs them.


### Folder layout — where code goes

```
src/
├── app/                    # (empty) reserved for future navigator/route config
├── navigation/             # composition root: RootNavigator (auth gate), MainTabs, types.ts
├── features/               # one folder per feature; a feature owns its screens + the code only it uses
│   ├── home/               # the one real tab (demo counter) + the feed data layer:
│   │                       #   repository/postsRepository.ts, hooks/useFeed.ts, screens/
│   ├── create/  placeholder/  profile/   # tab placeholders (profile also holds the logout button)
│   ├── auth/               # auth UI: screens/ (+ screens/register/ wizard), navigation/ (Auth + nested Register),
│   │                       #   schemas/ (zod), forms/RegisterFormProvider.tsx, components/ (FormTextInput, RegisterStepLayout)
│   │                       #   (session logic lives in src/services/auth — see "Auth — the session")
│   └── map/                # the "Карта" tab (placeholder screen) + reference feature template:
│       ├── components/     #   UI used only by this feature
│       ├── hooks/          #   hooks used only by this feature (useFields)
│       ├── repository/     #   data access for this feature — the only place that talks to Supabase
│       └── screens/        #   the feature's screens
├── components/             # shared "dumb" UI reused across features — Icon.tsx; add Button, Card, ...
├── hooks/                  # (empty) shared hooks — useDebounce, useKeyboardVisible, ...
├── utils/                  # (empty) pure functions, formatters, constants
├── services/               # app-wide singletons:
│   ├── supabase/           #   client + errors + dictionaries + storage
│   ├── auth/               #   session (AuthProvider / useAuth)
│   └── profile/            #   profiles row — needed by both AuthProvider and the profile tab
├── theme/                  # Paper theme (theme.ts) + useAppTheme — the app's one palette (see "UI & theming")
└── types/                  # database.types.ts (generated) + global TS types
```

New screen → `src/features/<feature>/screens/`, and register the route in `src/navigation/types.ts` + the relevant navigator. Component/hook used by one feature → that feature's folder; used by two or more → `src/components/` or `src/hooks/`.

### Import rules

- A feature **must not** import from another feature. Shared code moves up to `src/components`, `src/hooks`, `src/utils`, `src/services`, `src/theme`, or `src/types`.
- Allowed direction: `features/*` → `components|hooks|utils|services` → (leaf, no `src/` imports). Never the reverse (shared code never imports a feature).
- **`App.tsx` and `src/navigation/` are the composition root** — they may import from any feature (that's their job: wiring). Features still must not import each other.
- `src/theme` and `src/types` are foundational — any layer may import them (e.g. `src/components/Icon.tsx` uses `useAppTheme`).
- Screens read/write data only through a `repository/` (feature) or `src/services/` layer, never `supabase`/`AsyncStorage`/`fetch` directly — so the source can be swapped later.
- **Imports across top-level folders use the `@/` alias** (`@/services/auth`, `@/theme`, `@/navigation/types`). Inside a feature stay relative (`../components/FormTextInput`) — a neighbouring file reads worse through an alias than through `./`. `tsconfig.json` is `strict`.

### Project status

This is a **contest-app boilerplate**, not a finished product. Despite the `agro-connect` repo name, the app is an auth flow (real Login form + 3-step Register wizard, both against Supabase) in front of a 5-tab shell where only Home (a demo counter) has content — Map / Create / `?` / Profile are placeholders (Profile now shows the real `profiles` row). The Supabase data layer is wired and typed, but **no screen calls the feed or fields repositories yet** — they were written ahead of the UI and have not been exercised against live data. `SPEC.md` still has open questions about the actual app idea. A prior commit added a full `src/map/` agricultural-field feature (map view, weather tile overlay, AsyncStorage field repository, mocked other-users' markers) that was **reverted** — check `git show 7a5c58a` if that direction is revived (its data-access layer maps onto `src/features/map/repository/`). Read and update `SPEC.md` before building real features.

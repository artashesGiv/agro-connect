# Contest App

Минимальная Android-заготовка на Expo SDK 57, React Native и TypeScript. Проект подготовлен для разработки с Codex и сборки устанавливаемого APK через EAS Build.

## Требования

- Node.js 24 LTS или Node.js 22.13+.
- npm.
- Expo Go на Android-телефоне для быстрой разработки.
- Аккаунт Expo для EAS Build и Expo MCP.
- Для локальной нативной сборки: Android Studio, Android SDK 36 и JDK 17.

## Запуск

```bash
nvm use
npm ci
npm start
```

Отсканируйте QR-код приложением Expo Go. Для запуска на Android-эмуляторе используйте:

```bash
npm run android
```

## Проверки

```bash
npm run typecheck
npm run doctor
npm run check
```

## Сборка APK

В первый раз авторизуйтесь и запустите сборку:

```bash
npx eas-cli@latest login
npm run build:apk
```

Профиль `preview` в `eas.json` создаёт APK, который можно скачать из EAS и установить напрямую. Перед финальной сдачей замените `com.a1.contestapp` в `app.json` на окончательный уникальный package id.

## Codex и Expo

На компьютере должен быть установлен официальный плагин Expo и зарегистрирован MCP-сервер:

```bash
codex plugin add expo@openai-curated
codex mcp add expo --url https://mcp.expo.dev/mcp
codex mcp login expo
```

После подключения запускайте новую сессию Codex из корня проекта. Codex прочитает `AGENTS.md` и `SPEC.md`. Для локальных MCP-возможностей можно установить `expo-mcp` и запускать сервер командой `npm run start:mcp`.

## Основные файлы

- `App.tsx` — стартовый экран.
- `SPEC.md` — требования и критерии готовности.
- `AGENTS.md` — правила разработки для Codex.
- `app.json` — настройки Expo и Android package id.
- `eas.json` — профили APK/AAB сборок.

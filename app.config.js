module.exports = {
  expo: {
    name: 'Contest App',
    slug: 'contest-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'contestapp',
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.a1.contestapp',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Приложению нужен доступ к геолокации, чтобы показать ваше текущее местоположение на карте полей.',
        },
      ],
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '7a757b90-93f5-45a7-a785-b4d6a518ba06',
      },
    },
  },
};

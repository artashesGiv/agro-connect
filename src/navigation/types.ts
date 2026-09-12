import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootTabParamList = {
  Home: undefined;
  /**
   * Параметры приходят со вкладки профиля: `focusFieldId` — подлететь к полю,
   * `openCard` — заодно открыть его карточку. Карта их обнуляет, как только
   * отработает, иначе возврат на вкладку каждый раз повторял бы перелёт.
   */
  Map: { focusFieldId?: string; openCard?: boolean } | undefined;
  Create: undefined;
  Placeholder: undefined;
  /** `refresh` — после создания поста мастером: перечитать ленту «Мои посты». */
  Profile: { refresh?: boolean } | undefined;
};

/**
 * Стек над таб-навигатором: детальные экраны поста доступны и с «Главной», и с
 * «Профиля», поэтому подняты сюда (а не в стек одной вкладки).
 */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  PostDetail: { postId: string };
  EditPost: { postId: string };
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
};

/** Экраны вкладок, которым нужен переход в `AppStack` (PostDetail/EditPost). */
type TabScreenProps<T extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;

export type HomeScreenProps = TabScreenProps<'Home'>;
export type MapScreenProps = BottomTabScreenProps<RootTabParamList, 'Map'>;
export type CreateScreenProps = BottomTabScreenProps<RootTabParamList, 'Create'>;
export type PlaceholderScreenProps = BottomTabScreenProps<
  RootTabParamList,
  'Placeholder'
>;
export type ProfileScreenProps = TabScreenProps<'Profile'>;

export type PostDetailScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'PostDetail'
>;
export type EditPostScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'EditPost'
>;
export type SettingsScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'Settings'
>;
export type EditProfileScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'EditProfile'
>;
export type ChangePasswordScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'ChangePassword'
>;
export type NotificationsScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'Notifications'
>;

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export type RegisterStackParamList = {
  RegisterEmail: undefined;
  RegisterProfile: undefined;
  RegisterPassword: undefined;
};

export type RegisterEmailScreenProps = NativeStackScreenProps<
  RegisterStackParamList,
  'RegisterEmail'
>;
export type RegisterProfileScreenProps = NativeStackScreenProps<
  RegisterStackParamList,
  'RegisterProfile'
>;
export type RegisterPasswordScreenProps = NativeStackScreenProps<
  RegisterStackParamList,
  'RegisterPassword'
>;

export type CreateStackParamList = {
  CreateTitle: undefined;
  CreateBody: undefined;
  CreatePhotos: undefined;
  CreateField: undefined;
  CreatePreview: undefined;
};

export type CreateTitleScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'CreateTitle'
>;
export type CreateBodyScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'CreateBody'
>;
export type CreatePhotosScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'CreatePhotos'
>;
export type CreateFieldScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'CreateField'
>;
export type CreatePreviewScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'CreatePreview'
>;

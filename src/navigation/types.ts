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
  Questions: undefined;
  /**
   * `refresh` — после создания поста мастером: перечитать ленту «Мои посты».
   * `notice` — разовое сообщение показать в Snackbar (например, «пост
   * сохранён и уйдёт при подключении к сети» при офлайн-создании).
   */
  Profile: { refresh?: boolean; notice?: string } | undefined;
};

/**
 * Стек над таб-навигатором: детальные экраны поста доступны и с «Главной», и с
 * «Профиля», поэтому подняты сюда (а не в стек одной вкладки).
 */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  /** `openSummaryJobId` — открыть окно с готовым AI-разбором сразу после
   *  перехода (тап по уведомлению `post_summary_ready`/`post_summary_failed`).
   *  Экран чистит параметр сам, как только откроет окно. */
  PostDetail: { postId: string; openSummaryJobId?: string };
  EditPost: { postId: string };
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  /** Чужой профиль (карточка чужого поля → «Профиль»); свой профиль — вкладка. */
  UserProfile: { userId: string };
  /** Карточка своего поля на карте → «Связанные посты»: посты + вопросы этого поля. */
  RelatedPosts: { fieldId: string; fieldName: string };
};

/** Экраны вкладок, которым нужен переход в `AppStack` (PostDetail/EditPost/...). */
type TabScreenProps<T extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;

export type HomeScreenProps = TabScreenProps<'Home'>;
/** Композит с `AppStack`: карточка чужого поля уводит на `UserProfile`. */
export type MapScreenProps = TabScreenProps<'Map'>;
export type CreateScreenProps = BottomTabScreenProps<RootTabParamList, 'Create'>;
export type QuestionsScreenProps = TabScreenProps<'Questions'>;
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
export type UserProfileScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'UserProfile'
>;
export type RelatedPostsScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'RelatedPosts'
>;

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
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
  CreatePhotos: undefined;
  CreateField: undefined;
  CreatePreview: undefined;
};

export type CreateTitleScreenProps = NativeStackScreenProps<
  CreateStackParamList,
  'CreateTitle'
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

import { NavigatorScreenParams } from '@react-navigation/native';
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
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;
export type MapScreenProps = BottomTabScreenProps<RootTabParamList, 'Map'>;
export type CreateScreenProps = BottomTabScreenProps<RootTabParamList, 'Create'>;
export type PlaceholderScreenProps = BottomTabScreenProps<
  RootTabParamList,
  'Placeholder'
>;
export type ProfileScreenProps = BottomTabScreenProps<RootTabParamList, 'Profile'>;

export type ProfileStackParamList = {
  ProfileMain: undefined;
  PostDetail: { postId: string };
  EditPost: { postId: string };
};

export type ProfileMainScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  'ProfileMain'
>;
export type PostDetailScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  'PostDetail'
>;
export type EditPostScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  'EditPost'
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

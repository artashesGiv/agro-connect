import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootTabParamList = {
  Home: undefined;
  Map: undefined;
  Create: undefined;
  Placeholder: undefined;
  Profile: undefined;
};

export type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;
export type MapScreenProps = BottomTabScreenProps<RootTabParamList, 'Map'>;
export type CreateScreenProps = BottomTabScreenProps<RootTabParamList, 'Create'>;
export type PlaceholderScreenProps = BottomTabScreenProps<
  RootTabParamList,
  'Placeholder'
>;
export type ProfileScreenProps = BottomTabScreenProps<RootTabParamList, 'Profile'>;

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export type RegisterStackParamList = {
  RegisterEmail: undefined;
  RegisterCode: undefined;
  RegisterProfile: undefined;
  RegisterPassword: undefined;
};

export type RegisterEmailScreenProps = NativeStackScreenProps<
  RegisterStackParamList,
  'RegisterEmail'
>;
export type RegisterCodeScreenProps = NativeStackScreenProps<
  RegisterStackParamList,
  'RegisterCode'
>;
export type RegisterProfileScreenProps = NativeStackScreenProps<
  RegisterStackParamList,
  'RegisterProfile'
>;
export type RegisterPasswordScreenProps = NativeStackScreenProps<
  RegisterStackParamList,
  'RegisterPassword'
>;

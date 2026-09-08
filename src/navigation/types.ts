import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootTabParamList = {
  Home: undefined;
  Data: undefined;
  Settings: undefined;
};

export type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;
export type DataScreenProps = BottomTabScreenProps<RootTabParamList, 'Data'>;
export type SettingsScreenProps = BottomTabScreenProps<RootTabParamList, 'Settings'>;

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

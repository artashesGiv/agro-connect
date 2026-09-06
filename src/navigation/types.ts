import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootTabParamList = {
  Home: undefined;
  Data: undefined;
  Settings: undefined;
};

export type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;
export type DataScreenProps = BottomTabScreenProps<RootTabParamList, 'Data'>;
export type SettingsScreenProps = BottomTabScreenProps<RootTabParamList, 'Settings'>;

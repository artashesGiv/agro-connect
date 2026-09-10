import { View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Карта" />
      <ScreenPlaceholder text="Карта — в разработке" />
    </View>
  );
}

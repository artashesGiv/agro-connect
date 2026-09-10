import { CreatePostProvider } from '../forms/CreatePostProvider';
import { CreateNavigator } from '../navigation/CreateNavigator';

/**
 * Вкладка «Создать» — контейнер мастера: одна форма (`CreatePostProvider`) на все
 * шаги вложенного навигатора. `headerShown: false` у вкладки — шапку рисует
 * `CreateStepLayout`.
 */
export default function CreateScreen() {
  return (
    <CreatePostProvider>
      <CreateNavigator />
    </CreatePostProvider>
  );
}

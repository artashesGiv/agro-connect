import { RegisterFormProvider } from '../forms/RegisterFormProvider';
import { RegisterNavigator } from '../navigation/RegisterNavigator';

/**
 * Экран `Register` в `AuthNavigator` — контейнер мастера регистрации:
 * одна форма (`RegisterFormProvider`) на все 4 шага вложенного навигатора.
 */
export default function RegisterScreen() {
  return (
    <RegisterFormProvider>
      <RegisterNavigator />
    </RegisterFormProvider>
  );
}

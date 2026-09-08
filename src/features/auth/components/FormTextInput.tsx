import { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';

type FormTextInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
} & Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'label' | 'right'
>;

/**
 * Мост react-hook-form ↔ Paper `TextInput`. Ошибка поля (из zod-схемы)
 * показывается под инпутом. Если задан `secureTextEntry` — добавляет глазок
 * показать/скрыть. Паттерн для всех форм проекта.
 */
export function FormTextInput<T extends FieldValues>({
  control,
  name,
  label,
  secureTextEntry,
  ...inputProps
}: FormTextInputProps<T>) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={styles.field}>
          <TextInput
            mode="outlined"
            label={label}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={Boolean(error)}
            secureTextEntry={secureTextEntry ? hidden : undefined}
            right={
              secureTextEntry ? (
                <TextInput.Icon
                  icon={hidden ? 'eye-off' : 'eye'}
                  onPress={() => setHidden((prev) => !prev)}
                  forceTextInputFocus={false}
                  accessibilityLabel={hidden ? 'Показать пароль' : 'Скрыть пароль'}
                />
              ) : undefined
            }
            {...inputProps}
          />
          <HelperText type="error" visible={Boolean(error)}>
            {error?.message ?? ' '}
          </HelperText>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
  },
});

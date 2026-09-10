import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Dialog, HelperText, Portal } from 'react-native-paper';

import { FormTextInput } from '@/components/FormTextInput';

import { fieldSchema, type FieldFormValues } from '../schemas/fieldSchema';

type FieldFormDialogProps = {
  visible: boolean;
  defaults: FieldFormValues;
  saving: boolean;
  /** Ошибка сохранения — показывается в самом диалоге. */
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: FieldFormValues) => void;
};

/**
 * Название и регион для только что нарисованного поля.
 *
 * Диалог, а не отдельный экран: два поля не стоят вложенного навигатора, а
 * карта под диалогом остаётся видна — пользователь не теряет из виду то, что
 * нарисовал. `PaperProvider` уже даёт `Portal.Host`, добавлять ничего не нужно.
 */
export function FieldFormDialog({
  visible,
  defaults,
  saving,
  error,
  onCancel,
  onSubmit,
}: FieldFormDialogProps) {
  const { control, handleSubmit, reset } = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  // Диалог не размонтируется между показами, поэтому значения по умолчанию
  // (в том числе «Поле N» с новым номером) подставляем при каждом открытии.
  useEffect(() => {
    if (visible) reset(defaults);
  }, [visible, defaults, reset]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? () => {} : onCancel} dismissable={!saving}>
        <Dialog.Title>Новое поле</Dialog.Title>
        <Dialog.Content>
          <FormTextInput control={control} name="name" label="Название" autoFocus />
          <FormTextInput control={control} name="region" label="Регион" />
          {error ? (
            // Показываем прямо здесь, а не снекбаром: снекбар ушёл бы под
            // диалог, а нарисованное поле мы намеренно не сбрасываем.
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel} disabled={saving}>
            Отмена
          </Button>
          <Button onPress={handleSubmit(onSubmit)} loading={saving} disabled={saving}>
            Сохранить
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

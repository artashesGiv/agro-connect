import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Dialog, HelperText, Portal, RadioButton, Text } from 'react-native-paper';

import { type Field, updateFieldStage } from '@/services/fields';
import { dictionaries, toUserMessage, type PostStage } from '@/services/supabase';

type Props = {
  field: Field;
  onClose: () => void;
  onSaved: () => void;
};

/** Один выбор из справочника `post_stages`, плюс возможность снять статус. */
export function FieldStageDialog({ field, onClose, onSaved }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(field.current_stage_id);
  const [options, setOptions] = useState<PostStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    dictionaries.getPostStages().then((data) => {
      // «Проблема» временно скрыта из выбора — не отменяем её у уже выставленных полей.
      if (active) setOptions(data.filter((stage) => stage.code !== 'problem'));
    }).catch((cause: unknown) => {
      if (active) setLoadError(toUserMessage(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateFieldStage(field.id, selectedId);
      onSaved();
    } catch (cause) {
      setSaveError(toUserMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onClose} dismissable={!saving} dismissableBackButton={!saving}>
        <Dialog.Title>Статус</Dialog.Title>
        <Dialog.ScrollArea style={styles.area}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text variant="bodyMedium">{field.name}</Text>
            {loading ? <ActivityIndicator accessibilityLabel="Загрузка статусов" /> : loadError ? (
              <>
                <HelperText type="error">{loadError}</HelperText>
                <Button onPress={() => setAttempt((value) => value + 1)}>Повторить</Button>
              </>
            ) : (
              <RadioButton.Group
                value={selectedId === null ? 'none' : String(selectedId)}
                onValueChange={(value) => setSelectedId(value === 'none' ? null : Number(value))}
              >
                <RadioButton.Item
                  label="Не указано"
                  value="none"
                  disabled={saving}
                  style={styles.option}
                />
                {options.map((stage) => (
                  <RadioButton.Item
                    key={stage.id}
                    label={stage.name}
                    value={String(stage.id)}
                    disabled={saving}
                    style={styles.option}
                  />
                ))}
              </RadioButton.Group>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        {saveError ? <HelperText type="error" style={styles.error}>{saveError}</HelperText> : null}
        <Dialog.Actions>
          <Button disabled={saving} onPress={onClose}>Отмена</Button>
          <Button mode="contained" loading={saving} disabled={saving || loading || loadError !== null}
            onPress={() => void save()}>Сохранить</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  area: { maxHeight: 420 },
  scroll: { flexShrink: 1 },
  content: { paddingVertical: 12, gap: 12 },
  option: { minHeight: 48 },
  error: { marginHorizontal: 24 },
});

import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Checkbox, Dialog, HelperText, List, Portal, RadioButton, Text } from 'react-native-paper';

import { type Field, type FieldCrop, updateFieldCrops } from '@/services/fields';
import { dictionaries, toUserMessage } from '@/services/supabase';

type Props = {
  field: Field;
  onClose: () => void;
  onSaved: () => void;
};

/** Mounted for one editing session, so cancelling discards the draft. */
export function FieldCropsDialog({ field, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<FieldCrop[]>(field.crops);
  const [primaryId, setPrimaryId] = useState<number | null>(
    field.crops.find((crop) => crop.id === field.current_crop?.id)?.id ?? field.crops[0]?.id ?? null,
  );
  const [options, setOptions] = useState<FieldCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [expanded, setExpanded] = useState<'all' | 'primary' | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    dictionaries.getCrops().then((data) => {
      if (active) {
        // Keep existing selections available even if a crop was deactivated.
        setOptions([...new Map([...field.crops, ...data].map((crop) => [crop.id, crop])).values()]
          .sort((a, b) => a.name.localeCompare(b.name, 'ru')));
      }
    }).catch((cause: unknown) => {
      if (active) setLoadError(toUserMessage(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [field.id, attempt]);

  const toggle = (crop: FieldCrop) => {
    const next = selected.some((item) => item.id === crop.id)
      ? selected.filter((item) => item.id !== crop.id)
      : [...selected, crop];
    setSelected(next);
    if (!next.some((item) => item.id === primaryId)) setPrimaryId(next[0]?.id ?? null);
    setSaveError(null);
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await updateFieldCrops(field.id, selected, selected.find((crop) => crop.id === primaryId) ?? null);
      onSaved();
    } catch (cause) {
      setSaveError(toUserMessage(cause));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const primary = selected.find((crop) => crop.id === primaryId);
  return (
    <Portal>
      <Dialog visible onDismiss={onClose} dismissable={!saving} dismissableBackButton={!saving}>
        <Dialog.Title>Культуры</Dialog.Title>
        <Dialog.ScrollArea style={styles.area}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text variant="bodyMedium">{field.name}</Text>
            {loading ? <ActivityIndicator accessibilityLabel="Загрузка культур" /> : loadError ? (
              <View>
                <HelperText type="error">{loadError}</HelperText>
                <Button onPress={() => setAttempt((value) => value + 1)}>Повторить</Button>
              </View>
            ) : (
              <>
                <List.Accordion
                  title="Все культуры поля"
                  description={selected.map((crop) => crop.name).join(', ') || 'Не выбраны'}
                  expanded={expanded === 'all'}
                  onPress={() => !saving && setExpanded(expanded === 'all' ? null : 'all')}
                  accessibilityLabel="Выбрать все культуры поля"
                >
                  {options.length === 0 ? <Text>Нет доступных культур</Text> : options.map((crop) => (
                    <Checkbox.Item key={crop.id} label={crop.name} accessibilityLabel={crop.name}
                      status={selected.some((item) => item.id === crop.id) ? 'checked' : 'unchecked'}
                      disabled={saving} onPress={() => toggle(crop)} style={styles.option} />
                  ))}
                </List.Accordion>
                <List.Accordion
                  title="Основная культура"
                  description={primary?.name ?? 'Сначала выберите культуры поля'}
                  expanded={expanded === 'primary' && selected.length > 0}
                  onPress={() => !saving && selected.length > 0 && setExpanded(expanded === 'primary' ? null : 'primary')}
                  accessibilityLabel="Выбрать основную культуру"
                >
                  {selected.map((crop) => (
                    <RadioButton.Item key={crop.id} value={String(crop.id)} label={crop.name}
                      accessibilityLabel={`Основная культура: ${crop.name}`}
                      status={primaryId === crop.id ? 'checked' : 'unchecked'} disabled={saving}
                      onPress={() => { setPrimaryId(crop.id); setExpanded(null); setSaveError(null); }}
                      style={styles.option} />
                  ))}
                </List.Accordion>
              </>
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

import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Field, FieldGeometry, Coordinate, OtherUserMarker } from '../types';

interface MarkerDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  mode: 'create' | 'view' | 'edit';
  field?: Field;
  otherMarker?: OtherUserMarker;
  onSave?: (field: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete?: () => Promise<void>;
  userOwnerId?: string;
  drawingMode?: boolean;
  drawnCoordinates?: Coordinate[];
  onStartDrawing?: () => void;
  onFinishDrawing?: () => void;
}

export const MarkerDetailSheet = ({
  visible,
  onClose,
  mode,
  field,
  otherMarker,
  onSave,
  onDelete,
  userOwnerId,
  drawingMode = false,
  drawnCoordinates = [],
  onStartDrawing,
  onFinishDrawing,
}: MarkerDetailSheetProps) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [geometryKind, setGeometryKind] = useState<'point' | 'polygon'>('point');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (field && (mode === 'view' || mode === 'edit')) {
      setName(field.name);
      setNotes(field.notes || '');
      setGeometryKind(field.geometry.kind);
    } else {
      setName('');
      setNotes('');
      setGeometryKind('point');
    }
  }, [field, mode, visible]);

  const isOwnField = !field || field.ownerId === userOwnerId;
  const isReadOnly = mode === 'view' || !isOwnField || !!otherMarker;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название поля');
      return;
    }

    if (mode === 'create' && geometryKind === 'polygon' && drawnCoordinates.length < 3) {
      Alert.alert('Ошибка', 'Полигон должен содержать минимум 3 точки');
      return;
    }

    setLoading(true);
    try {
      const geometry: FieldGeometry =
        geometryKind === 'point'
          ? {
              kind: 'point',
              coordinate: field?.geometry.kind === 'point' ? field.geometry.coordinate : drawnCoordinates[0] || { latitude: 55.7558, longitude: 37.6173 },
            }
          : {
              kind: 'polygon',
              coordinates: drawnCoordinates.length > 0 ? drawnCoordinates : (field?.geometry.kind === 'polygon' ? field.geometry.coordinates : []),
            };

      await onSave?.({
        ownerId: userOwnerId || 'unknown',
        name: name.trim(),
        notes: notes.trim() || undefined,
        geometry,
      });

      onClose();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить поле');
      console.error('Error saving field:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Удалить поле?', 'Это действие нельзя отменить', [
      { text: 'Отмена', onPress: () => {} },
      {
        text: 'Удалить',
        onPress: async () => {
          setLoading(true);
          try {
            await onDelete?.();
            onClose();
          } catch (error) {
            Alert.alert('Ошибка', 'Не удалось удалить поле');
            console.error('Error deleting field:', error);
          } finally {
            setLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.backdrop} />
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {otherMarker
                ? 'Метка пользователя'
                : mode === 'create'
                  ? 'Новое поле'
                  : 'Редактировать поле'}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
            >
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {otherMarker ? (
              <View>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Название</Text>
                  <Text style={styles.value}>{otherMarker.title}</Text>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Пользователь</Text>
                  <Text style={styles.value}>{otherMarker.ownerLabel}</Text>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Координаты</Text>
                  <Text style={styles.value}>
                    {otherMarker.coordinate.latitude.toFixed(4)}, {otherMarker.coordinate.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Название *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Название поля"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                    editable={!isReadOnly}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Заметки</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Дополнительные заметки"
                    placeholderTextColor="#64748B"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    editable={!isReadOnly}
                  />
                </View>

                {mode === 'create' && !drawingMode && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Тип геометрии</Text>
                    <View style={styles.buttonGroup}>
                      <Pressable
                        style={[
                          styles.geometryButton,
                          geometryKind === 'point' && styles.geometryButtonActive,
                        ]}
                        onPress={() => setGeometryKind('point')}
                        accessibilityRole="button"
                        accessibilityLabel="Точка"
                      >
                        <Text
                          style={[
                            styles.geometryButtonText,
                            geometryKind === 'point' && styles.geometryButtonTextActive,
                          ]}
                        >
                          📍 Точка
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.geometryButton,
                          geometryKind === 'polygon' && styles.geometryButtonActive,
                        ]}
                        onPress={() => {
                          setGeometryKind('polygon');
                          onStartDrawing?.();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Полигон"
                      >
                        <Text
                          style={[
                            styles.geometryButtonText,
                            geometryKind === 'polygon' && styles.geometryButtonTextActive,
                          ]}
                        >
                          🗺️ Полигон
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {drawingMode && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoText}>
                      🖍️ Тапните на карту чтобы добавить точки полигона ({drawnCoordinates.length} точек)
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {!isReadOnly && mode !== 'create' && !drawingMode && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonDanger,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleDelete}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Удалить"
              >
                <Text style={styles.buttonText}>Удалить</Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={onClose}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Отмена"
            >
              <Text style={styles.buttonTextSecondary}>Отмена</Text>
            </Pressable>

            {!isReadOnly && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonPrimary,
                  (loading || !name.trim()) && styles.buttonDisabled,
                  pressed && !loading && styles.buttonPressed,
                ]}
                onPress={drawingMode ? onFinishDrawing : handleSave}
                disabled={loading || !name.trim()}
                accessibilityRole="button"
                accessibilityLabel={drawingMode ? 'Завершить рисование' : 'Сохранить'}
              >
                <Text style={styles.buttonText}>
                  {drawingMode ? 'Готово' : 'Сохранить'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: '#0B1020',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: '#1E293B',
    borderBottomWidth: 1,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    color: '#94A3B8',
    fontSize: 24,
    fontWeight: '600',
    width: 32,
    height: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 8,
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  geometryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  geometryButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  geometryButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  geometryButtonTextActive: {
    color: '#F8FAFC',
  },
  infoBlock: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    color: '#93C5FD',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  value: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: '#1E293B',
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
  },
  buttonDanger: {
    backgroundColor: '#DC2626',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});

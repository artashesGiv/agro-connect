import { useEffect, useState } from 'react';
import { Field } from '../types';
import { fieldsRepository } from '../repository';

export function useFields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await fieldsRepository.list();
      setFields(data);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const addField = async (input: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newField = await fieldsRepository.create(input);
      setFields((prev) => [...prev, newField]);
      return newField;
    } catch (error) {
      console.error('Error adding field:', error);
      throw error;
    }
  };

  const updateField = async (id: string, patch: Partial<Field>) => {
    try {
      const updated = await fieldsRepository.update(id, patch);
      setFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  };

  const deleteField = async (id: string) => {
    try {
      await fieldsRepository.remove(id);
      setFields((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting field:', error);
      throw error;
    }
  };

  return {
    fields,
    loading,
    addField,
    updateField,
    deleteField,
    refetch: loadFields,
  };
}

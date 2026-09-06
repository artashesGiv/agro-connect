import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Field } from '../types';
import { FieldsRepository } from './fieldsRepository';
import { STORAGE_KEYS } from '../storage/asyncStorageKeys';

export class LocalFieldsRepository implements FieldsRepository {
  async list(): Promise<Field[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FIELDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading fields from storage:', error);
      return [];
    }
  }

  async create(input: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>): Promise<Field> {
    const now = new Date().toISOString();
    const field: Field = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    const fields = await this.list();
    fields.push(field);
    await AsyncStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(fields));
    return field;
  }

  async update(id: string, patch: Partial<Field>): Promise<Field> {
    const fields = await this.list();
    const index = fields.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`Field with id ${id} not found`);
    }

    const updated: Field = {
      ...fields[index],
      ...patch,
      id: fields[index].id,
      createdAt: fields[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    fields[index] = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(fields));
    return updated;
  }

  async remove(id: string): Promise<void> {
    const fields = await this.list();
    const filtered = fields.filter((f) => f.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(filtered));
  }
}

import { Field } from '../types';

export interface FieldsRepository {
  list(): Promise<Field[]>;
  create(input: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>): Promise<Field>;
  update(id: string, patch: Partial<Field>): Promise<Field>;
  remove(id: string): Promise<void>;
}

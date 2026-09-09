import { supabase } from '@/services/supabase';
import type { Tables } from '@/types/database.types';

type FieldRow = Tables<'fields'>;

/**
 * Доменное поле. Геометрия (`center`, `boundary`) сюда НЕ попадает намеренно.
 *
 * TODO(backend): PostgREST отдаёт PostGIS-колонки как hex-строку EWKB
 * (`0101000020E6100000...`), распарсить которую на клиенте без отдельной
 * библиотеки нельзя — в сгенерированных типах они и стоят как `unknown`.
 * Пока не появится view/RPC с `st_asgeojson`, читаем только скалярные колонки,
 * а на запись отправляем WKT.
 */
export type Field = Pick<
  FieldRow,
  'id' | 'owner_id' | 'name' | 'region' | 'created_at' | 'updated_at'
>;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type NewField = {
  name: string;
  region?: string | null;
  center?: Coordinates | null;
};

const FIELD_COLUMNS = 'id, owner_id, name, region, created_at, updated_at';

/** RLS сам ограничит выборку полями текущего пользователя. */
export async function getFields(): Promise<Field[]> {
  const { data, error } = await supabase
    .from('fields')
    .select(FIELD_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getField(id: string): Promise<Field | null> {
  const { data, error } = await supabase
    .from('fields')
    .select(FIELD_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createField(ownerId: string, field: NewField): Promise<Field> {
  const { data, error } = await supabase
    .from('fields')
    .insert({
      // RLS требует owner_id = auth.uid(), сервер его не подставляет.
      owner_id: ownerId,
      name: field.name,
      region: field.region ?? null,
      center: field.center ? toWkbPoint(field.center) : null,
    })
    .select(FIELD_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateField(
  id: string,
  patch: { name?: string; region?: string | null; center?: Coordinates | null },
): Promise<Field> {
  const { data, error } = await supabase
    .from('fields')
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.region !== undefined ? { region: patch.region } : {}),
      ...(patch.center !== undefined
        ? { center: patch.center ? toWkbPoint(patch.center) : null }
        : {}),
    })
    .eq('id', id)
    .select(FIELD_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteField(id: string): Promise<void> {
  const { error } = await supabase.from('fields').delete().eq('id', id);
  if (error) throw error;
}

/** WKT-точка. Порядок в PostGIS — longitude, затем latitude. */
function toWkbPoint({ latitude, longitude }: Coordinates): string {
  return `POINT(${longitude} ${latitude})`;
}

import { Directory, File, Paths } from 'expo-file-system';

const PENDING_DIR_NAME = 'pending-posts';

function pendingDir(): Directory {
  return new Directory(Paths.document, PENDING_DIR_NAME);
}

/**
 * Копирует выбранное фото из временного кэш-каталога пикера (его ОС может
 * очистить в любой момент) в постоянное хранилище приложения. Вызывается при
 * каждом выборе фото — не только когда уже известно, что сети нет: сеть может
 * пропасть и между выбором фото и нажатием «Опубликовать».
 */
export async function persistPickedPhoto(sourceUri: string): Promise<string> {
  const dir = pendingDir();
  if (!dir.exists) dir.create({ intermediates: true });

  const source = new File(sourceUri);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${source.extension || '.jpg'}`;
  const dest = new File(dir, name);
  await source.copy(dest);
  return dest.uri;
}

/** Лучшее усилие: файла может не быть (уже удалён, либо это не локальный URI). */
export function deletePersistedPhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Не критично — максимум лишний файл останется в documentDirectory.
  }
}

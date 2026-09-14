# текущее состояние Supabase

Этот файл описывает то, что **уже создано в текущем Supabase-проекте**, и показывает фронтенду, как с этим работать.

Project URL:

```text
https://kavlgpfxxvicqhzcgspa.supabase.co
```

Publishable key передаётся команде отдельно.

## 1. Общая схема

```text
auth.users
    │
    ▼
profiles
    │
    ├── fields
    │
    ├── posts ─────────── crops
    │      │
    │      ├── post_media
    │      ├── post_reactions
    │      ├── answers (self-ref. parent_answer_id)
    │      │      │
    │      │      └── answer_votes
    │      │
    │      └── post_ai_runs → post_comments (self-ref. parent_comment_id)
    │                              ↑
    │                        system_actors
    │
    └── reputation
```

Справочники:

```text
post_types
post_stages
post_statuses
reaction_types
```

## 2. Auth и `profiles`

Авторизация работает через:

```ts
supabase.auth
```

После создания пользователя в `auth.users` backend-trigger автоматически создаёт строку в `profiles`.

Фронту не нужно отдельно создавать profile после `signUp`.

### Структура `profiles`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | равен `auth.users.id` |
| `name` | text nullable | имя |
| `specialization` | text nullable | специализация |
| `region` | text nullable | регион |
| `avatar_path` | text nullable | путь к аватару |
| `reputation` | integer | репутация, default `0` |
| `created_at` | timestamptz | создан |
| `updated_at` | timestamptz | обновлён |

Получить свой профиль:

```ts
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) throw new Error('Not authenticated')

const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

Обновить:

```ts
const { data, error } = await supabase
  .from('profiles')
  .update({
    name: 'Иван',
    specialization: 'Растениеводство',
    region: '...',
  })
  .eq('id', user.id)
  .select()
  .single()
```

RLS:

- авторизованные пользователи могут читать профили;
- пользователь может изменять только свой профиль.

## 3. Поля — `fields`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | ID поля |
| `owner_id` | uuid | владелец |
| `name` | text | название |
| `region` | text nullable | регион |
| `center` | PostGIS Point nullable | точка |
| `boundary` | PostGIS Polygon nullable | контур |
| `crops` | jsonb | список культур поля |
| `current_crop` | jsonb nullable | текущая культура поля (объект с `id` и т.д.) |
| `current_stage_id` | int nullable, `→ post_stages.id` | текущая аграрная стадия поля |
| `created_at` | timestamptz | создано |
| `updated_at` | timestamptz | обновлено |

`posts.crop_id` синхронизируется сервером (`sync_post_crop_id_from_field()`) из
`fields.current_crop.id` выбранного `field_id` — фронту не нужно (и нельзя)
самому подставлять произвольный `crop_id` при создании поста, привязанного к
полю.

Получить свои поля:

```ts
const { data, error } = await supabase
  .from('fields')
  .select('*')
  .order('created_at', { ascending: false })
```

RLS сам вернёт только поля текущего пользователя.

Создать поле:

```ts
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) throw new Error('Not authenticated')

const { data, error } = await supabase
  .from('fields')
  .insert({
    owner_id: user.id,
    name: 'Поле №1',

    // longitude, затем latitude
    center: 'POINT(24.1052 56.9496)',
  })
  .select()
  .single()
```

`boundary` уже поддерживает Polygon, но frontend может начать только с `center`.

В автоматически сгенерированных типах PostGIS-поля сейчас имеют тип `unknown`. Для map-слоя можно отдельно завести frontend-типы GeoJSON/WKT.

RLS:

- читать только свои поля;
- создавать только с `owner_id = auth.uid()`;
- менять/удалять только свои.

## 4. Культуры — `crops`

| Поле | Описание |
|---|---|
| `id` | ID |
| `slug` | стабильный код |
| `name` | название |
| `is_active` | активна ли культура |
| `created_at` | создана |

Сейчас список культур **ещё не заполнен**.

Получить активные:

```ts
const { data, error } = await supabase
  .from('crops')
  .select('id, slug, name')
  .order('name')
```

## 5. Типы постов — `post_types`

| ID | code | name |
|---:|---|---|
| 1 | `field_update` | Обновление с поля |
| 2 | `question` | Вопрос |

Получить справочник:

```ts
const { data } = await supabase
  .from('post_types')
  .select('*')
```

В UI лучше работать по `code`, а не хардкодить ID.

## 6. Стадии — `post_stages`

| ID | code | name |
|---:|---|---|
| 1 | `sowing` | Посев |
| 2 | `sprouting` | Всходы |
| 3 | `flowering` | Цветение |
| 4 | `problem` | Проблема |
| 5 | `harvest` | Урожай |

```ts
const { data } = await supabase
  .from('post_stages')
  .select('*')
  .order('sort_order')
```

## 7. Статусы — `post_statuses`

| ID | code | name |
|---:|---|---|
| 1 | `open` | Открыт |
| 2 | `solved` | Решён |
| 3 | `closed` | Закрыт |

Это статус публикации/вопроса, а не аграрная стадия.

Например:

```text
stage = problem
status = open
```

## 8. Посты — `posts`

| Поле | Описание |
|---|---|
| `id` | uuid |
| `author_id` | автор |
| `field_id` | поле, nullable |
| `crop_id` | культура, nullable |
| `post_type_id` | тип поста |
| `stage_id` | стадия, nullable |
| `status_id` | статус, nullable |
| `title` | заголовок, nullable |
| `body` | текст, nullable |
| `created_at` | создан |
| `updated_at` | обновлён |

Должен быть заполнен хотя бы `title` или `body`.

### Создать пост

```ts
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) throw new Error('Not authenticated')

const { data: post, error } = await supabase
  .from('posts')
  .insert({
    author_id: user.id,
    post_type_id: 1,
    stage_id: 1,
    field_id: selectedFieldId,
    crop_id: selectedCropId,
    title: 'Посев',
    body: 'Сегодня начали посев.',
  })
  .select()
  .single()
```

Если указан `field_id`, RLS проверяет, что поле принадлежит текущему пользователю.

### Лента

```ts
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    body,
    created_at,

    profiles!posts_author_id_fkey (
      id,
      name,
      specialization,
      region,
      avatar_path,
      reputation
    ),

    crops (
      id,
      slug,
      name
    ),

    post_types (
      code,
      name
    ),

    post_stages (
      code,
      name
    ),

    post_statuses (
      code,
      name
    ),

    post_media (
      id,
      media_type,
      storage_path,
      sort_order
    )
  `)
  .order('created_at', { ascending: false })
  .limit(20)
```

Лента по культуре:

```ts
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('crop_id', cropId)
  .order('created_at', { ascending: false })
```

История поля:

```ts
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('field_id', fieldId)
  .order('created_at', { ascending: false })
```

RLS:

- читать могут авторизованные;
- создавать только от своего `author_id`;
- менять/удалять только свои.

## 9. Медиа — `post_media`

| Поле | Описание |
|---|---|
| `id` | uuid |
| `post_id` | пост |
| `media_type` | `image` или `video` |
| `storage_path` | путь в Storage |
| `sort_order` | порядок |
| `created_at` | создано |

Файл лежит в Storage, таблица хранит только metadata.

### Bucket `post-media`

- private;
- лимит: **100 MB**;
- MIME:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `video/mp4`
  - `video/quicktime`

Путь должен начинаться с ID пользователя:

```text
<USER_ID>/<filename>
```

Загрузка:

```ts
const path = `${user.id}/${crypto.randomUUID()}.jpg`

const arrayBuffer = await fetch(imageUri)
  .then(res => res.arrayBuffer())

const { data: uploaded, error: uploadError } =
  await supabase.storage
    .from('post-media')
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
    })

if (uploadError) throw uploadError
```

После загрузки:

```ts
const { error } = await supabase
  .from('post_media')
  .insert({
    post_id: post.id,
    media_type: 'image',
    storage_path: uploaded.path,
    sort_order: 0,
  })
```

Для показа приватного файла:

```ts
const { data, error } = await supabase.storage
  .from('post-media')
  .createSignedUrl(storagePath, 60 * 10)
```

## 10. Аватары

Bucket:

```text
avatars
```

Настройки:

- public;
- лимит: **5 MB**;
- `image/jpeg`
- `image/png`
- `image/webp`

Путь:

```text
<USER_ID>/<filename>
```

Пример:

```ts
const path = `${user.id}/avatar.jpg`

const arrayBuffer = await fetch(imageUri)
  .then(res => res.arrayBuffer())

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
```

Сохранить путь:

```ts
await supabase
  .from('profiles')
  .update({
    avatar_path: path,
  })
  .eq('id', user.id)
```

Получить URL:

```ts
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(path)

const avatarUrl = data.publicUrl
```

### RLS `storage.objects` для `avatars`

```text
INSERT: (bucket_id = 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text
UPDATE: USING owner_id = auth.uid()::text
        WITH CHECK (storage.foldername(name))[1] = auth.uid()::text
DELETE: owner_id = auth.uid()::text
SELECT: (bucket_id = 'avatars') AND owner_id = auth.uid()::text   -- "users can select own avatar objects"
```

Политика `SELECT` — добавлена бэкендом отдельно (изначально её не было).
`upload(path, body, { upsert: true })` внутри делает проверку существования
объекта (`SELECT`) перед вставкой/обновлением строки в `storage.objects`; без
этой политики RLS блокировал саму проверку, и клиент получал `403 "new row
violates row-level security policy"` на **любую** повторную загрузку аватара
(даже первую, если файл с таким путём уже был создан ранее). Проблема не в
коде приложения — путь и `contentType` формировались верно, `upsert: true`
корректен для файла с фиксированным именем на пользователя.

## 11. Реакции

Справочник `reaction_types`:

| ID | code | name |
|---:|---|---|
| 1 | `same` | У меня так же |
| 2 | `helpful` | Полезно |

Получить:

```ts
const { data } = await supabase
  .from('reaction_types')
  .select('*')
```

Добавить:

```ts
await supabase
  .from('post_reactions')
  .insert({
    post_id: postId,
    user_id: user.id,
    reaction_type_id: reactionTypeId,
  })
```

На уровне БД уникальна комбинация:

```text
post_id + user_id + reaction_type_id
```

Удалить свою реакцию:

```ts
await supabase
  .from('post_reactions')
  .delete()
  .eq('post_id', postId)
  .eq('user_id', user.id)
  .eq('reaction_type_id', reactionTypeId)
```

## 12. Вопросы и ответы

Отдельной таблицы `questions` нет.

Вопрос — это `posts` с:

```text
post_type.code = question
```

Ответы — `answers`.

| Поле | Описание |
|---|---|
| `id` | uuid |
| `post_id` | вопрос/пост |
| `author_id` | автор |
| `body` | текст |
| `parent_answer_id` | uuid nullable, `→ answers.id`, `on delete cascade` — родительский ответ, для древовидных веток |
| `created_at` / `updated_at` | таймстемпы |

Добавить (корневой ответ или ветку — `parent_answer_id` опционален):

```ts
const { data, error } = await supabase
  .from('answers')
  .insert({
    post_id: postId,
    author_id: user.id,
    body: answerText,
    parent_answer_id: replyToAnswerId ?? null,
  })
  .select()
  .single()
```

Получить (сортировка по `created_at`, дерево строится на клиенте из `parent_answer_id`):

```ts
const { data, error } = await supabase
  .from('answers')
  .select(`
    id,
    body,
    created_at,
    parent_answer_id,
    profiles!answers_author_id_fkey (
      id,
      name,
      avatar_path,
      reputation
    )
  `)
  .eq('post_id', postId)
  .order('created_at')
```

Триггер `validate_answer_parent()` проверяет на запись:

- родитель существует;
- `parent.post_id = child.post_id` (нельзя сослаться на ответ из другого поста);
- нельзя сослаться на себя;
- нельзя создать цикл.

При удалении родительского ответа вся его ветка удаляется каскадно
(`on delete cascade`). `answer_votes.answer_id` продолжает ссылаться на
`answers.id` без изменений — голосование работает и для вложенных ответов.

## 13. Голоса за ответы — `answer_votes`

`value` может быть:

```text
1
-1
```

Добавить:

```ts
await supabase
  .from('answer_votes')
  .insert({
    answer_id: answerId,
    user_id: user.id,
    value: 1,
  })
```

Один пользователь может иметь только один vote на конкретный answer.

## 14. ИИ и системные комментарии

Отдельная от `answers` таблица **`post_comments`** — пишет туда только Edge
Function `process-ai-post` (и другая системная автоматика); обычные
пользователи через клиент туда не пишут.

| Поле | Описание |
|---|---|
| `id` | uuid |
| `post_id` | пост |
| `author_id` | uuid nullable — `null` у ИИ/системных комментариев |
| `system_actor_id` | uuid nullable, `→ system_actors.id` — не `null` у ИИ |
| `ai_run_id` | uuid nullable, `→ post_ai_runs.id` (`one-to-one`) |
| `body` | текст |
| `parent_comment_id` | uuid nullable, `→ post_comments.id`, `on delete cascade` — та же логика веток, что и у `answers.parent_answer_id` |
| `created_at` / `updated_at` | таймстемпы |

Читать может фронт (`read-only` со стороны клиента):

```ts
const { data, error } = await supabase
  .from('post_comments')
  .select('id, body, created_at, updated_at, system_actor_id, parent_comment_id')
  .eq('post_id', postId)
  .order('created_at')
```

`system_actors` — справочник системных/ИИ-акторов (`id, code, name,
avatar_path, description`) для случаев, когда `system_actor_id` не `null`, но
своего профиля в `profiles` у актора нет.

`post_ai_runs` — журнал запусков ИИ-генерации ответа: `id, post_id,
requested_by, feature, status, input, result, metadata, error, created_at,
started_at, completed_at, updated_at`. Значения `status`, поведение при
ошибке и стабильность конкретного `system_actor_id` между окружениями не
гарантированы официально — фронт должен опираться только на «`system_actor_id`
не `null`», а не на конкретное значение. RLS не запрещает фронту читать
`post_ai_runs`, но клиент им пока не пользуется.

## 15. Репутация

Уже есть:

```text
profiles.reputation
```

Сейчас default:

```text
0
```

Автоматическое начисление репутации пока **не реализовано**. Это добавим, когда определим правила рангов и очков.

## 16. RLS — кратко

```text
profiles
READ: authenticated
UPDATE: только свой

fields
READ/INSERT/UPDATE/DELETE: только свои

posts
READ: authenticated
INSERT: только от своего author_id
UPDATE/DELETE: только свои

post_media
READ: authenticated
WRITE: только для своих постов

post_reactions
READ: authenticated
INSERT/DELETE: только от своего user_id

answers
READ: authenticated
INSERT/UPDATE/DELETE: только свои
(parent_answer_id: тот же post_id, без self-parent/циклов — валидируется триггером)

answer_votes
READ: authenticated
INSERT/UPDATE/DELETE: только свои

post_comments / post_ai_runs / system_actors
READ: authenticated
WRITE: только сервис (Edge Function), фронт не пишет
```

Справочники доступны на чтение клиенту.

## 17. `public.users` — НЕ ИСПОЛЬЗОВАТЬ

В проекте осталась старая тестовая таблица:

```text
public.users
```

с полями вроде:

```text
email
password
age
```

Новый frontend её не использует.

Авторизация:

```text
auth.users
```

Данные профиля:

```text
profiles
```

Доступ frontend-ролей к старой `public.users` закрыт.

Пароль пользователя самостоятельно в БД не храним.

## 18. Что пока не сделано

- список `crops`;
- правила начисления `reputation`;
- ранги;
- accepted answer;
- дополнительные реакции;
- дополнительные типы/статусы;
- специализированные RPC / Edge Functions;
- Realtime;
- специализированные geo-query функции.

## 19. `database.types.ts`

Файл сгенерирован из текущей Supabase schema.

Подключение:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

Aliases:

```ts
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database.types'

export type Post = Tables<'posts'>
export type NewPost = TablesInsert<'posts'>
export type UpdatePost = TablesUpdate<'posts'>

export type Profile = Tables<'profiles'>
export type Field = Tables<'fields'>
```

После любого изменения schema `database.types.ts` нужно перегенерировать.

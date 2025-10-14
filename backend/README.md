# 📚 README — Instagram‑style Full‑Stack (Backend + Frontend)




## Технологии

### Backend
- **Node.js** + **Express** — HTTP API.
- **MongoDB** + **Mongoose** — база данных и ODM-модели.
- **JWT** (access + refresh, ротация refresh) — авторизация.
- **cookie-parser** — чтение refresh cookie.
- **Helmet** — безопасные заголовки.
- **CORS** — ограничение источников для API и Socket.IO.
- **Multer** + **Sharp** + **file-type** — приём и обработка изображений постов/аватаров.
- **Socket.IO** — WebSocket‑канал для событий (онлайн/сообщения/уведомления).
- **Resend** — отправка писем (сброс пароля).
- **ES Modules** (type: module) — современный синтаксис.
- Логирование: **morgan**.

### Frontend
- **React 18** + **Vite**.
- **react-router-dom** — маршрутизация.
- **axios** — запросы к API (с перехватчиками и авто‑refresh токена).
- **socket.io-client** — realtime‑события (уведомления/сообщения).
- **CSS Modules** — изоляция стилей.



##  Архитектура и структура каталогов

### Backend (`/back`)
```
back/
  .env
  eslint.config.js
  package-lock.json
  package.json
  server.js
  src/
    app.js
    socket.js
    config/
      db.js
      jwt.js
      upload.js
    controllers/
      authController.js
      commentController.js
      commentLikeController.js
      followController.js
      likeController.js
      messageController.js
      notificationController.js
      postController.js
      searchController.js
      userController.js
    middlewares/
      authMiddleware.js
      optionalAuth.js
      rateLimit.js
    models/
      commentLikeModel.js
      commentModel.js
      exploreModel.js
      followModel.js
      likeModel.js
      messageModel.js
      notificationModel.js
      postModel.js
      refreshTokenModel.js
      userModel.js
    routes/
      authRoutes.js
      commentRoutes.js
      followRoutes.js
      likeRoutes.js
      messageRoutes.js
      notificationRoutes.js
      postRoutes.js
      searchRoutes.js
      userRoutes.js
    utils/
      asyncHandler.js
      email.js
      refresh.service.js
  uploads/
    avatars/
      1758029899193-108300848.jpg
      1758054298709-664984917.jpg
      1758094747269-426658026.png
      1758095498664-63723349.png
      1758096056753-728450033.png
      1758194743376-285102790.jpg
    posts/
      1759073998421-108580111.png
      1759074092065-52059346.png
      1759074177571-462286994.png
      1759074216891-39148622.png
      1759074295422-186506787.png
      1759074960917-432587539.png
      1759075620075-920677145.png
      1759075655519-943983728.png
      1759075680858-341915524.png
      1759075712789-696534882.png
      1759075881193-245552737.png
      1759075905564-237786789.png
      1759075929205-905493247.png
      1759075960755-482665256.png
      1759077329395-242742376.png
      1759077390836-266389252.png
      1759077436018-106517718.png
      1759077475753-672494763.png
      1759077569355-72305161.png
      1759077620300-114033537.png
      1759077644388-872458913.png
      1759077677910-553726114.png
      1759077729897-201498315.png
      1759320991598-e7fbcf09-4c15-43b3-8394-6ff9a8bbe555.png
      1759326139345-e59d9444-f50a-433d-9120-8b524bc91e8f.png
```

Ключевые слои:
- `server.js` — точка входа (HTTP + инициализация Socket.IO).
- `src/app.js` — создание и конфигурация `express` приложения:
  - безоп. заголовки (`helmet`), CORS, cookies, JSON, логирование (`morgan`);
  - маршруты `app.use('/api/...', ...)`;
  - раздача статики: **`/uploads/posts`** и **`/uploads/avatars`** (см. ниже).
- `src/socket.js` — инициализация Socket.IO, авторизация по Bearer‑токену, комнаты вида `user:<id>`.
- `src/config/` — БД (`db.js`), JWT‑утилиты (`jwt.js`), настройка загрузки файлов (`upload.js`).
- `src/models/` — Mongoose‑схемы: `User`, `Post`, `Comment`, `Like`, `CommentLike`, `Follow`, `Message`, `Notification`, `RefreshToken`.
- `src/controllers/` — бизнес‑логика по доменам (auth, post, like, comment, follow, message, notification, search, user).
- `src/routes/` — определение HTTP‑маршрутов и мидлвар.
- `src/middlewares/` — auth‑мидлвары (обязательная/необязательная), rate‑limit.
- `src/utils/` — email (Resend), помощники, сервис ротации refresh‑токенов.
- `uploads/` — физическое хранилище изображений (создаётся автоматически).

Статика:
- `app.use('/uploads/posts', express.static(...))`
- `app.use('/uploads/avatars', express.static(...))`

### Frontend (`/front`)
```
front/
  .env
  index.html
  package-lock.json
  package.json
  dist/
    index.html
    assets/
    
  public/
  
  src/
    App.jsx
    index.css
    index.jsx
    routes.jsx
    components/
      CreatePostOverlay.jsx
      CreatePostOverlay.module.css
      ErrorBoundary.jsx
      FollowList.jsx
      FollowList.module.css
      Footer.jsx
      Footer.module.css
      PostActionsSheet.jsx
      PostActionsSheet.module.css
      PostEditModal.jsx
      PostEditModal.module.css
      PostViewModal.jsx
      PostViewModal.module.css
      ProfileEditOverlay.jsx
      ProfileEditOverlay.module.css
      SearchPanel.jsx
      SearchPanel.module.css
      Sidebar.jsx
      Sidebar.module.css
    pages/
      Explore.jsx
      Explore.module.css
      Login.jsx
      Login.module.css
      Main.jsx
      Main.module.css
      Messages.jsx
      Messages.module.css
      NotFound.jsx
      NotFound.module.css
      Notifications.jsx
      Notifications.module.css
      Profile.jsx
      Profile.module.css
      Register.jsx
      Register.module.css
      Reset.jsx
      Reset.module.css
      ResetConfirm.jsx
    services/
      api.js
      authService.js
      authToken.js
      notifications.js
      socket.js
    utils/
      emojiPresets.js
      useModalPlacement.js
```

- `src/services/api.js` — базовый `axios` с `baseURL = VITE_API_URL` и перехватчиками:
  - **access токен** хранится в памяти (не в localStorage);
  - **refresh токен** — httpOnly cookie, авто‑обновление по `POST /auth/refresh`.
- Страницы: `Main` (лента), `Explore`, `Profile`, `Messages`, `Notifications`, `Login/Register`, `Reset/ResetConfirm`, `NotFound`.
- Компоненты для постов, модалок, списка подписчиков, поиска.
- `socket.js` — подключение к Socket.IO, передача Bearer‑токена в handshake.


## 🔗 API — маршруты, назначение и файлы

Базовый префикс API: **`/api`**. Ниже — группы маршрутов, их назначение и файл‑источник.


**Маршруты (`/api/auth`)** — файл: `src/routes/authRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| POST | `"/register"` | Регистрация пользователя | `register` |
| POST | `"/login"` | Вход (получение access/refresh) | `login` |
| GET | `"/me"` | Текущий пользователь | `me` |
| POST | `"/password/forgot"` | Запрос на сброс пароля (отправка письма) | `requestPasswordReset` |
| POST | `"/password/reset"` | Подтверждение/сброс пароля | `resetPassword` |
| POST | `"/refresh"` | Обновление access токена по refresh (cookie) | `refresh` |
| POST | `"/logout"` | Выход и отзыв refresh | `logout` |

**Маршруты (`/api/users`)** — файл: `src/routes/userRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| PATCH | `"/me"` |  | `updateProfile` |
| DELETE | `"/me"` |  | `deleteProfile` |
| GET | `"/:username"` | Профиль пользователя по username | `getProfile` |

**Маршруты (`/api/posts`)** — файл: `src/routes/postRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| POST | `"/"` |  | `uploadPost.single("image"` |
| GET | `"/"` |  | `listPosts` |
| GET | `"/feed"` |  | `feed` |
| GET | `"/explore"` |  | `explorePosts` |
| GET | `"/:id"` | Получить пост по id | `getPost` |
| PATCH | `"/:id"` | Обновить подпись поста | `updatePost` |
| DELETE | `"/:id"` | Удалить пост | `deletePost` |

**Маршруты (`/api/likes`)** — файл: `src/routes/likeRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| POST | `"/toggle"` | Поставить/снять лайк поста | `toggleLike` |
| GET | `"/post/:postId"` | Список лайков поста | `postLikes` |

**Маршруты (`/api/comments`)** — файл: `src/routes/commentRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| POST | `"/"` |  | `addComment` |
| POST | `"/:id/like"` | Лайкнуть/снять лайк с комментария | `toggleCommentLike` |
| GET | `"/:id/likes"` | Лайкнуть/снять лайк с комментария | `listCommentLikes` |
| DELETE | `"/:id"` | Удалить комментарий | `deleteComment` |
| GET | `"/post/:postId"` | Список комментариев к посту | `listComments` |

**Маршруты (`/api/follows`)** — файл: `src/routes/followRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| POST | `"/follow"` | Подписаться на пользователя | `follow` |
| POST | `"/unfollow"` | Подписаться на пользователя | `unfollow` |
| POST | `"/toggle"` | Подписка/отписка (переключатель) | `toggle` |
| GET | `"/followers/:userId"` | Список подписчиков | `followers` |
| GET | `"/following/:userId"` | Список подписок | `following` |

**Маршруты (`/api/messages`)** — файл: `src/routes/messageRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| GET | `"/conversations"` | Список собеседников/диалогов | `getConversations` |
| GET | `"/since"` | Новые сообщения с момента (long-poll/light) | `getMessagesSince` |
| GET | `"/with/:withUser"` | Сообщения с конкретным пользователем | `conversation` |
| GET | `"/:conversationId"` |  | `getMessages` |
| PATCH | `"/:id/read"` | Пометить сообщение прочитанным | `markAsRead` |
| POST | `"/"` |  | `sendMessage` |
| POST | `"/test-data"` | Сгенерировать тестовые сообщения (dev) | `createTestData` |

**Маршруты (`/api/notifications`)** — файл: `src/routes/notificationRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| GET | `"/"` |  | `listNotifications` |
| POST | `"/mark-read"` | Отметить часть уведомлений прочитанными | `markRead` |
| POST | `"/mark-all-read"` | Отметить все уведомления прочитанными | `markRead` |
| POST | `"/:id/read"` | Отметить конкретное уведомление прочитанным | `markOneRead` |

**Маршруты (`/api/search`)** — файл: `src/routes/searchRoutes.js`

| Метод | Путь | Назначение (кратко) | Хендлер |
|---|---|---|---|
| GET | `"/users"` | Поиск пользователей по username/имени | `searchUsers` |


##  Переменные окружения (backend)

Ниже — список фактически используемых переменных окружения и где они применяются.

| Переменная | Назначение | Где используется |
|---|---|---|
| `ACCESS_JWT_EXPIRES_IN` | Время жизни access‑токена (напр., `15m`). | src/config/jwt.js |
| `API_PUBLIC_BASE_URL` | Альтернативный alias для `ASSET_BASE_URL`. | src/controllers/postController.js |
| `APP_BASE_URL` | Базовый URL фронтенда (email‑шаблоны). Рекомендуется задать = `APP_ORIGIN`. | src/utils/email.js |
| `APP_ORIGIN` | Базовый URL фронтенда (для ссылок в письмах сброса пароля, напр. `http://localhost:5173`). | src/controllers/authController.js, src/controllers/postController.js |
| `ASSET_BASE_URL` | Публичная базовая ссылка для изображений (`http://localhost:4000`), иначе берётся из запроса. | src/controllers/postController.js |
| `AUTH_MIDDLEWARE_DEBUG` | Если `true` — детальный лог auth‑мидлвара. | src/middlewares/authMiddleware.js, src/middlewares/optionalAuth.js |
| `AUTH_OPTIONAL_DEBUG` | Если `true` — лог для optional‑auth мидлвара. | src/middlewares/optionalAuth.js |
| `CORS_ORIGIN` | Разрешённые origin'ы для CORS/Socket.IO (через `,`). | src/app.js, src/socket.js |
| `EMAIL_FROM` | Адрес отправителя (если указан, используется в приоритете). | src/utils/email.js |
| `JWT_SECRET` | Секрет для подписания access‑токена. | src/config/jwt.js |
| `MAIL_FROM` | Адрес отправителя для писем (альтернатива `EMAIL_FROM`). | src/utils/email.js |
| `MONGODB_URI` | URI MongoDB (например, `mongodb://localhost:27017/insta_clon`). | src/config/db.js |
| `NODE_ENV` | Режим `development`/`production` (влияет на заголовки Helmet и логи). | src/app.js, src/controllers/authController.js, src/controllers/messageController.js, src/utils/email.js |
| `PORT` | Порт HTTP‑сервера (по умолчанию 4000). | — |
| `POST_STORAGE_LIMIT_MB` |  | src/controllers/postController.js |
| `REFRESH_JWT_EXPIRES_IN` | Время жизни refresh‑токена (напр., `30d`). | src/config/jwt.js |
| `REFRESH_JWT_SECRET` | Секрет для refresh‑токена (если пуст, берётся `JWT_SECRET`). | src/config/jwt.js |
| `RESEND_API_KEY` | Ключ Resend для отправки писем. | src/utils/email.js |
| `SOCKET_AUTH_OFF` | Если `true` — отключает проверку токена в WS (только для dev). | src/socket.js |
| `SOCKET_DEBUG` |  | src/socket.js |
| `WS_PATH` | Путь Socket.IO (по умолчанию `/socket.io`). | src/socket.js |

### Пример `.env` (backend)
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/insta_clon
CORS_ORIGIN=http://localhost:5173
APP_ORIGIN=http://localhost:5173
APP_BASE_URL=http://localhost:5173
ASSET_BASE_URL=http://localhost:4000
JWT_SECRET=__change_me__
REFRESH_JWT_SECRET=__change_me__
ACCESS_JWT_EXPIRES_IN=15m
REFRESH_JWT_EXPIRES_IN=30d
RESEND_API_KEY=__optional__
MAIL_FROM=no-reply@example.com
WS_PATH=/socket.io
SOCKET_AUTH_OFF=false
AUTH_MIDDLEWARE_DEBUG=false
AUTH_OPTIONAL_DEBUG=false
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:4000/api
```



##  Запуск и сборка

### Требования
- **Node.js >= 18** (ESM + Mongoose 8).
- **MongoDB >= 6** (локально или в облаке).
- Опционально: учётка **Resend** для писем (иначе e‑mail сброса не будет отправлен).

### 1) Backend
```bash
cd back
npm ci
cp .env .env.local # при необходимости отредактируйте переменные
npm run dev        # запускает http://localhost:4000
```

### 2) Frontend
```bash
cd front
npm ci
cp .env .env.local # при необходимости правки VITE_API_URL
npm run dev        # Vite на http://localhost:5173
```

### Production (кратко)
- Соберите фронтенд: `npm run build` в `/front` и отдавайте статику через любой CDN/хостинг.
- Запустите бэкенд `npm run start` в `/back` под процесс‑менеджером (pm2/systemd/Docker).
- В .env для бэкенда пропишите:
  - `CORS_ORIGIN` на домен фронта,
  - `ASSET_BASE_URL` (например, публичный URL reverse‑proxy),
  - `APP_ORIGIN` и `APP_BASE_URL` на домен фронта,
  - реальные `JWT_SECRET`/`REFRESH_JWT_SECRET`.



##  Авторизация, куки и WebSocket

- **Access‑токен** (короткоживущий) возвращается в ответах `/auth/login` и `/auth/refresh` и хранится **только в памяти** фронтенда. Запросы к API отправляются с заголовком `Authorization: Bearer <token>`.
- **Refresh‑токен** (долгоживущий) выдаётся как **httpOnly cookie**; его jti хранится в коллекции `RefreshToken`. При `401` перехватчик `axios` вызывает `POST /auth/refresh` для обновления access‑токена.
- **Rate‑limit** на чувствительных маршрутах: `/auth/register`, `/auth/login`, `/auth/password/*`, `/auth/refresh`.
- **WS (Socket.IO)**: подключение с Bearer‑токеном; сервер авторизует и помещает сокет в комнату `user:<id>`. Путь WS настраивается `WS_PATH`.
- **Загрузка файлов**: `POST /api/posts` принимает поле `image` (`multipart/form-data`), MIME: `image/jpeg|png|webp`, размер до 8 МБ. Изображения лежат на диске в `uploads/posts`, доступны по `GET /uploads/posts/...`.


##  Зависимости

### Backend
- `bcryptjs` ^2.4.3
- `cookie-parser` ^1.4.6
- `cors` ^2.8.5
- `dotenv` ^16.4.5
- `express` ^4.19.2
- `file-type` ^18.7.0
- `helmet` ^8.1.0
- `jsonwebtoken` ^9.0.2
- `mongoose` ^8.5.0
- `morgan` ^1.10.0
- `multer` ^2.0.2
- `resend` ^6.1.0
- `sharp` ^0.33.4
- `socket.io` ^4.7.5

### Frontend
- `axios` ^1.4.0
- `react` ^18.2.0
- `react-dom` ^18.2.0
- `react-icons` ^5.5.0
- `react-router-dom` ^6.9.0
- `remixicon` ^4.6.0
- `socket.io-client` ^4.7.5


##  Эндпоинты, на которые ссылается фронтенд

| Метод | Путь | Где используется |
|---|---|---|
| DELETE | `/users/me` | `src/components/ProfileEditOverlay.jsx` |
| GET | `/auth/me` | `src/pages/Login.jsx` |
| GET | `/auth/me` | `src/services/authBootstrap.js` |
| GET | `/auth/me` | `src/services/authService.js` |
| GET | `/messages/conversations` | `src/services/api.js` |
| GET | `/messages/since` | `src/services/api.js` |
| GET | `/notifications` | `src/services/notifications.js` |
| GET | `/posts/explore` | `src/pages/Explore.jsx` |
| GET | `/posts/feed` | `src/pages/Main.jsx` |
| GET | `/search/users` | `src/components/SearchPanel.jsx` |
| POST | `/auth/login` | `src/services/authService.js` |
| POST | `/auth/logout` | `src/services/authService.js` |
| POST | `/auth/password/forgot` | `src/pages/Reset.jsx` |
| POST | `/auth/password/reset` | `src/pages/ResetConfirm.jsx` |
| POST | `/auth/refresh` | `src/services/api.js` |
| POST | `/auth/refresh` | `src/services/authService.js` |
| POST | `/auth/register` | `src/services/authService.js` |
| POST | `/comments` | `src/components/PostViewModal.jsx` |
| POST | `/follows/follow` | `src/components/FollowList.jsx` |
| POST | `/follows/follow` | `src/pages/Profile.jsx` |
| POST | `/follows/toggle` | `src/components/PostViewModal.jsx` |
| POST | `/follows/toggle` | `src/pages/Main.jsx` |
| POST | `/follows/unfollow` | `src/components/FollowList.jsx` |
| POST | `/follows/unfollow` | `src/pages/Profile.jsx` |
| POST | `/likes/toggle` | `src/components/PostViewModal.jsx` |
| POST | `/likes/toggle` | `src/pages/Main.jsx` |
| POST | `/messages` | `src/services/api.js` |
| POST | `/notifications/mark-all-read` | `src/services/notifications.js` |
| POST | `/posts` | `src/components/CreatePostOverlay.jsx` |




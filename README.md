📚 README — Instagram-ähnliches Full-Stack-Projekt (Backend + Frontend)
Technologien
Backend

Node.js + Express — HTTP-API.

MongoDB + Mongoose — Datenbank und ODM-Modelle.

JWT (Access + Refresh, Rotation des Refresh-Tokens) — Autorisierung.

cookie-parser — Auslesen des Refresh-Cookies.

Helmet — Sicherheits-Header.

CORS — Einschränkung der erlaubten Origins für API und Socket.IO.

Multer + Sharp + file-type — Empfang und Verarbeitung von Bildern für Posts/Avatare.

Socket.IO — WebSocket-Kanal für Events (Online/ Nachrichten/ Benachrichtigungen).

Resend — Versand von E-Mails (Passwort-Reset).

ES Modules (type: module) — moderner Syntax.

Logging: morgan.

Frontend

React 18 + Vite.

react-router-dom — Routing.

axios — API-Requests (mit Interceptors und Auto-Refresh des Tokens).

socket.io-client — Realtime-Events (Benachrichtigungen/ Nachrichten).

CSS Modules — Kapselung der Styles.

Architektur und Verzeichnisstruktur
Backend (/back)
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


Schlüssel-Schichten:

server.js — Einstiegspunkt (HTTP + Initialisierung von Socket.IO).

src/app.js — Erstellung und Konfiguration der express-App:

Sicherheits-Header (helmet), CORS, Cookies, JSON, Logging (morgan);

Routen app.use('/api/...', ...);

Auslieferung statischer Dateien: /uploads/posts und /uploads/avatars (siehe unten).

src/socket.js — Initialisierung von Socket.IO, Autorisierung per Bearer-Token, Räume im Format user:<id>.

src/config/ — DB (db.js), JWT-Hilfen (jwt.js), Datei-Upload-Setup (upload.js).

src/models/ — Mongoose-Schemata: User, Post, Comment, Like, CommentLike, Follow, Message, Notification, RefreshToken.

src/controllers/ — Business-Logik nach Domänen (auth, post, like, comment, follow, message, notification, search, user).

src/routes/ — Definition der HTTP-Routen und Middleware.

src/middlewares/ — Auth-Middleware (obligatorisch/optional), Rate-Limit.

src/utils/ — E-Mail (Resend), Helper, Service für die Rotation von Refresh-Tokens.

uploads/ — physischer Speicherort für Bilder (wird automatisch angelegt).

Statische Pfade:

app.use('/uploads/posts', express.static(...))

app.use('/uploads/avatars', express.static(...))

Frontend (/front)
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


src/services/api.js — Basis-axios mit baseURL = VITE_API_URL und Interceptors:

Access-Token wird im Arbeitsspeicher gehalten (nicht im localStorage);

Refresh-Token — httpOnly-Cookie, automatisches Erneuern über POST /auth/refresh.

Seiten: Main (Feed), Explore, Profile, Messages, Notifications, Login/Register, Reset/ResetConfirm, NotFound.

Komponenten für Posts, Modals, Follower-Liste, Suche.

socket.js — Verbindung zu Socket.IO, Übergabe des Bearer-Tokens im Handshake.

🔗 API — Routen, Zweck und Dateien

Basis-Präfix der API: /api. Unten die Gruppen von Routen, ihr Zweck und die Quell-Datei.

Routen (/api/auth) — Datei: src/routes/authRoutes.js

Methode	Pfad	Kurzbeschreibung	Handler
POST	"/register"	Registrierung eines Nutzers	register
POST	"/login"	Login (Erhalt von Access/Refresh)	login
GET	"/me"	Aktueller Benutzer	me
POST	"/password/forgot"	Passwort-Reset anfordern (E-Mail senden)	requestPasswordReset
POST	"/password/reset"	Bestätigung/Passwort zurücksetzen	resetPassword
POST	"/refresh"	Access-Token per Refresh (Cookie) erneuern	refresh
POST	"/logout"	Logout und Widerruf des Refresh-Tokens	logout

Routen (/api/users) — Datei: src/routes/userRoutes.js

Methode	Pfad	Kurzbeschreibung	Handler
PATCH	"/me"		updateProfile
DELETE	"/me"		deleteProfile
GET	"/:username"	Nutzerprofil nach Username	getProfile

Routen (/api/posts) — Datei: src/routes/postRoutes.js

Methode	Pfad	Kurzbeschreibung	Handler
POST	"/"		uploadPost.single("image"
GET	"/"		listPosts
GET	"/feed"		feed
GET	"/explore"		explorePosts
GET	"/:id"	Post per ID abrufen	getPost
PATCH	"/:id"	Bildunterschrift des Posts aktualisieren	updatePost
DELETE	"/:id"	Post löschen	deletePost

Routen (/api/likes) — Datei: src/routes/likeRoutes.js

Methode	Pfad	Kurzbeschreibung	Handler
POST	"/toggle"	Like für Post setzen/entfernen	toggleLike
GET	"/post/:postId"	Like-Liste eines Posts	postLikes

Routen (/api/comments) — Datei: src/routes/commentRoutes.js

Methode	Pfad	Kurzbeschreibung	Handler
POST	"/"		addComment
POST	"/:id/like"	Kommentar liken/Like entfernen	toggleCommentLike
GET	"/:id/likes"	Kommentar liken/Like entfernen	listCommentLikes
DELETE	"/:id"	Kommentar löschen	deleteComment
GET	"/post/:postId"	Kommentar-Liste zu einem Post	listComments

Routen (/api/follows) — Datei: src/routes/followRoutes.js

Methode	Pfad	Kurzbeschreibung	Handler
POST	"/follow"	Nutzer abonnieren	follow
POST	"/unfollow"	Nutzer entabonnieren	unfollow
POST	"/toggle"	Folgen/Entfolgen (Umschalter)	toggle
GET	"/followers/:userId"	Follower-Liste	followers
GET	"/following/:userId"	Liste der Abos	following


Routen (/api/messages) — Datei: src/routes/messageRoutes.js

| Methode | Pfad                 | Kurzbeschreibung                                  | Handler            |
| ------- | -------------------- | ------------------------------------------------- | ------------------ |
| GET     | `"/conversations"`   | Liste der Gesprächspartner/Dialoge                | `getConversations` |
| GET     | `"/since"`           | Neue Nachrichten seit Zeitpunkt (Long-Poll/Light) | `getMessagesSince` |
| GET     | `"/with/:withUser"`  | Nachrichten mit einem bestimmten Benutzer         | `conversation`     |
| GET     | `"/:conversationId"` |                                                   | `getMessages`      |
| PATCH   | `"/:id/read"`        | Nachricht als gelesen markieren                   | `markAsRead`       |
| POST    | `"/"`                |                                                   | `sendMessage`      |
| POST    | `"/test-data"`       | Testnachrichten generieren (dev)                  | `createTestData`   |

Routen (/api/notifications) — Datei: src/routes/notificationRoutes.js

| Methode | Pfad               | Kurzbeschreibung                                  | Handler             |
| ------- | ------------------ | ------------------------------------------------- | ------------------- |
| GET     | `"/"`              |                                                   | `listNotifications` |
| POST    | `"/mark-read"`     | Teil der Benachrichtigungen als gelesen markieren | `markRead`          |
| POST    | `"/mark-all-read"` | Alle Benachrichtigungen als gelesen markieren     | `markRead`          |
| POST    | `"/:id/read"`      | Einzelne Benachrichtigung als gelesen markieren   | `markOneRead`       |

Routen (/api/search) — Datei: src/routes/searchRoutes.js

| Methode | Pfad       | Kurzbeschreibung                    | Handler       |
| ------- | ---------- | ----------------------------------- | ------------- |
| GET     | `"/users"` | Benutzer nach Username/Namen suchen | `searchUsers` |

Umgebungsvariablen (Backend)

Unten — Liste der tatsächlich verwendeten Umgebungsvariablen und wo sie eingesetzt werden.

| Variable                 | Zweck                                                                              | Verwendung                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ACCESS_JWT_EXPIRES_IN`  | Lebensdauer des Access-Tokens (z. B. `15m`).                                       | src/config/jwt.js                                                                                       |
| `API_PUBLIC_BASE_URL`    | Alternativer Alias für `ASSET_BASE_URL`.                                           | src/controllers/postController.js                                                                       |
| `APP_BASE_URL`           | Basis-URL des Frontends (E-Mail-Templates). Empfohlen = `APP_ORIGIN`.              | src/utils/email.js                                                                                      |
| `APP_ORIGIN`             | Basis-URL des Frontends (für Links in Reset-Mails, z. B. `http://localhost:5173`). | src/controllers/authController.js, src/controllers/postController.js                                    |
| `ASSET_BASE_URL`         | Öffentliche Basis-URL für Bilder (`http://localhost:4000`), sonst aus Request.     | src/controllers/postController.js                                                                       |
| `AUTH_MIDDLEWARE_DEBUG`  | Wenn `true` — detailliertes Log des Auth-Middlewares.                              | src/middlewares/authMiddleware.js, src/middlewares/optionalAuth.js                                      |
| `AUTH_OPTIONAL_DEBUG`    | Wenn `true` — Log für optional-auth Middleware.                                    | src/middlewares/optionalAuth.js                                                                         |
| `CORS_ORIGIN`            | Erlaubte Origins für CORS/Socket.IO (durch `,` getrennt).                          | src/app.js, src/socket.js                                                                               |
| `EMAIL_FROM`             | Absenderadresse (falls gesetzt, priorisiert).                                      | src/utils/email.js                                                                                      |
| `JWT_SECRET`             | Secret zum Signieren des Access-Tokens.                                            | src/config/jwt.js                                                                                       |
| `MAIL_FROM`              | Absenderadresse für E-Mails (Alternative zu `EMAIL_FROM`).                         | src/utils/email.js                                                                                      |
| `MONGODB_URI`            | MongoDB-URI (z. B. `mongodb://localhost:27017/insta_clon`).                        | src/config/db.js                                                                                        |
| `NODE_ENV`               | Modus `development`/`production` (beeinflusst Helmet-Header und Logs).             | src/app.js, src/controllers/authController.js, src/controllers/messageController.js, src/utils/email.js |
| `PORT`                   | Port des HTTP-Servers (Standard 4000).                                             | —                                                                                                       |
| `POST_STORAGE_LIMIT_MB`  |                                                                                    | src/controllers/postController.js                                                                       |
| `REFRESH_JWT_EXPIRES_IN` | Lebensdauer des Refresh-Tokens (z. B. `30d`).                                      | src/config/jwt.js                                                                                       |
| `REFRESH_JWT_SECRET`     | Secret für das Refresh-Token (falls leer, wird `JWT_SECRET` verwendet).            | src/config/jwt.js                                                                                       |
| `RESEND_API_KEY`         | Resend-API-Schlüssel für E-Mails.                                                  | src/utils/email.js                                                                                      |
| `SOCKET_AUTH_OFF`        | Wenn `true` — deaktiviert Token-Prüfung im WS (nur für dev).                       | src/socket.js                                                                                           |
| `SOCKET_DEBUG`           |                                                                                    | src/socket.js                                                                                           |
| `WS_PATH`                | Socket.IO-Pfad (Standard `/socket.io`).                                            | src/socket.js                                                                                           |

Beispiel .env (Backend)
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

Frontend .env
VITE_API_URL=http://localhost:4000/api

Start und Build
Anforderungen

Node.js >= 18 (ESM + Mongoose 8).

MongoDB >= 6 (lokal oder in der Cloud).

Optional: Resend-Account für E-Mails (sonst wird keine Reset-Mail versendet).

1) Backend
cd back
npm ci
cp .env .env.local # Variablen bei Bedarf anpassen
npm run dev        # startet http://localhost:4000

2) Frontend
cd front
npm ci
cp .env .env.local # bei Bedarf VITE_API_URL anpassen
npm run dev        # Vite auf http://localhost:5173

Production (kurz)

Frontend bauen: npm run build in /front und statische Dateien über beliebigen CDN/Hoster ausliefern.

Backend mit npm run start in /back unter Prozess-Manager (pm2/systemd/Docker) starten.

In der Backend-.env setzen:

CORS_ORIGIN auf die Frontend-Domain,

ASSET_BASE_URL (z. B. öffentliche URL des Reverse-Proxy),

APP_ORIGIN und APP_BASE_URL auf die Frontend-Domain,

echte JWT_SECRET/REFRESH_JWT_SECRET.

Autorisierung, Cookies und WebSocket

Access-Token (kurzlebig) wird in den Antworten von /auth/login und /auth/refresh zurückgegeben und nur im Speicher des Frontends gehalten. API-Requests senden den Header Authorization: Bearer <token>.

Refresh-Token (langlebig) wird als httpOnly-Cookie ausgegeben; dessen jti wird in der Collection RefreshToken gespeichert. Bei 401 ruft der axios-Interceptor POST /auth/refresh zum Erneuern des Access-Tokens auf.

Rate-Limit auf sensiblen Routen: /auth/register, /auth/login, /auth/password/*, /auth/refresh.

WS (Socket.IO): Verbindung mit Bearer-Token; der Server autorisiert und ordnet den Socket dem Raum user:<id> zu. WS-Pfad konfigurierbar über WS_PATH.

Datei-Upload: POST /api/posts akzeptiert Feld image (multipart/form-data), MIME: image/jpeg|png|webp, Größe bis 8 MB. Bilder liegen auf der Platte in uploads/posts, abrufbar über GET /uploads/posts/....

Abhängigkeiten
Backend

bcryptjs ^2.4.3

cookie-parser ^1.4.6

cors ^2.8.5

dotenv ^16.4.5

express ^4.19.2

file-type ^18.7.0

helmet ^8.1.0

jsonwebtoken ^9.0.2

mongoose ^8.5.0

morgan ^1.10.0

multer ^2.0.2

resend ^6.1.0

sharp ^0.33.4

socket.io ^4.7.5

Frontend

axios ^1.4.0

react ^18.2.0

react-dom ^18.2.0

react-icons ^5.5.0

react-router-dom ^6.9.0

remixicon ^4.6.0

socket.io-client ^4.7.5

Endpunkte, auf die sich das Frontend bezieht

| Methode | Pfad                           | Wo verwendet                            |
| ------- | ------------------------------ | --------------------------------------- |
| DELETE  | `/users/me`                    | `src/components/ProfileEditOverlay.jsx` |
| GET     | `/auth/me`                     | `src/pages/Login.jsx`                   |
| GET     | `/auth/me`                     | `src/services/authBootstrap.js`         |
| GET     | `/auth/me`                     | `src/services/authService.js`           |
| GET     | `/messages/conversations`      | `src/services/api.js`                   |
| GET     | `/messages/since`              | `src/services/api.js`                   |
| GET     | `/notifications`               | `src/services/notifications.js`         |
| GET     | `/posts/explore`               | `src/pages/Explore.jsx`                 |
| GET     | `/posts/feed`                  | `src/pages/Main.jsx`                    |
| GET     | `/search/users`                | `src/components/SearchPanel.jsx`        |
| POST    | `/auth/login`                  | `src/services/authService.js`           |
| POST    | `/auth/logout`                 | `src/services/authService.js`           |
| POST    | `/auth/password/forgot`        | `src/pages/Reset.jsx`                   |
| POST    | `/auth/password/reset`         | `src/pages/ResetConfirm.jsx`            |
| POST    | `/auth/refresh`                | `src/services/api.js`                   |
| POST    | `/auth/refresh`                | `src/services/authService.js`           |
| POST    | `/auth/register`               | `src/services/authService.js`           |
| POST    | `/comments`                    | `src/components/PostViewModal.jsx`      |
| POST    | `/follows/follow`              | `src/components/FollowList.jsx`         |
| POST    | `/follows/follow`              | `src/pages/Profile.jsx`                 |
| POST    | `/follows/toggle`              | `src/components/PostViewModal.jsx`      |
| POST    | `/follows/toggle`              | `src/pages/Main.jsx`                    |
| POST    | `/follows/unfollow`            | `src/components/FollowList.jsx`         |
| POST    | `/follows/unfollow`            | `src/pages/Profile.jsx`                 |
| POST    | `/likes/toggle`                | `src/components/PostViewModal.jsx`      |
| POST    | `/likes/toggle`                | `src/pages/Main.jsx`                    |
| POST    | `/messages`                    | `src/services/api.js`                   |
| POST    | `/notifications/mark-all-read` | `src/services/notifications.js`         |
| POST    | `/posts`                       | `src/components/CreatePostOverlay.jsx`  |

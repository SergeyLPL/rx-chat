# RX Chat

WhatsApp-подобный мессенджер на React + Firebase с авторизацией и real-time сообщениями.

## Функции

- Регистрация и вход через Email/Пароль или Google
- Список пользователей — находите людей и начинайте диалог
- Real-time сообщения через Firestore
- Адаптивный дизайн (mobile + desktop)
- Тёмная тема в стиле WhatsApp

---

## Настройка Firebase

### 1. Создайте проект Firebase

1. Перейдите на [console.firebase.google.com](https://console.firebase.google.com)
2. Нажмите **Add project** → введите имя → создайте
3. В разделе **Build → Authentication** нажмите **Get started**
4. Включите провайдеры: **Email/Password** и **Google**
5. В разделе **Build → Firestore Database** нажмите **Create database**
   - Выберите регион (europe-west1 — ближайший)
   - Начните в **test mode** (потом обновите правила)
6. В разделе **Project Settings → Your apps** нажмите `</>` (Web)
   - Зарегистрируйте приложение → скопируйте `firebaseConfig`

### 2. Настройте Firestore Rules

В разделе **Firestore → Rules** вставьте содержимое файла `firestore.rules` из этого репозитория.

### 3. Добавьте авторизованный домен

В **Authentication → Settings → Authorized domains** добавьте:
`<ваш-логин>.github.io`

### 4. Добавьте секреты в GitHub

В настройках репозитория: **Settings → Secrets and variables → Actions → New repository secret**

| Секрет | Значение из firebaseConfig |
|--------|---------------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

### 5. Включите GitHub Pages

**Settings → Pages → Source → GitHub Actions**

---

## Локальный запуск

```bash
cp .env.example .env
# Заполните .env своими данными Firebase

npm install
npm run dev
```

## Деплой

После добавления секретов в GitHub — любой push в ветку `main` автоматически собирает и публикует приложение на GitHub Pages.

URL приложения: `https://<ваш-логин>.github.io/rx-chat/`

---

## Стек

- **React 19** + **Vite**
- **Firebase** (Auth + Firestore)
- **Tailwind CSS 3**
- **GitHub Actions** → **GitHub Pages**

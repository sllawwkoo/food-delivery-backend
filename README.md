# Food Delivery Backend

## 🇬🇧 English

Lightweight REST API for a **Food Delivery** pet project: authentication, products, and orders built with Node.js, TypeScript, and MongoDB.

### Tech Stack

- Node.js, Express
- TypeScript
- MongoDB, Mongoose
- JWT authentication (access token)
- Refresh token in httpOnly cookie

### API Endpoints

**Auth**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/me`

**Products**
- `GET /products`

**Orders**
- `POST /orders`
- `GET /orders/my`

### Run locally

```bash
git clone <repo-url>
cd food-delivery-backend
npm install
npm run dev
```

### Environment variables

Create `.env` in the `food-delivery-backend` root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/food-delivery
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Authentication

- Access token (JWT): returned on login, used via `Authorization: Bearer <token>` for protected routes.  
- Refresh token (JWT): stored in httpOnly cookie, used on `POST /auth/refresh` to issue a new access token.

---

## 🇺🇦 Українська

Легкий REST API для pet-проєкту **Food Delivery**: аутентифікація, товари та замовлення на Node.js, TypeScript і MongoDB.

### Tech Stack

- Node.js, Express
- TypeScript
- MongoDB, Mongoose
- JWT аутентифікація (access token)
- Refresh token в httpOnly cookie

### API Endpoints

**Auth**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/me`

**Products**
- `GET /products`

**Orders**
- `POST /orders`
- `GET /orders/my`

### Запуск локально

```bash
git clone <repo-url>
cd food-delivery-backend
npm install
npm run dev
```

### Змінні середовища

Створіть `.env` у корені `food-delivery-backend`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/food-delivery
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Аутентифікація

- Access token (JWT): повертається при логіні, використовується в `Authorization: Bearer <token>` для захищених роутів.  
- Refresh token (JWT): зберігається в httpOnly cookie, використовується на `POST /auth/refresh` для оновлення access токена.

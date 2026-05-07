# ScreenMindr

Parental screen-time control prototype.

## Structure

```
.
├── fe/          # Expo React Native child app
└── be/          # NestJS GraphQL API + Firebase Firestore
```

## Frontend (`fe/`)

Expo SDK 51 + React Native 0.74 + TypeScript.

```bash
cd fe
npm install
npm run android      # or: npm run ios / npm run web
```

See `fe/README.MD` for details.

## Backend (`be/`)

NestJS 10 + Apollo GraphQL (code-first) + Firebase Admin (Firestore).

### Setup

1. Create a Firebase project at <https://console.firebase.google.com>.
2. Enable **Firestore Database** (Native mode).
3. Project Settings → **Service accounts** → **Generate new private key** → save as `be/firebase-service-account.json` (gitignored).
4. Install + run:
   ```bash
   cd be
   npm install
   npm run start:dev
   ```
5. GraphQL Playground: <http://localhost:3000/graphql>

### Env

Copy `be/.env.example` to `be/.env`:

```
PORT=3000
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

## Notes

- Service account JSON is **gitignored** — never commit it.
- Frontend connects to backend via `EXPO_PUBLIC_API_URL` env (set in `fe/.env` or `app.json` extra).

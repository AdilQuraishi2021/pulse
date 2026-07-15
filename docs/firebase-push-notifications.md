# Firebase Push Notifications

This project uses Firebase Cloud Messaging for browser push notifications in the user client.

## Firebase Console Setup

1. Open Firebase Console and create or select the Pulse project.
2. Add a Web app from Project settings > General.
3. Copy the web app config into the user-client environment variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

4. Open Project settings > Cloud Messaging > Web Push certificates.
5. Generate a key pair if one does not exist, then set:

```bash
VITE_FIREBASE_VAPID_KEY=
```

6. Open Project settings > Service accounts and generate a private key.
7. Store the service account on the API server as either one JSON value:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"}'
```

or split values:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Database

Run migrations before enabling push:

```bash
pnpm run db:migrate
```

The migration creates `notification_push_tokens`, which stores each user's web FCM token.

## App Flow

1. A signed-in user opens `/notifications`.
2. If Firebase config and browser push support are available, the page shows `Enable push`.
3. The browser asks for notification permission.
4. Firebase returns an FCM token.
5. The client sends the token through the authenticated notification gRPC API.
6. When `createNotification` writes an in-app notification, the API sends a Firebase push message to saved tokens.
7. Invalid or expired tokens are removed after Firebase reports them.

## Local Testing

Use `https://localhost` or a secure deployed origin. Browser push APIs generally require a secure context, except for some localhost development cases.

After enabling push from the UI, trigger a notification from another user account, such as liking or commenting on the signed-in user's post. The foreground app still updates through existing polling/socket behavior; the push notification appears when the browser allows notifications, especially while the tab is backgrounded or closed.

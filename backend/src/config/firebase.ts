import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

export const initFirebase = (): void => {
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    console.warn('[Firebase] No service account found — Firebase token verification will use REST API fallback');
    app = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  console.log('[Firebase Admin] Initialized');
};

export const getFirebaseAdmin = (): typeof admin => admin;

export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  return admin.auth().verifyIdToken(idToken);
};

export const sendPushNotification = async (
  token: string,
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> => {
  try {
    await admin.messaging().send({
      token,
      notification: { title: notification.title, body: notification.body },
      data,
      android: { priority: 'high', notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (err) {
    console.error('[FCM] Push notification failed:', err);
  }
};

export const sendMulticastPush = async (
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> => {
  if (tokens.length === 0) return;
  try {
    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));
    for (const chunk of chunks) {
      await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title: notification.title, body: notification.body },
        data,
        android: { priority: 'high' },
      });
    }
  } catch (err) {
    console.error('[FCM] Multicast push failed:', err);
  }
};

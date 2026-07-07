import 'dotenv/config';
import mongoose from 'mongoose';
import * as admin from 'firebase-admin';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';

const run = async () => {
  // Connect MongoDB
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('[DB] Connected');

  // Init Firebase Admin
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    console.error('No FIREBASE_SERVICE_ACCOUNT_JSON found in .env');
    process.exit(1);
  }
  console.log('[Firebase Admin] Initialized');

  // Find all email-auth users in MongoDB
  const emailUsers = await User.find({
    $or: [
      { primaryAuthProvider: 'email' },
      { authProviders: 'email' },
    ],
  }).lean();

  if (emailUsers.length === 0) {
    console.log('[MongoDB] No email users found.');
  } else {
    console.log(`[MongoDB] Found ${emailUsers.length} email user(s):`);
    for (const u of emailUsers) {
      console.log(`  - ${u.email ?? '(no email)'} | firebaseUid: ${u.firebaseUid} | _id: ${u._id}`);
    }
  }

  // Delete from Firebase and MongoDB
  for (const u of emailUsers) {
    // Delete from Firebase
    try {
      await admin.auth().deleteUser(u.firebaseUid);
      console.log(`[Firebase] Deleted user: ${u.firebaseUid} (${u.email ?? 'no email'})`);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'auth/user-not-found') {
        console.log(`[Firebase] User not found (already deleted): ${u.firebaseUid}`);
      } else {
        console.error(`[Firebase] Failed to delete ${u.firebaseUid}:`, e.message);
      }
    }

    // Delete wallet
    const walletResult = await Wallet.deleteOne({ userId: u._id });
    console.log(`[MongoDB] Wallet deleted: ${walletResult.deletedCount} for user ${u._id}`);

    // Delete user
    const userResult = await User.deleteOne({ _id: u._id });
    console.log(`[MongoDB] User deleted: ${userResult.deletedCount} (_id: ${u._id})`);
  }

  // Also scan Firebase directly for email/password users with no MongoDB record
  console.log('\n[Firebase] Scanning for email/password users in Firebase...');
  const dbUids = new Set(emailUsers.map((u) => u.firebaseUid));
  let pageToken: string | undefined;
  const orphanedUids: string[] = [];

  do {
    const listResult = await admin.auth().listUsers(1000, pageToken);
    for (const fbUser of listResult.users) {
      const isEmailProvider = fbUser.providerData.some((p) => p.providerId === 'password');
      if (isEmailProvider && !dbUids.has(fbUser.uid)) {
        orphanedUids.push(fbUser.uid);
        console.log(`  [Firebase] Orphaned email user: ${fbUser.email ?? '(no email)'} | uid: ${fbUser.uid}`);
      }
    }
    pageToken = listResult.pageToken;
  } while (pageToken);

  for (const uid of orphanedUids) {
    try {
      await admin.auth().deleteUser(uid);
      console.log(`[Firebase] Deleted orphaned user: ${uid}`);
    } catch (err: unknown) {
      console.error(`[Firebase] Failed to delete orphaned user ${uid}:`, (err as { message?: string }).message);
    }
  }

  console.log('\nDone. All email users removed from Firebase and MongoDB.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

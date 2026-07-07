import mongoose from 'mongoose';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI!;
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('[MongoDB] Connected successfully');

    // One-time fix: drop the non-sparse phone_1 index so Mongoose recreates it as sparse+unique
    try {
      const usersCol = mongoose.connection.db!.collection('users');
      const indexes = await usersCol.indexes();
      const phoneIdx = indexes.find((i: any) => i.name === 'phone_1');
      if (phoneIdx && !phoneIdx.sparse) {
        await usersCol.dropIndex('phone_1');
        console.log('[MongoDB] Dropped non-sparse phone_1 index — will be recreated as sparse+unique');
      }
    } catch {
      // Collection may not exist yet on first run — safe to ignore
    }

    mongoose.connection.on('error', (err) => console.error('[MongoDB] Error:', err));
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[MongoDB] Disconnected — will reconnect automatically');
    });
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
    process.exit(1);
  }
};

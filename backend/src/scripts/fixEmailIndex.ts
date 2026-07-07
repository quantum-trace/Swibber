import 'dotenv/config';
import mongoose from 'mongoose';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('[DB] Connected');

  const collection = mongoose.connection.collection('users');
  const indexes = await collection.indexes();
  console.log('[DB] Current indexes:', indexes.map((i) => `${i.name} unique=${i.unique ?? false}`).join(', '));

  try {
    await collection.dropIndex('email_1');
    console.log('[DB] Dropped old unique email_1 index');
  } catch (err: unknown) {
    const e = err as { codeName?: string; message?: string };
    if (e.codeName === 'IndexNotFound') {
      console.log('[DB] email_1 index not found — nothing to drop');
    } else {
      throw err;
    }
  }

  // Recreate as non-unique sparse index (matches current schema)
  await collection.createIndex({ email: 1 }, { sparse: true, background: true });
  console.log('[DB] Recreated email index as non-unique sparse');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

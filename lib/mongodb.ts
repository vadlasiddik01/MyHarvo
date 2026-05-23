import mongoose, { type Mongoose } from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, uri: null };
}

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('Please add your Mongo URI to .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (cached.promise && cached.uri !== mongoUri) {
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.uri = mongoUri;
    cached.promise = mongoose
      .connect(mongoUri, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.uri = null;
    if (e instanceof Error && e.message.includes('querySrv')) {
      throw new Error(
        'MongoDB DNS lookup failed. Use a non-SRV mongodb:// seed-list URI in MONGODB_URI, or change your DNS/network so Node can resolve Atlas SRV records.',
        { cause: e }
      );
    }
    throw e;
  }

  return cached.conn;
}

export function getDatabaseErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message;

  if (message.includes('MongoDB DNS lookup failed') || message.includes('querySrv')) {
    return 'Database DNS lookup failed. Use the direct MongoDB URI in .env.local or fix DNS for Atlas SRV records.';
  }

  if (
    message.includes('IP') ||
    message.includes('whitelist') ||
    message.includes('Could not connect to any servers')
  ) {
    return 'Database connection blocked. Add your current IP address in MongoDB Atlas Network Access, then restart the dev server.';
  }

  return null;
}

declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
    uri: string | null;
  };
}

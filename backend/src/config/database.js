import dns from 'node:dns';
import mongoose from 'mongoose';
import env from './env.js';

// Use reliable public DNS servers for MongoDB SRV lookups.
dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function connectDatabase(uri = env.mongoUri) {
  if (!uri) {
    throw new Error(
      'MongoDB is not configured. Set the MONGODB_URI environment variable (for example, in backend/.env).',
    );
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export default connectDatabase;
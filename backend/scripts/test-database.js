import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import '../src/models/index.js';

let memoryServer;

try {
  let testUri = process.env.MONGODB_TEST_URI;
  if (testUri) {
    const databaseName = new URL(testUri).pathname.replace(/^\//, '').split('?')[0];
    if (!databaseName || !/test/i.test(databaseName)) {
      throw new Error('MONGODB_TEST_URI must use a database name containing "test".');
    }
  } else {
    memoryServer = await MongoMemoryServer.create();
    testUri = memoryServer.getUri('jobmatch_ai_test');
  }
  const connection = await connectDatabase(testUri);
  await connection.db.admin().ping();
  console.log(`MongoDB connection successful (database: ${connection.name}).`);
} catch (error) {
  console.error(`MongoDB connection test failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
  await memoryServer?.stop();
}

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { connectDatabase } from '../src/config/database.js';
import { syncHimalayasJobs } from '../src/services/external-job-sync.service.js';

/* =========================================================
   LOAD BACKEND .ENV FILE
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendEnvPath = path.resolve(
  __dirname,
  '../.env',
);

dotenv.config({
  path: backendEnvPath,
});

/* =========================================================
   TEST
========================================================= */

async function main() {
  try {
    console.log('========================================');
    console.log('HIMALAYAS JOB SYNC TEST');
    console.log('========================================');

    console.log('\nEnvironment file:');
    console.log(backendEnvPath);

    console.log('\nChecking MongoDB configuration...');

    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI was not loaded from backend/.env.',
      );
    }

    console.log('MONGODB_URI: FOUND');

    console.log('\nConnecting to MongoDB...');

    await connectDatabase();

    console.log('MongoDB: CONNECTED');

    console.log('\nStarting Himalayas synchronization...');

    const result = await syncHimalayasJobs({
      limit: 5,
    });

    console.log('\n========================================');
    console.log('SYNC RESULT');
    console.log('========================================');

    console.log(
      JSON.stringify(
        result,
        null,
        2,
      ),
    );

    console.log('\n========================================');
    console.log('TEST COMPLETE');
    console.log('========================================');
  } catch (error) {
    console.error('\nSYNC TEST FAILED');

    console.error(
      error instanceof Error
        ? error.message
        : error,
    );

    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

main();
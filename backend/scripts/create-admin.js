import readline from 'node:readline';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import User from '../src/models/user.model.js';

const SALT_ROUNDS = 12;

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    if (!hidden) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });

      return;
    }

    process.stdout.write(question);

    const stdin = process.stdin;
    const originalRawMode = stdin.isRaw;

    stdin.setRawMode?.(true);
    stdin.resume();

    let value = '';

    const onData = (chunk) => {
      const char = chunk.toString();

      if (char === '\r' || char === '\n') {
        stdin.setRawMode?.(originalRawMode ?? false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
        return;
      }

      if (char === '\u0003') {
        process.stdout.write('\n');
        process.exit(1);
      }

      if (char === '\u007f') {
        if (value.length > 0) {
          value = value.slice(0, -1);
        }
        return;
      }

      value += char;
    };

    stdin.on('data', onData);
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  console.log('\n========================================');
  console.log(' JobMatch AI - Create Administrator');
  console.log('========================================\n');

  const email = (await ask('Admin email: ')).toLowerCase();

  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  const password = await ask('Admin password: ', true);

  if (password.length < 8) {
    throw new Error('Admin password must contain at least 8 characters.');
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Admin password must not exceed 72 bytes.');
  }

  const confirmation = await ask('Confirm admin password: ', true);

  if (password !== confirmation) {
    throw new Error('Passwords do not match.');
  }

  await connectDatabase();

  const existingUser = await User.findOne({ email }).select('+passwordHash');

  if (existingUser) {
    if (existingUser.role !== 'admin') {
      throw new Error(
        `An account already exists for ${email}, but it is not an administrator.`,
      );
    }

    existingUser.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    existingUser.status = 'active';

    await existingUser.save();

    console.log('\nAdministrator password has been reset successfully.');
    console.log(`Email: ${existingUser.email}`);
    console.log('Role: admin');
    console.log('Status: active');

    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await User.create({
    email,
    passwordHash,
    role: 'admin',
    status: 'active',
  });

  console.log('\nAdministrator account created successfully.');
  console.log(`Email: ${admin.email}`);
  console.log('Role: admin');
  console.log('Status: active');
}

main()
  .catch((error) => {
    console.error('\nERROR:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
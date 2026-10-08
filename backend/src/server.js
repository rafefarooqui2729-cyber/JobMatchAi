import { createServer } from 'node:http';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';
import { attachSocketServer } from './sockets/index.js';

const httpServer = createServer(app);

attachSocketServer(httpServer);

try {
  await connectDatabase();

  httpServer.listen(env.port, () => {
    console.log(
      `JobMatch AI API listening on port ${env.port} (${env.nodeEnv}).`,
    );
  });
} catch (error) {
  console.error(
    'Unable to start the API because its database connection failed.',
  );

  console.error('Error name:', error.name);

  if (env.isProduction) {
    console.error('Database startup failure occurred in production.');
  } else {
    console.error('Error message:', error.message);
  }

  process.exit(1);
}
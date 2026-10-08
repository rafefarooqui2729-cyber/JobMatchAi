import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import env from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import candidateProfileRouter from './routes/candidate-profile.routes.js';
import employerRouter from './routes/employer.routes.js';
import jobDiscoveryRouter from './routes/job-discovery.routes.js';
import recommendationRouter from './routes/recommendation.routes.js';
import notificationRouter from './routes/notification.routes.js';
import adminRouter from './routes/admin.routes.js';

const app = express();
app.locals.clientOrigin = env.clientOrigin;

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/candidate/profile', candidateProfileRouter);
app.use('/api/candidate', recommendationRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/employer', employerRouter);
app.use('/api/jobs', jobDiscoveryRouter);
app.use('/uploads/company-logos', express.static(join(dirname(fileURLToPath(import.meta.url)), '..', 'uploads', 'company-logos'), {
  fallthrough: false,
  immutable: true,
  maxAge: '1y',
}));
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

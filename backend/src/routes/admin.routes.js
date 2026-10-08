import { Router } from 'express';

import {
  changeUserStatus,
  moderateJob,
  readJobs,
  readOverview,
  readUsers,
  syncHimalayas,
} from '../controllers/admin.controller.js';

import {
  authenticate,
  requireSameOrigin,
} from '../middleware/auth.middleware.js';

import { authorize } from '../middleware/role.middleware.js';

const adminRouter = Router();

/* =========================================================
   ADMIN AUTHORIZATION
========================================================= */

adminRouter.use(
  requireSameOrigin,
  authenticate,
  authorize('admin'),
);

/* =========================================================
   ADMIN OVERVIEW
========================================================= */

adminRouter.get(
  '/overview',
  readOverview,
);

/* =========================================================
   ADMIN USERS
========================================================= */

adminRouter.get(
  '/users',
  readUsers,
);

adminRouter.patch(
  '/users/:userId/status',
  changeUserStatus,
);

/* =========================================================
   ADMIN JOBS
========================================================= */

adminRouter.get(
  '/jobs',
  readJobs,
);

adminRouter.patch(
  '/jobs/:jobId/moderate',
  moderateJob,
);

/* =========================================================
   EXTERNAL JOB SYNCHRONIZATION
========================================================= */

adminRouter.post(
  '/jobs/sync/himalayas',
  syncHimalayas,
);

export default adminRouter;
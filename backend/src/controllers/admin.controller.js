import mongoose from 'mongoose';
import { USER_ROLES, USER_STATUSES } from '../models/enums.js';
import {
  getPlatformOverview,
  listPlatformJobs,
  listPlatformUsers,
  moderatePlatformJob,
  updatePlatformUserStatus,
} from '../services/admin.service.js';
import { syncHimalayasJobs } from '../services/external-job-sync.service.js';

function pageValue(value, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;

  const number = Number(value);

  return number >= 1 && number <= max
    ? number
    : null;
}

/* =========================================================
   ADMIN OVERVIEW
========================================================= */

export async function readOverview(req, res, next) {
  try {
    res.status(200).json(
      await getPlatformOverview(),
    );
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   ADMIN USERS
========================================================= */

export async function readUsers(req, res, next) {
  const page = pageValue(
    req.query.page,
    1,
    100000,
  );

  const limit = pageValue(
    req.query.limit,
    20,
    50,
  );

  const {
    role,
    status,
    q,
  } = req.query;

  if (
    !page ||
    !limit ||
    (
      role !== undefined &&
      !USER_ROLES.includes(role)
    ) ||
    (
      status !== undefined &&
      !USER_STATUSES.includes(status)
    ) ||
    (
      q !== undefined &&
      (
        typeof q !== 'string' ||
        q.length > 120
      )
    )
  ) {
    res.status(400).json({
      error: {
        message:
          'Invalid user list filter.',
      },
    });

    return;
  }

  try {
    res.status(200).json(
      await listPlatformUsers({
        page,
        limit,
        role,
        status,
        search: q?.trim(),
      }),
    );
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   CHANGE USER STATUS
========================================================= */

export async function changeUserStatus(
  req,
  res,
  next,
) {
  if (
    !mongoose.isValidObjectId(
      req.params.userId,
    )
  ) {
    res.status(400).json({
      error: {
        message:
          'A valid user ID is required.',
      },
    });

    return;
  }

  const { status } = req.body ?? {};

  if (
    ![
      'active',
      'suspended',
    ].includes(status)
  ) {
    res.status(400).json({
      error: {
        message:
          'Status must be active or suspended.',
      },
    });

    return;
  }

  try {
    const user =
      await updatePlatformUserStatus(
        req.auth.id,
        req.params.userId,
        status,
      );

    if (!user) {
      res.status(404).json({
        error: {
          message:
            'Non-administrator user was not found.',
        },
      });

      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   ADMIN JOB LIST
========================================================= */

export async function readJobs(
  req,
  res,
  next,
) {
  const page = pageValue(
    req.query.page,
    1,
    100000,
  );

  const limit = pageValue(
    req.query.limit,
    20,
    50,
  );

  const { status } = req.query;

  if (
    !page ||
    !limit ||
    (
      status !== undefined &&
      ![
        'draft',
        'published',
        'paused',
        'closed',
      ].includes(status)
    )
  ) {
    res.status(400).json({
      error: {
        message:
          'Invalid job list filter.',
      },
    });

    return;
  }

  try {
    res.status(200).json(
      await listPlatformJobs({
        page,
        limit,
        status,
      }),
    );
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   MODERATE JOB
========================================================= */

export async function moderateJob(
  req,
  res,
  next,
) {
  if (
    !mongoose.isValidObjectId(
      req.params.jobId,
    )
  ) {
    res.status(400).json({
      error: {
        message:
          'A valid job ID is required.',
      },
    });

    return;
  }

  if (
    ![
      'paused',
      'closed',
    ].includes(req.body?.status)
  ) {
    res.status(400).json({
      error: {
        message:
          'Moderation status must be paused or closed.',
      },
    });

    return;
  }

  try {
    const job =
      await moderatePlatformJob(
        req.params.jobId,
        req.body.status,
      );

    if (!job) {
      res.status(404).json({
        error: {
          message:
            'Job was not found.',
        },
      });

      return;
    }

    res.status(200).json({
      job,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   SYNC HIMALAYAS JOBS
========================================================= */

/**
 * Import jobs from Himalayas into JobMatch AI.
 *
 * Admin only.
 *
 * Query parameters:
 *
 * limit
 *   Number of jobs to fetch.
 *
 * cursor
 *   Cursor returned by the previous sync.
 *
 * Example:
 *
 * POST /api/admin/jobs/sync/himalayas?limit=5
 */
export async function syncHimalayas(
  req,
  res,
  next,
) {
  const limit = pageValue(
    req.query.limit,
    5,
    20,
  );

  const cursor =
    req.query.cursor;

  /* -------------------------------------------------------
     Validate limit
  ------------------------------------------------------- */

  if (!limit) {
    res.status(400).json({
      error: {
        message:
          'Limit must be a number between 1 and 20.',
      },
    });

    return;
  }

  /* -------------------------------------------------------
     Validate cursor
  ------------------------------------------------------- */

  if (
    cursor !== undefined &&
    (
      typeof cursor !== 'string' ||
      cursor.length > 2000
    )
  ) {
    res.status(400).json({
      error: {
        message:
          'Invalid synchronization cursor.',
      },
    });

    return;
  }

  try {
    const result =
      await syncHimalayasJobs({
        limit,
        cursor:
          cursor?.trim() || null,
      });

    res.status(200).json({
      message:
        'Himalayas job synchronization completed.',
      result,
    });
  } catch (error) {
    next(error);
  }
}
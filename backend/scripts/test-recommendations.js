import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { io } from 'socket.io-client';

let testUri = process.env.MONGODB_TEST_URI;
let memoryServer;

if (testUri) {
  const databaseName = new URL(testUri).pathname.replace(/^\//, '').split('?')[0];

  if (!databaseName || !/test/i.test(databaseName)) {
    throw new Error(
      'MONGODB_TEST_URI must use a database name containing "test".',
    );
  }
} else {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  testUri = memoryServer.getUri('jobmatch_ai_test');
}

const jwtSecret = randomBytes(48).toString('base64url');

process.env.JWT_SECRET = jwtSecret;

const [{ default: app }, { connectDatabase }, models] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/database.js'),
  import('../src/models/index.js'),
]);

const {
  Application,
  CandidateProfile,
  Company,
  Job,
  SavedJob,
  Skill,
  User,
} = models;

const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();

const employerId = new mongoose.Types.ObjectId();
const otherEmployerId = new mongoose.Types.ObjectId();

const companyId = new mongoose.Types.ObjectId();

const javascriptId = new mongoose.Types.ObjectId();
const reactId = new mongoose.Types.ObjectId();
const sqlId = new mongoose.Types.ObjectId();

/*
 * IMPORTANT:
 *
 * externalId is declared OUTSIDE the try block because it is also
 * required inside finally for database cleanup.
 */
const externalId = new mongoose.Types.ObjectId();

const prefix = `recommendations-${randomUUID()}`;

let server;
let connected = false;
let sockets = [];

const now = new Date();

function nextSocketEvent(socket, eventName, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, listener);
      reject(
        new Error(
          `Timed out waiting for Socket.IO event "${eventName}".`,
        ),
      );
    }, timeoutMs);

    const listener = (...args) => {
      clearTimeout(timer);
      resolve(args);
    };

    socket.once(eventName, listener);
  });
}

function tokenFor(subject, role) {
  return jwt.sign(
    { role },
    jwtSecret,
    {
      subject: String(subject),
      expiresIn: 3600,
      issuer: 'jobmatch-ai',
      audience: 'jobmatch-ai-web',
    },
  );
}

async function request(
  path,
  {
    method = 'GET',
    cookie,
    body,
  } = {},
) {
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api${path}`,
    {
      method,
      headers: {
        origin: 'http://localhost:5173',

        ...(cookie
          ? {
              cookie: `jobmatch_session=${cookie}`,
            }
          : {}),

        ...(body
          ? {
              'content-type': 'application/json',
            }
          : {}),
      },

      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    },
  );

  return {
    response,
    data: await response.json(),
  };
}

function job(title, overrides = {}) {
  return {
    title,

    description:
      `${title} building JavaScript and React applications.`,

    company: companyId,

    employer: employerId,

    location: {
      remoteType: 'remote',
    },

    employmentType: 'full-time',

    salary: {
      minimum: 80000,
      maximum: 120000,
      currency: 'USD',
      period: 'year',
      isDisclosed: true,
    },

    requiredSkills: [javascriptId],

    preferredSkills: [],

    minimumExperience: 0,

    status: 'published',

    publishedAt: now,

    ...overrides,
  };
}

try {
  await connectDatabase(testUri);

  connected = true;

  await Promise.all([
    Application.init(),
    SavedJob.init(),
    Job.init(),
  ]);

  await Promise.all([
    User.create({
      _id: userId,
      email: `${prefix}@example.test`,
      passwordHash: 'test-hash',
      role: 'candidate',
    }),

    User.create({
      _id: otherUserId,
      email: `${prefix}-other@example.test`,
      passwordHash: 'test-hash',
      role: 'candidate',
    }),

    User.create({
      _id: employerId,
      email: `${prefix}-employer@example.test`,
      passwordHash: 'test-hash',
      role: 'employer',
    }),

    User.create({
      _id: otherEmployerId,
      email: `${prefix}-other-employer@example.test`,
      passwordHash: 'test-hash',
      role: 'employer',
    }),

    Company.create({
      _id: companyId,
      name: 'Recommendation Labs',
      slug: `${prefix}-company`,
      createdBy: employerId,
    }),

    Skill.create([
      {
        _id: javascriptId,
        name: 'JavaScript',
        normalizedName: 'javascript',
        category: 'technical',
      },

      {
        _id: reactId,
        name: 'React',
        normalizedName: 'react',
        category: 'technical',
      },

      {
        _id: sqlId,
        name: 'SQL',
        normalizedName: 'sql',
        category: 'technical',
      },
    ]),

    CandidateProfile.create({
      user: userId,
      firstName: 'Casey',
      lastName: 'Candidate',

      skills: [
        {
          skill: javascriptId,
        },

        {
          skill: reactId,
        },
      ],

      preferredRoles: [
        'Backend Engineer',
      ],
    }),

    CandidateProfile.create({
      user: otherUserId,
      firstName: 'Riley',
      lastName: 'Other',
    }),
  ]);

  await Job.init();

  /*
   * ------------------------------------------------------------
   * TEST JOB IDS
   * ------------------------------------------------------------
   */

  const perfectId = new mongoose.Types.ObjectId();
  const partialId = new mongoose.Types.ObjectId();
  const closedId = new mongoose.Types.ObjectId();
  const expiredId = new mongoose.Types.ObjectId();
  const deadlineId = new mongoose.Types.ObjectId();

  /*
   * ------------------------------------------------------------
   * TEST JOBS
   * ------------------------------------------------------------
   */

  await Job.insertMany([
    /*
     * Normal platform job
     */
    job('Backend Engineer', {
      _id: perfectId,

      requiredSkills: [
        javascriptId,
        reactId,
      ],

      preferredSkills: [
        sqlId,
      ],
    }),

    /*
     * Partial match
     */
    job('Junior Engineer', {
      _id: partialId,

      requiredSkills: [
        javascriptId,
        sqlId,
      ],

      preferredSkills: [
        reactId,
      ],

      publishedAt: new Date(
        now.getTime() - 1000,
      ),
    }),

    /*
     * Closed job
     */
    job('Closed Engineer', {
      _id: closedId,
      status: 'closed',
    }),

    /*
     * Expired job
     */
    job('Expired Engineer', {
      _id: expiredId,

      expiresAt: new Date(
        now.getTime() - 1000,
      ),
    }),

    /*
     * Application deadline already passed
     */
    job('Past Deadline Engineer', {
      _id: deadlineId,

      applicationDeadline: new Date(
        now.getTime() - 1000,
      ),
    }),
  ]);

  /*
   * ------------------------------------------------------------
   * HTTP + SOCKET SERVER
   * ------------------------------------------------------------
   */

  server = createServer(app);

  const {
    attachSocketServer,
  } = await import('../src/sockets/index.js');

  attachSocketServer(server);

  await new Promise((resolve, reject) => {
    server.once('error', reject);

    server.listen(
      0,
      '127.0.0.1',
      resolve,
    );
  });

  /*
   * ------------------------------------------------------------
   * AUTH TOKENS
   * ------------------------------------------------------------
   */

  const candidateCookie =
    tokenFor(userId, 'candidate');

  const otherCandidateCookie =
    tokenFor(otherUserId, 'candidate');

  const employerCookie =
    tokenFor(employerId, 'employer');

  const otherEmployerCookie =
    tokenFor(otherEmployerId, 'employer');

  /*
   * ------------------------------------------------------------
   * AUTHORIZATION
   * ------------------------------------------------------------
   */

  const unauthorized =
    await request('/candidate/recommendations');

  assert.equal(
    unauthorized.response.status,
    401,
    'recommendations require authentication',
  );

  const forbidden =
    await request(
      '/candidate/recommendations',
      {
        cookie: tokenFor(
          employerId,
          'employer',
        ),
      },
    );

  assert.equal(
    forbidden.response.status,
    403,
    'recommendations are candidate-only',
  );

  /*
   * ------------------------------------------------------------
   * RECOMMENDATIONS
   * ------------------------------------------------------------
   */

  const listed =
    await request(
      '/candidate/recommendations',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    listed.response.status,
    200,
    JSON.stringify(listed.data),
  );

  assert.equal(
    listed.data.recommendations.length,
    2,
    'closed, expired, and past-deadline jobs are excluded',
  );

  assert.equal(
    listed.data.pagination.total,
    2,
  );

  assert.equal(
    listed.data.recommendations[0].job._id,
    perfectId.toString(),
    'score takes priority over publication date',
  );

  assert.equal(
    listed.data.recommendations[0].overallScore,
    45,
  );

  assert.equal(
    listed.data.recommendations[0].matchStrength,
    'Partial',
  );

  assert.deepEqual(
    listed.data.recommendations[0].matchedSkills,
    [
      'JavaScript',
      'React',
    ],
  );

  assert.deepEqual(
    listed.data.recommendations[0].missingPreferredSkills,
    [
      'SQL',
    ],
  );

  assert.equal(
    typeof listed.data.recommendations[0].categoryScores.skills,
    'number',
  );

  assert.equal(
    'employer' in listed.data.recommendations[0].job,
    false,
  );

  assert.equal(
    listed.data.recommendations[0].hasApplied,
    false,
  );

  assert.equal(
    listed.data.recommendations[0].isSaved,
    false,
  );

  /*
   * ------------------------------------------------------------
   * PAGINATION
   * ------------------------------------------------------------
   */

  const limited =
    await request(
      '/candidate/recommendations?limit=1',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    limited.data.recommendations.length,
    1,
  );

  assert.equal(
    limited.data.pagination.total,
    2,
  );

  const invalidLimit =
    await request(
      '/candidate/recommendations?limit=51',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    invalidLimit.response.status,
    400,
  );

  /*
   * ------------------------------------------------------------
   * SOCKET.IO
   * ------------------------------------------------------------
   */

  const socketOrigin =
    `http://127.0.0.1:${server.address().port}`;

  const candidateSocket =
    io(socketOrigin, {
      path: '/api/socket.io',

      transports: [
        'websocket',
      ],

      extraHeaders: {
        Cookie:
          `jobmatch_session=${candidateCookie}`,

        Origin:
          'http://localhost:5173',
      },

      autoConnect: false,

      reconnection: false,
    });

  const otherCandidateSocket =
    io(socketOrigin, {
      path: '/api/socket.io',

      transports: [
        'websocket',
      ],

      extraHeaders: {
        Cookie:
          `jobmatch_session=${otherCandidateCookie}`,

        Origin:
          'http://localhost:5173',
      },

      autoConnect: false,

      reconnection: false,
    });

  const employerSocket =
    io(socketOrigin, {
      path: '/api/socket.io',

      transports: [
        'websocket',
      ],

      extraHeaders: {
        Cookie:
          `jobmatch_session=${employerCookie}`,

        Origin:
          'http://localhost:5173',
      },

      autoConnect: false,

      reconnection: false,
    });

  sockets = [
    candidateSocket,
    otherCandidateSocket,
    employerSocket,
  ];

  const candidateReady =
    nextSocketEvent(
      candidateSocket,
      'connection:ready',
    );

  const connectedSockets =
    sockets.map(
      (socket) =>
        new Promise(
          (resolve, reject) => {
            const timeout =
              setTimeout(
                () =>
                  reject(
                    new Error(
                      'Timed out connecting authenticated Socket.IO client.',
                    ),
                  ),
                10000,
              );

            socket.once(
              'connect',
              () => {
                clearTimeout(timeout);
                resolve();
              },
            );

            socket.once(
              'connect_error',
              (error) => {
                clearTimeout(timeout);
                reject(error);
              },
            );

            socket.connect();
          },
        ),
    );

  await Promise.all(
    connectedSockets,
  );

  assert.equal(
    (await candidateReady)[0].userId,
    userId.toString(),
  );

  /*
   * Unauthenticated socket must fail.
   */
  const unauthenticatedSocket =
    io(socketOrigin, {
      path: '/api/socket.io',

      transports: [
        'websocket',
      ],

      reconnection: false,
    });

  const authenticationFailure =
    nextSocketEvent(
      unauthenticatedSocket,
      'connect_error',
    );

  unauthenticatedSocket.connect();

  assert.match(
    (await authenticationFailure)[0].message,
    /Authentication required/,
  );

  unauthenticatedSocket.disconnect();

  /*
   * ------------------------------------------------------------
   * PROFILE UPDATE REALTIME TEST
   * ------------------------------------------------------------
   */

  const profileUpdateEvent =
    nextSocketEvent(
      candidateSocket,
      'recommendations:updated',
    );

  const profileUpdate =
    await request(
      '/candidate/profile',
      {
        method: 'PATCH',

        cookie: candidateCookie,

        body: {
          preferredRoles: [
            'Backend Engineer',
            'Platform Engineer',
          ],
        },
      },
    );

  assert.equal(
    profileUpdate.response.status,
    200,
    JSON.stringify(profileUpdate.data),
  );

  const [profileEvent] =
    await profileUpdateEvent;

  assert.equal(
    profileEvent.trigger,
    'profile',
  );

  assert.ok(
    Array.isArray(
      profileEvent.recommendations,
    ),
  );

  let otherCandidateRecommendationEvents = 0;

  otherCandidateSocket.on(
    'recommendations:updated',
    () => {
      otherCandidateRecommendationEvents += 1;
    },
  );

  await new Promise(
    (resolve) =>
      setImmediate(resolve),
  );

  assert.equal(
    otherCandidateRecommendationEvents,
    0,
    'profile updates stay in the authenticated candidate room',
  );

  /*
   * ------------------------------------------------------------
   * NEW JOB + REALTIME MATCH
   * ------------------------------------------------------------
   */

  const newJobId =
    new mongoose.Types.ObjectId();

  await Job.create(
    job(
      'New Matching Platform Engineer',
      {
        _id: newJobId,

        status: 'draft',

        publishedAt: null,

        requiredSkills: [
          javascriptId,
        ],
      },
    ),
  );

  const newJobEvent =
    nextSocketEvent(
      candidateSocket,
      'jobs:matched',
    );

  const recommendationsAfterPublish =
    nextSocketEvent(
      candidateSocket,
      'recommendations:updated',
    );

  const publish =
    await request(
      `/employer/jobs/${newJobId}/publish`,
      {
        method: 'POST',

        cookie: employerCookie,
      },
    );

  assert.equal(
    publish.response.status,
    200,
    JSON.stringify(publish.data),
  );

  const [matchedEvent] =
    await newJobEvent;

  const [jobRecommendationsEvent] =
    await recommendationsAfterPublish;

  assert.equal(
    matchedEvent.recommendation.job._id,
    newJobId.toString(),
  );

  assert.equal(
    jobRecommendationsEvent.trigger,
    'new-job',
  );

  /*
   * ------------------------------------------------------------
   * RECOMMENDATION DETAILS
   * ------------------------------------------------------------
   */

  const details =
    await request(
      `/candidate/recommendations/${perfectId}`,
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    details.response.status,
    200,
  );

  assert.deepEqual(
    details.data.recommendation.categoryScores,
    listed.data.recommendations[0].categoryScores,
  );

  const invalidId =
    await request(
      '/candidate/recommendations/not-a-job',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    invalidId.response.status,
    400,
  );

  /*
   * ------------------------------------------------------------
   * SAVED JOBS
   * ------------------------------------------------------------
   */

  const save =
    await request(
      `/candidate/saved-jobs/${perfectId}`,
      {
        method: 'PUT',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    save.response.status,
    200,
  );

  assert.equal(
    save.data.saved,
    true,
  );

  const saveAgain =
    await request(
      `/candidate/saved-jobs/${perfectId}`,
      {
        method: 'PUT',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    saveAgain.response.status,
    200,
    'saving the same job is idempotent',
  );

  const afterSave =
    await request(
      '/candidate/recommendations',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    afterSave.data.recommendations.find(
      ({ job: item }) =>
        item._id === perfectId.toString(),
    ).isSaved,
    true,
  );

  const savedJobs =
    await request(
      '/candidate/saved-jobs',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    savedJobs.response.status,
    200,
  );

  assert.equal(
    savedJobs.data.savedJobs.length,
    1,
  );

  assert.equal(
    savedJobs.data.savedJobs[0].job._id,
    perfectId.toString(),
  );

  const unsave =
    await request(
      `/candidate/saved-jobs/${perfectId}`,
      {
        method: 'DELETE',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    unsave.data.saved,
    false,
  );

  /*
   * ------------------------------------------------------------
   * NORMAL INTERNAL APPLICATION
   * ------------------------------------------------------------
   */

  const employerApplicationEvent =
    nextSocketEvent(
      employerSocket,
      'applications:new',
    );

  const employerNotificationEvent =
    nextSocketEvent(
      employerSocket,
      'notifications:created',
    );

  const application =
    await request(
      `/candidate/jobs/${perfectId}/applications`,
      {
        method: 'POST',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    application.response.status,
    201,
    JSON.stringify(application.data),
  );

  assert.equal(
    application.data.application.matchScore,
    45,
  );

  const candidateApplications =
    await request(
      '/candidate/applications',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    candidateApplications.response.status,
    200,
  );

  assert.equal(
    candidateApplications.data.applications.length,
    1,
  );

  assert.equal(
    candidateApplications.data.applications[0].id,
    application.data.application.id,
  );

  const applicationDetails =
    await request(
      `/candidate/applications/${application.data.application.id}`,
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    applicationDetails.response.status,
    200,
  );

  assert.equal(
    applicationDetails.data.application.id,
    application.data.application.id,
  );

  assert.equal(
    'changedBy' in
      applicationDetails.data.application.statusHistory[0],
    false,
    'candidate status history omits internal user identifiers',
  );

  const otherCandidateApplication =
    await request(
      `/candidate/applications/${application.data.application.id}`,
      {
        cookie: otherCandidateCookie,
      },
    );

  assert.equal(
    otherCandidateApplication.response.status,
    404,
    'candidate application reads are owner-scoped',
  );

  const employerApplicants =
    await request(
      `/employer/jobs/${perfectId}/applications`,
      {
        cookie: employerCookie,
      },
    );

  assert.equal(
    employerApplicants.response.status,
    200,
  );

  assert.equal(
    employerApplicants.data.applicants.length,
    1,
  );

  /*
   * ------------------------------------------------------------
   * PROFILE PRIVACY
   * ------------------------------------------------------------
   */

  const hideProfile =
    await request(
      '/candidate/profile',
      {
        method: 'PATCH',

        cookie: candidateCookie,

        body: {
          profileVisibility: 'private',
        },
      },
    );

  assert.equal(
    hideProfile.response.status,
    200,
  );

  const privateApplicantList =
    await request(
      `/employer/jobs/${perfectId}/applications`,
      {
        cookie: employerCookie,
      },
    );

  assert.equal(
    privateApplicantList.response.status,
    200,
  );

  assert.equal(
    privateApplicantList.data
      .applicants[0]
      .candidate
      .profileVisible,
    false,
  );

  assert.equal(
    'firstName' in
      privateApplicantList.data
        .applicants[0]
        .candidate,
    false,
    'private candidate names are redacted from employers',
  );

  const restoreVisibility =
    await request(
      '/candidate/profile',
      {
        method: 'PATCH',

        cookie: candidateCookie,

        body: {
          profileVisibility: 'employers',
        },
      },
    );

  assert.equal(
    restoreVisibility.response.status,
    200,
  );

  /*
   * ------------------------------------------------------------
   * EMPLOYER OWNERSHIP
   * ------------------------------------------------------------
   */

  const otherEmployerApplicants =
    await request(
      `/employer/jobs/${perfectId}/applications`,
      {
        cookie: otherEmployerCookie,
      },
    );

  assert.equal(
    otherEmployerApplicants.response.status,
    404,
    'employer applicant lists are scoped to the employer-owned job',
  );

  const otherEmployerApplication =
    await request(
      `/employer/applications/${application.data.application.id}`,
      {
        cookie: otherEmployerCookie,
      },
    );

  assert.equal(
    otherEmployerApplication.response.status,
    404,
    'employers cannot read applications for another employer jobs',
  );

  const otherEmployerStatus =
    await request(
      `/employer/applications/${application.data.application.id}/status`,
      {
        method: 'PATCH',

        cookie: otherEmployerCookie,

        body: {
          status: 'shortlisted',
        },
      },
    );

  assert.equal(
    otherEmployerStatus.response.status,
    404,
    'employers cannot change another employer application status',
  );

  /*
   * ------------------------------------------------------------
   * APPLICATION REALTIME EVENTS
   * ------------------------------------------------------------
   */

  const [receivedApplication] =
    await employerApplicationEvent;

  assert.equal(
    receivedApplication.applicationId,
    application.data.application.id,
  );

  const [employerNotification] =
    await employerNotificationEvent;

  assert.equal(
    employerNotification.notification.type,
    'new-application',
  );

  let otherCandidateStatusEvents = 0;

  otherCandidateSocket.on(
    'applications:status-changed',
    () => {
      otherCandidateStatusEvents += 1;
    },
  );

  let otherCandidateNotificationEvents = 0;

  otherCandidateSocket.on(
    'notifications:created',
    () => {
      otherCandidateNotificationEvents += 1;
    },
  );

  const applicationStatusEvent =
    nextSocketEvent(
      candidateSocket,
      'applications:status-changed',
    );

  const shortlistedEvent =
    nextSocketEvent(
      candidateSocket,
      'applications:shortlisted',
    );

  const candidateNotificationEvent =
    nextSocketEvent(
      candidateSocket,
      'notifications:created',
    );

  const updateStatus =
    await request(
      `/employer/applications/${application.data.application.id}/status`,
      {
        method: 'PATCH',

        cookie: employerCookie,

        body: {
          status: 'shortlisted',
        },
      },
    );

  assert.equal(
    updateStatus.response.status,
    200,
    JSON.stringify(updateStatus.data),
  );

  assert.equal(
    (await applicationStatusEvent)[0].status,
    'shortlisted',
  );

  assert.equal(
    (await shortlistedEvent)[0].status,
    'shortlisted',
  );

  const [candidateNotification] =
    await candidateNotificationEvent;

  assert.equal(
    candidateNotification.notification.type,
    'application-status',
  );

  const candidateNotifications =
    await request(
      '/notifications',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    candidateNotifications.response.status,
    200,
  );

  assert.ok(
    candidateNotifications.data.unreadCount >= 1,
  );

  assert.ok(
    candidateNotifications.data.notifications.some(
      ({ type }) =>
        type === 'application-status',
    ),
  );

  const employerNotifications =
    await request(
      '/notifications',
      {
        cookie: employerCookie,
      },
    );

  assert.equal(
    employerNotifications.response.status,
    200,
  );

  assert.equal(
    employerNotifications.data.notifications[0].type,
    'new-application',
  );

  assert.equal(
    employerNotifications.data.unreadCount,
    1,
  );

  const otherCandidateNotifications =
    await request(
      '/notifications',
      {
        cookie: otherCandidateCookie,
      },
    );

  assert.equal(
    otherCandidateNotifications.data.notifications.some(
      ({ resource }) =>
        resource?.id ===
        application.data.application.id,
    ),
    false,
    'another candidate cannot read notifications tied to someone else application',
  );

  const notificationId =
    candidateNotifications.data.notifications.find(
      ({ type }) =>
        type === 'application-status',
    )._id;

  const readNotification =
    await request(
      `/notifications/${notificationId}/read`,
      {
        method: 'PATCH',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    readNotification.response.status,
    200,
  );

  const markAllRead =
    await request(
      '/notifications/read-all',
      {
        method: 'PATCH',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    markAllRead.response.status,
    200,
  );

  const unreadAfterRead =
    await request(
      '/notifications/unread-count',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    unreadAfterRead.data.unreadCount,
    0,
  );

  const rejectedEvent =
    nextSocketEvent(
      candidateSocket,
      'applications:rejected',
    );

  const rejectApplication =
    await request(
      `/employer/applications/${application.data.application.id}/status`,
      {
        method: 'PATCH',

        cookie: employerCookie,

        body: {
          status: 'rejected',
        },
      },
    );

  assert.equal(
    rejectApplication.response.status,
    200,
  );

  assert.equal(
    (await rejectedEvent)[0].status,
    'rejected',
  );

  await new Promise(
    (resolve) =>
      setImmediate(resolve),
  );

  assert.equal(
    otherCandidateStatusEvents,
    0,
    'application status changes are delivered only to the application candidate',
  );

  assert.equal(
    otherCandidateNotificationEvents,
    0,
    'application notifications are delivered only to their recipient',
  );

  /*
   * ------------------------------------------------------------
   * DUPLICATE APPLICATION
   * ------------------------------------------------------------
   */

  const duplicate =
    await request(
      `/candidate/jobs/${perfectId}/applications`,
      {
        method: 'POST',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    duplicate.response.status,
    409,
    'duplicate applications are rejected',
  );

  const afterApply =
    await request(
      '/candidate/recommendations',
      {
        cookie: candidateCookie,
      },
    );

  assert.equal(
    afterApply.data.recommendations.find(
      ({ job: item }) =>
        item._id === perfectId.toString(),
    ).hasApplied,
    true,
  );

  /*
   * ------------------------------------------------------------
   * CLOSED JOB
   * ------------------------------------------------------------
   */

  const applyClosed =
    await request(
      `/candidate/jobs/${closedId}/applications`,
      {
        method: 'POST',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    applyClosed.response.status,
    404,
    'closed roles cannot be applied to',
  );

  /*
   * ------------------------------------------------------------
   * EXTERNAL JOB APPLICATION
   * ------------------------------------------------------------
   */

  /*
   * Create external job only now.
   *
   * It is deliberately not part of the initial recommendation
   * fixture because this test focuses on the external apply flow.
   */
  await Job.create({
    _id: externalId,

    source: 'external',

    provider: 'himalayas',

    sourceJobId: `${prefix}-external-job`,

    title: 'External React Engineer',

    description:
      'External job for testing the external apply flow.',

    companyName: 'External Company',

    externalApplyUrl:
      'https://example.com/apply/external-react-engineer',

    location: {
      remoteType: 'remote',
    },

    employmentType: 'full-time',

    salary: {
      minimum: 80000,
      maximum: 120000,
      currency: 'USD',
      period: 'year',
      isDisclosed: true,
    },

    requiredSkills: [
      javascriptId,
    ],

    preferredSkills: [
      reactId,
    ],

    minimumExperience: 0,

    status: 'published',

    publishedAt: now,
  });

  const applicationsBeforeExternal =
    await Application.countDocuments({
      candidate: userId,
    });

  const externalApplication =
    await request(
      `/candidate/jobs/${externalId}/applications`,
      {
        method: 'POST',

        cookie: candidateCookie,
      },
    );

  assert.equal(
    externalApplication.response.status,
    201,
    JSON.stringify(externalApplication.data),
  );

  assert.equal(
    externalApplication.data.application.external,
    true,
    'external jobs must return external=true',
  );

  assert.equal(
    externalApplication.data.application.externalApplyUrl,
    'https://example.com/apply/external-react-engineer',
    'external jobs must return their external application URL',
  );

  assert.equal(
    typeof externalApplication.data.application.matchScore,
    'number',
    'external jobs should still return the candidate match score',
  );

  assert.equal(
    externalApplication.data.application.jobId,
    externalId.toString(),
    'external application response must contain the external job id',
  );

  const externalLocalApplications =
    await Application.countDocuments({
      candidate: userId,

      job: externalId,
    });

  assert.equal(
    externalLocalApplications,
    0,
    'external jobs must NEVER create a local Application record',
  );

  const applicationsAfterExternal =
    await Application.countDocuments({
      candidate: userId,
    });

  assert.equal(
    applicationsAfterExternal,
    applicationsBeforeExternal,
    'external apply must not increase the local application count',
  );

  /*
   * ------------------------------------------------------------
   * FINAL RESULT
   * ------------------------------------------------------------
   */

  console.log(
    'Recommendation integration checks passed: ranking, eligibility, external jobs, two authenticated Socket.IO sessions, event isolation, profile/job/application updates, saved jobs, notifications, and candidate actions.',
  );
} finally {
  /*
   * Disconnect sockets
   */
  sockets.forEach(
    (socket) =>
      socket.disconnect(),
  );

  /*
   * Stop HTTP server
   */
  if (server?.listening) {
    await new Promise(
      (resolve) =>
        server.close(resolve),
    );
  }

  /*
   * Cleanup database
   */
  if (connected) {
    const candidateIds =
      await CandidateProfile.find({
        user: {
          $in: [
            userId,
            otherUserId,
          ],
        },
      }).distinct('_id');

    await Promise.all([
      Application.deleteMany({
        candidate: {
          $in: candidateIds,
        },
      }),

      SavedJob.deleteMany({
        candidate: {
          $in: candidateIds,
        },
      }),

      CandidateProfile.deleteMany({
        user: {
          $in: [
            userId,
            otherUserId,
          ],
        },
      }),

      Job.deleteMany({
        $or: [
          {
            employer: employerId,
          },

          {
            _id: externalId,
          },
        ],
      }),

      Company.deleteOne({
        _id: companyId,
      }),

      Skill.deleteMany({
        _id: {
          $in: [
            javascriptId,
            reactId,
            sqlId,
          ],
        },
      }),

      User.deleteMany({
        _id: {
          $in: [
            userId,
            otherUserId,
            employerId,
            otherEmployerId,
          ],
        },
      }),
    ]);

    await mongoose.disconnect();
  }

  await memoryServer?.stop();
}
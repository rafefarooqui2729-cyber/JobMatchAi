import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

let testUri = process.env.MONGODB_TEST_URI;
let memoryServer;
if (testUri) {
  const databaseName = new URL(testUri).pathname.replace(/^\//, '').split('?')[0];
  if (!databaseName || !/test/i.test(databaseName)) {
    throw new Error('MONGODB_TEST_URI must use a database name containing "test".');
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
const { CandidateProfile, Company, EmployerProfile, User } = models;
const emailPrefix = `auth-${randomUUID()}`;
const candidateEmail = `${emailPrefix}-candidate@example.test`;
const employerEmail = `${emailPrefix}-employer@example.test`;
const adminEmail = `${emailPrefix}-admin@example.test`;
const additionalRegistrationEmail = `${emailPrefix}-additional@example.test`;
let server;
let databaseConnected = false;
let candidateCookie;

function cookieFrom(response) {
  const cookie = response.headers.get('set-cookie');
  assert.ok(cookie, 'response should set an HttpOnly session cookie');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Path=\/api(?:;|$)/i, 'session cookie is scoped for authenticated API resources');
  return cookie.split(';', 1)[0];
}

async function request(path, { method = 'GET', body, cookie, origin = 'http://localhost:5173' } = {}) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth${path}`, {
    method,
    headers: {
      origin,
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  return { response, data };
}

async function platformRequest(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method,
    headers: {
      origin: 'http://localhost:5173',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: response.status === 204 ? null : await response.json() };
}

async function removeTestAccounts() {
  const users = await User.find({ email: { $in: [candidateEmail, employerEmail, adminEmail, additionalRegistrationEmail] } })
    .select('_id');
  const userIds = users.map(({ _id }) => _id);
  if (userIds.length) {
    await Promise.all([
      CandidateProfile.deleteMany({ user: { $in: userIds } }),
      EmployerProfile.deleteMany({ user: { $in: userIds } }),
      Company.deleteMany({ createdBy: { $in: userIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);
  }
}

try {
  await connectDatabase(testUri);
  databaseConnected = true;
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  await removeTestAccounts();
  await User.create({
    email: adminEmail,
    passwordHash: await bcrypt.hash('Admin-test-pass-987', 4),
    role: 'admin',
  });

  const unauthenticated = await request('/me');
  assert.equal(unauthenticated.response.status, 401, 'current-user rejects unauthenticated requests');

  const invalidRegistration = await request('/candidate/register', {
    method: 'POST',
    body: { email: 'bad-email', password: 'short', firstName: '', lastName: 'Candidate' },
  });
  assert.equal(invalidRegistration.response.status, 400, 'registration validates input');
  const crossOriginLogin = await request('/candidate/login', {
    method: 'POST',
    origin: 'https://untrusted.example',
    body: { email: candidateEmail, password: 'Candidate-test-pass-123' },
  });
  assert.equal(crossOriginLogin.response.status, 403, 'cross-origin authentication requests are rejected');

  const candidateRegistration = await request('/candidate/register', {
    method: 'POST',
    body: {
      email: candidateEmail,
      password: 'Candidate-test-pass-123',
      firstName: 'Casey',
      lastName: 'Candidate',
    },
  });
  assert.equal(candidateRegistration.response.status, 201, 'candidate can register');
  assert.equal(candidateRegistration.data.user.role, 'candidate');
  assert.equal('password' in candidateRegistration.data.user, false);
  assert.equal('passwordHash' in candidateRegistration.data.user, false);
  assert.equal(JSON.stringify(candidateRegistration.data).includes('Candidate-test-pass-123'), false);
  const storedCandidate = await User.findOne({ email: candidateEmail }).select('+passwordHash');
  assert.ok(storedCandidate.passwordHash.startsWith('$2'), 'password is stored as a bcrypt hash');
  assert.notEqual(storedCandidate.passwordHash, 'Candidate-test-pass-123');
  assert.equal(await bcrypt.compare('Candidate-test-pass-123', storedCandidate.passwordHash), true);
  candidateCookie = cookieFrom(candidateRegistration.response);

  const duplicate = await request('/candidate/register', {
    method: 'POST',
    body: {
      email: candidateEmail,
      password: 'Candidate-test-pass-123',
      firstName: 'Casey',
      lastName: 'Candidate',
    },
  });
  assert.equal(duplicate.response.status, 409, 'duplicate email is rejected');

  const currentCandidate = await request('/me', { cookie: candidateCookie });
  assert.equal(currentCandidate.response.status, 200);
  assert.equal(currentCandidate.data.user.email, candidateEmail);
  assert.equal('password' in currentCandidate.data.user, false);
  assert.equal('passwordHash' in currentCandidate.data.user, false);
  const tamperedCookie = `${candidateCookie.slice(0, -3)}xxx`;
  assert.equal((await request('/me', { cookie: tamperedCookie })).response.status, 401, 'tampered JWT is rejected');
  assert.equal((await request('/me', { cookie: 'not-a-jwt' })).response.status, 401, 'malformed JWT is rejected');
  const wrongIssuer = jwt.sign(
    { role: 'candidate' },
    jwtSecret,
    { subject: candidateRegistration.data.user.id, expiresIn: 3600, issuer: 'attacker', audience: 'jobmatch-ai-web' },
  );
  assert.equal((await request('/me', { cookie: `jobmatch_session=${wrongIssuer}` })).response.status, 401, 'wrong JWT issuer is rejected');
  const forgedRole = jwt.sign(
    { role: 'admin' },
    jwtSecret,
    { subject: candidateRegistration.data.user.id, expiresIn: 3600, issuer: 'jobmatch-ai', audience: 'jobmatch-ai-web' },
  );
  assert.equal((await request('/admin/access', { cookie: `jobmatch_session=${forgedRole}` })).response.status, 403, 'authorization uses the stored role, not the JWT role claim');

  const wrongCandidatePassword = await request('/candidate/login', {
    method: 'POST',
    body: { email: candidateEmail, password: 'Wrong-password-123' },
  });
  assert.equal(wrongCandidatePassword.response.status, 401, 'invalid credentials are rejected');

  const candidateLogin = await request('/candidate/login', {
    method: 'POST',
    body: { email: candidateEmail, password: 'Candidate-test-pass-123' },
  });
  assert.equal(candidateLogin.response.status, 200, 'candidate can log in');
  assert.equal('password' in candidateLogin.data.user, false);
  assert.equal('passwordHash' in candidateLogin.data.user, false);
  assert.equal(JSON.stringify(candidateLogin.data).includes('Candidate-test-pass-123'), false);
  candidateCookie = cookieFrom(candidateLogin.response);

  const employerRegistration = await request('/employer/register', {
    method: 'POST',
    body: {
      email: employerEmail,
      password: 'Employer-test-pass-123',
      firstName: 'Elliot',
      lastName: 'Employer',
      companyName: 'Integration Test Company',
    },
  });
  assert.equal(employerRegistration.response.status, 201, 'employer can register with a company profile');
  assert.equal(employerRegistration.data.user.role, 'employer');
  cookieFrom(employerRegistration.response);
  const allowedAdditionalRegistration = await request('/candidate/register', {
    method: 'POST',
    body: {
      email: additionalRegistrationEmail,
      password: 'Additional-test-pass-987',
      firstName: 'Additional',
      lastName: 'Candidate',
    },
  });
  assert.equal(allowedAdditionalRegistration.response.status, 201, 'the registration limit allows up to five attempts in its window');
  const registrationRateLimit = await request('/candidate/register', {
    method: 'POST',
    body: {
      email: `blocked-${emailPrefix}@example.test`,
      password: 'Additional-test-pass-987',
      firstName: 'Blocked',
      lastName: 'Candidate',
    },
  });
  assert.equal(registrationRateLimit.response.status, 429, 'repeated registration attempts are rate limited');

  const employerLogin = await request('/employer/login', {
    method: 'POST',
    body: { email: employerEmail, password: 'Employer-test-pass-123' },
  });
  assert.equal(employerLogin.response.status, 200, 'employer can log in');
  const employerCookie = cookieFrom(employerLogin.response);
  const currentEmployer = await request('/me', { cookie: employerCookie });
  assert.equal(currentEmployer.response.status, 200, 'employer can retrieve the current user');
  assert.equal(currentEmployer.data.user.role, 'employer');

  const employerOnCandidateLogin = await request('/candidate/login', {
    method: 'POST',
    body: { email: employerEmail, password: 'Employer-test-pass-123' },
  });
  assert.equal(employerOnCandidateLogin.response.status, 401, 'employer credentials cannot use candidate login');

  const candidateForbidden = await request('/admin/access', { cookie: candidateCookie });
  assert.equal(candidateForbidden.response.status, 403, 'candidate cannot use protected admin access');

  const wrongAdminRole = await request('/admin/login', {
    method: 'POST',
    body: { email: candidateEmail, password: 'Candidate-test-pass-123' },
  });
  assert.equal(wrongAdminRole.response.status, 401, 'non-admin cannot use admin login');

  const adminLogin = await request('/admin/login', {
    method: 'POST',
    body: { email: adminEmail, password: 'Admin-test-pass-987' },
  });
  assert.equal(adminLogin.response.status, 200, 'provisioned administrator can log in');
  const adminCookie = cookieFrom(adminLogin.response);
  const currentAdmin = await request('/me', { cookie: adminCookie });
  assert.equal(currentAdmin.response.status, 200, 'administrator can retrieve the current user');
  assert.equal(currentAdmin.data.user.role, 'admin');
  const adminAccess = await request('/admin/access', { cookie: adminCookie });
  assert.equal(adminAccess.response.status, 200, 'administrator can access protected admin endpoint');
  assert.equal((await platformRequest('/admin/overview', { cookie: candidateCookie })).response.status, 403, 'candidates cannot use administration APIs');
  const overview = await platformRequest('/admin/overview', { cookie: adminCookie });
  assert.equal(overview.response.status, 200);
  assert.ok(Number.isInteger(overview.data.counts.candidates));
  const userListing = await platformRequest('/admin/users', { cookie: adminCookie });
  assert.equal(userListing.response.status, 200);
  assert.ok(userListing.data.users.every((user) => !('passwordHash' in user) && !('password' in user)));
  const unsafeSearch = await platformRequest('/admin/users?q=.*', { cookie: adminCookie });
  assert.equal(unsafeSearch.response.status, 200);
  assert.equal(unsafeSearch.data.users.length, 0, 'admin email search treats regular-expression syntax literally');
  const selfSuspend = await platformRequest(`/admin/users/${adminLogin.data.user.id}/status`, {
    method: 'PATCH',
    cookie: adminCookie,
    body: { status: 'suspended' },
  });
  assert.equal(selfSuspend.response.status, 409, 'administrators cannot suspend themselves');
  const suspendCandidate = await platformRequest(`/admin/users/${candidateRegistration.data.user.id}/status`, {
    method: 'PATCH',
    cookie: adminCookie,
    body: { status: 'suspended' },
  });
  assert.equal(suspendCandidate.response.status, 200);
  assert.equal(suspendCandidate.data.user.status, 'suspended');
  const suspendedProfile = await platformRequest('/candidate/profile', { cookie: candidateCookie });
  assert.equal(suspendedProfile.response.status, 401, 'suspended accounts cannot use authenticated product APIs');
  const reactivateCandidate = await platformRequest(`/admin/users/${candidateRegistration.data.user.id}/status`, {
    method: 'PATCH',
    cookie: adminCookie,
    body: { status: 'active' },
  });
  assert.equal(reactivateCandidate.response.status, 200);
  const adminJobs = await platformRequest('/admin/jobs', { cookie: adminCookie });
  assert.equal(adminJobs.response.status, 200);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const limitedAttempt = await request('/candidate/login', {
      method: 'POST',
      body: { email: `unknown-${attempt}@example.test`, password: 'Wrong-password-123' },
    });
    assert.equal(limitedAttempt.response.status, 401, 'authentication failures remain generic below the limit');
  }
  const rateLimited = await request('/candidate/login', {
    method: 'POST',
    body: { email: 'unknown-final@example.test', password: 'Wrong-password-123' },
  });
  assert.equal(rateLimited.response.status, 429, 'repeated authentication attempts are rate limited');

  const logout = await request('/logout', { method: 'POST', cookie: candidateCookie });
  assert.equal(logout.response.status, 200, 'logout succeeds');
  const clearedSession = await request('/me', { cookie: logout.response.headers.get('set-cookie')?.split(';', 1)[0] });
  assert.equal(clearedSession.response.status, 401, 'logout clears the session cookie');

  console.log('Authentication integration checks passed: candidate/employer registration, duplicate handling, role-specific login, current user, logout, role enforcement, and admin access.');
} finally {
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (databaseConnected) {
    await removeTestAccounts();
    await mongoose.disconnect();
  }
  await memoryServer?.stop();
}

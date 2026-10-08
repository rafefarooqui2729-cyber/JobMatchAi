import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { unlink } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
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

process.env.JWT_SECRET ??= randomBytes(48).toString('base64url');

const [{ default: app }, { connectDatabase }, models] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/database.js'),
  import('../src/models/index.js'),
]);
const { Application, Company, EmployerProfile, Job, Skill, User } = models;
const suffix = randomUUID();
const createdUserIds = [];
const skillSuffix = suffix.slice(0, 8);
let server;
let databaseConnected = false;
let uploadedLogoUrl;

async function request(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method,
    headers: {
      origin: 'http://localhost:5173',
      ...(body && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}

async function registerEmployer(label) {
  const result = await request('/auth/employer/register', {
    method: 'POST',
    body: {
      email: `employer-${label}-${suffix}@example.test`,
      password: 'Employer-module-test-42',
      firstName: 'Jordan',
      lastName: 'Employer',
      companyName: `${label} Test Company ${suffix.slice(0, 6)}`,
    },
  });
  assert.equal(result.response.status, 201, `employer ${label} registration succeeds`);
  const id = new mongoose.Types.ObjectId(result.data.user.id);
  createdUserIds.push(id);
  return { id, cookie: result.response.headers.get('set-cookie').split(';', 1)[0] };
}

try {
  await connectDatabase(testUri);
  databaseConnected = true;
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const owner = await registerEmployer('owner');
  const other = await registerEmployer('other');

  const anonymous = await request('/employer/company');
  assert.equal(anonymous.response.status, 401, 'company API requires authentication');
  const companyRead = await request('/employer/company', { cookie: owner.cookie });
  assert.equal(companyRead.response.status, 200, 'employer can load linked company');
  const companyId = companyRead.data.company._id;
  assert.equal('passwordHash' in companyRead.data.company, false);

  const companyUpdate = await request('/employer/company', {
    method: 'PATCH',
    cookie: owner.cookie,
    body: {
      name: 'Updated Test Company',
      description: 'A company profile updated by its employer.',
      website: 'https://example.test',
      industry: 'Software',
      size: '11-50',
      headquarters: { city: 'Seattle', region: 'WA', country: 'United States', countryCode: 'US' },
    },
  });
  assert.equal(companyUpdate.response.status, 200, 'employer updates company profile');
  assert.equal(companyUpdate.data.company.headquarters.city, 'Seattle');
  const invalidCompany = await request('/employer/company', {
    method: 'PATCH',
    cookie: owner.cookie,
    body: { name: 'Unsafe', unexpected: true },
  });
  assert.equal(invalidCompany.response.status, 400, 'company update rejects unknown fields');

  const logo = new FormData();
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p8sAAAAASUVORK5CYII=',
    'base64',
  );
  logo.append('logo', new Blob([onePixelPng], { type: 'image/png' }), 'company.png');
  const logoUpload = await request('/employer/company/logo', { method: 'POST', cookie: owner.cookie, body: logo });
  assert.equal(logoUpload.response.status, 200, `valid logo upload succeeds: ${JSON.stringify(logoUpload.data)}`);
  uploadedLogoUrl = logoUpload.data.company.logoUrl;
  assert.match(uploadedLogoUrl, /^\/uploads\/company-logos\/[a-f\d-]+\.png$/i);
  const publicLogo = await fetch(`http://127.0.0.1:${server.address().port}${uploadedLogoUrl}`);
  assert.equal(publicLogo.status, 200, 'uploaded logo can be served publicly');
  const invalidLogo = new FormData();
  invalidLogo.append('logo', new Blob(['not an image'], { type: 'image/png' }), 'fake.png');
  const rejectedLogo = await request('/employer/company/logo', { method: 'POST', cookie: owner.cookie, body: invalidLogo });
  assert.equal(rejectedLogo.response.status, 400, 'logo file signature must match its content type');

  const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const jobPayload = {
    title: 'Associate Software Engineer',
    description: 'Build reliable web services with a collaborative engineering team.',
    responsibilities: ['Implement APIs', 'Review code'],
    requiredSkills: [`Employer Test Skill ${skillSuffix}`, 'Node.js'],
    preferredSkills: [`Employer Database Skill ${skillSuffix}`],
    minimumExperience: 0,
    maximumExperience: 2,
    educationRequirements: [{ minimumLevel: 'bachelor', fieldsOfStudy: ['Computer Science'], isRequired: false }],
    location: { city: 'Seattle', region: 'WA', country: 'United States', countryCode: 'US', remoteType: 'hybrid' },
    employmentType: 'full-time',
    salary: { minimum: 70000, maximum: 90000, currency: 'USD', period: 'year', isDisclosed: true },
    applicationDeadline: futureDeadline,
  };
  const created = await request('/employer/jobs', { method: 'POST', cookie: owner.cookie, body: jobPayload });
  assert.equal(created.response.status, 201, `employer can create a job: ${JSON.stringify(created.data)}`);
  const jobId = created.data.job._id;
  assert.equal(created.data.job.company._id, companyId);
  assert.equal(created.data.job.status, 'draft');
  assert.equal(created.data.job.requiredSkills.length, 2, 'skill names are normalized and duplicates resolved');
  const normalizedSkillId = created.data.job.requiredSkills.find((name) => name.toLowerCase().startsWith('employer test skill'));
  const duplicateSkillInput = await request('/employer/jobs', {
    method: 'POST',
    cookie: owner.cookie,
    body: { ...jobPayload, requiredSkills: [`Employer Test Skill ${skillSuffix}`, ` employer_test_skill_${skillSuffix} `] },
  });
  assert.equal(duplicateSkillInput.response.status, 400, 'duplicate skills are rejected after normalization');

  const spoofed = await request('/employer/jobs', {
    method: 'POST',
    cookie: owner.cookie,
    body: { ...jobPayload, company: other.id.toString(), employer: other.id.toString() },
  });
  assert.equal(spoofed.response.status, 400, 'client cannot override ownership fields');
  const invalidJob = await request('/employer/jobs', {
    method: 'POST',
    cookie: owner.cookie,
    body: { ...jobPayload, maximumExperience: -1 },
  });
  assert.equal(invalidJob.response.status, 400, 'job fields are validated');
  const invalidDeadline = await request('/employer/jobs', {
    method: 'POST',
    cookie: owner.cookie,
    body: { ...jobPayload, applicationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
  });
  assert.equal(invalidDeadline.response.status, 400, 'new jobs cannot have a past application deadline');

  const ownerList = await request('/employer/jobs', { cookie: owner.cookie });
  assert.equal(ownerList.response.status, 200);
  assert.equal(ownerList.data.jobs.some((job) => job._id === jobId), true, 'job appears in employer list');
  const ownerRead = await request(`/employer/jobs/${jobId}`, { cookie: owner.cookie });
  assert.equal(ownerRead.response.status, 200);
  const ownerEdit = await request(`/employer/jobs/${jobId}`, {
    method: 'PATCH',
    cookie: owner.cookie,
    body: {
      title: 'Software Engineer I',
      requiredSkills: [`employer test skill ${skillSuffix}`],
    },
  });
  assert.equal(ownerEdit.response.status, 200, 'owner edits job');
  assert.equal(ownerEdit.data.job.title, 'Software Engineer I');
  assert.equal(ownerEdit.data.job.requiredSkills[0], `Employer Test Skill ${skillSuffix}`, 'normalized skill names resolve to one stored skill');
  assert.ok(normalizedSkillId);
  const otherRead = await request(`/employer/jobs/${jobId}`, { cookie: other.cookie });
  assert.equal(otherRead.response.status, 404, 'other employer cannot read job');
  const otherEdit = await request(`/employer/jobs/${jobId}`, {
    method: 'PATCH',
    cookie: other.cookie,
    body: { title: 'Unauthorized edit' },
  });
  assert.equal(otherEdit.response.status, 404, 'other employer cannot edit job');
  const otherDelete = await request(`/employer/jobs/${jobId}`, { method: 'DELETE', cookie: other.cookie });
  assert.equal(otherDelete.response.status, 404, 'other employer cannot delete job');

  const published = await request(`/employer/jobs/${jobId}/publish`, { method: 'POST', cookie: owner.cookie });
  assert.equal(published.response.status, 200);
  assert.equal(published.data.job.status, 'published');
  assert.ok(published.data.job.publishedAt);
  const closed = await request(`/employer/jobs/${jobId}/close`, { method: 'POST', cookie: owner.cookie });
  assert.equal(closed.response.status, 200);
  assert.equal(closed.data.job.status, 'closed');
  const republishClosed = await request(`/employer/jobs/${jobId}/publish`, { method: 'POST', cookie: owner.cookie });
  assert.equal(republishClosed.response.status, 409, 'closed jobs cannot be published');

  const application = await Application.create({
    candidate: new mongoose.Types.ObjectId(),
    job: new mongoose.Types.ObjectId(jobId),
  });
  const blockedDelete = await request(`/employer/jobs/${jobId}`, { method: 'DELETE', cookie: owner.cookie });
  assert.equal(blockedDelete.response.status, 409, 'jobs with applications cannot be deleted');
  await Application.deleteOne({ _id: application._id });
  const removed = await request(`/employer/jobs/${jobId}`, { method: 'DELETE', cookie: owner.cookie });
  assert.equal(removed.response.status, 204, 'owner deletes job');
  const missing = await request(`/employer/jobs/${jobId}`, { cookie: owner.cookie });
  assert.equal(missing.response.status, 404, 'deleted job is no longer available');
  const invalidId = await request('/employer/jobs/not-an-object-id', { cookie: owner.cookie });
  assert.equal(invalidId.response.status, 400, 'job IDs are validated');

  const candidate = await request('/auth/candidate/register', {
    method: 'POST',
    body: {
      email: `candidate-${suffix}@example.test`,
      password: 'Candidate-module-test-42',
      firstName: 'Casey',
      lastName: 'Candidate',
    },
  });
  assert.equal(candidate.response.status, 201);
  createdUserIds.push(new mongoose.Types.ObjectId(candidate.data.user.id));
  const candidateAccess = await request('/employer/jobs', {
    cookie: candidate.response.headers.get('set-cookie').split(';', 1)[0],
  });
  assert.equal(candidateAccess.response.status, 403, 'candidate cannot access employer API');

  console.log('Employer integration checks passed: company read/update, logo upload validation/serving, job CRUD, skill normalization, validation, ownership, publishing/closing, and role authorization.');
} finally {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  if (databaseConnected) {
    if (uploadedLogoUrl) {
      const logoPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'uploads', basename(uploadedLogoUrl));
      await unlink(logoPath).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    const jobIds = await Job.find({ employer: { $in: createdUserIds } }).distinct('_id');
    await Application.deleteMany({ job: { $in: jobIds } });
    await Promise.all([
      Job.deleteMany({ employer: { $in: createdUserIds } }),
      EmployerProfile.deleteMany({ user: { $in: createdUserIds } }),
      Company.deleteMany({ createdBy: { $in: createdUserIds } }),
      User.deleteMany({ _id: { $in: createdUserIds } }),
      Skill.deleteMany({
        normalizedName: {
          $in: [
            `employer test skill ${skillSuffix}`,
            `employer database skill ${skillSuffix}`,
          ],
        },
      }),
    ]);
    await mongoose.disconnect();
  }
  await memoryServer?.stop();
}

import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
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
const { Company, Job, Skill, User } = models;
const ownerId = new mongoose.Types.ObjectId();
const companyId = new mongoose.Types.ObjectId();
const skillId = new mongoose.Types.ObjectId();
let server;
let connected = false;

async function request(path) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`);
  return {
    response,
    data: await response.json(),
  };
}

function publishedJob(title, overrides = {}) {
  return {
    title,
    description: `${title} work with JavaScript, web platforms, and modern services.`,
    company: companyId,
    employer: ownerId,
    location: { city: 'Seattle', region: 'WA', country: 'United States', countryCode: 'US', remoteType: 'hybrid' },
    employmentType: 'full-time',
    salary: { minimum: 90000, maximum: 130000, currency: 'USD', period: 'year', isDisclosed: true },
    requiredSkills: [skillId],
    preferredSkills: [],
    minimumExperience: 2,
    maximumExperience: 5,
    status: 'published',
    publishedAt: new Date(),
    ...overrides,
  };
}

try {
  await connectDatabase(testUri);
  connected = true;
  await Job.init();
  await Promise.all([
    User.create({
      _id: ownerId,
      email: `discovery-${randomUUID()}@example.test`,
      passwordHash: 'not-used-in-test',
      role: 'employer',
    }),
    Company.create({
      _id: companyId,
      name: 'Discovery Company',
      slug: `discovery-company-${randomUUID()}`,
      createdBy: ownerId,
      website: 'https://example.test',
    }),
    Skill.create({
      _id: skillId,
      name: 'JavaScript',
      normalizedName: 'javascript',
      aliases: ['js'],
      category: 'technical',
    }),
  ]);

  const newestId = new mongoose.Types.ObjectId();
  const olderId = new mongoose.Types.ObjectId();
  const noSalaryId = new mongoose.Types.ObjectId();
  const closedId = new mongoose.Types.ObjectId();
  await Job.insertMany([
    publishedJob('Junior JavaScript Engineer', { _id: olderId, createdAt: new Date('2026-01-01'), publishedAt: new Date('2026-01-01') }),
    publishedJob('Senior Platform Engineer', {
      _id: newestId,
      title: 'Senior JavaScript Platform Engineer',
      employmentType: 'contract',
      location: { city: 'Austin', region: 'TX', country: 'United States', countryCode: 'US', remoteType: 'onsite' },
      salary: { minimum: 150000, maximum: 180000, currency: 'USD', period: 'year', isDisclosed: true },
      minimumExperience: 6,
      maximumExperience: 10,
      publishedAt: new Date('2026-10-05'),
      createdAt: new Date('2026-10-05'),
    }),
    publishedJob('Remote Design Systems Engineer', {
      _id: noSalaryId,
      employmentType: 'full-time',
      location: { remoteType: 'remote' },
      salary: { isDisclosed: false },
      requiredSkills: [],
      preferredSkills: [],
      minimumExperience: 0,
      maximumExperience: undefined,
      publishedAt: new Date('2026-10-04'),
      createdAt: new Date('2026-10-04'),
    }),
    publishedJob('Closed JavaScript Engineer', { _id: closedId, status: 'closed' }),
  ]);

  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const all = await request('/jobs');
  assert.equal(all.response.status, 200);
  assert.equal(all.data.pagination.total, 3, 'draft/closed jobs are excluded');
  assert.equal(all.data.jobs[0].title, 'Senior JavaScript Platform Engineer', 'newest sort uses publication date');
  assert.equal(all.data.jobs[0].company.name, 'Discovery Company');
  assert.deepEqual(all.data.jobs[0].requiredSkills, ['JavaScript']);
  assert.equal('employer' in all.data.jobs[0], false, 'public result omits employer identity');

  const title = await request('/jobs?title=platform');
  assert.equal(title.data.pagination.total, 1);
  assert.equal(title.data.jobs[0]._id, newestId.toString());

  const skillAlias = await request('/jobs?skill=JS');
  assert.equal(skillAlias.data.pagination.total, 2, 'skill aliases resolve to canonical skill records');

  const location = await request('/jobs?location=Seattle');
  assert.equal(location.data.pagination.total, 1);

  const employment = await request('/jobs?employmentType=contract');
  assert.equal(employment.data.pagination.total, 1);

  const combined = await request('/jobs?title=JavaScript&skill=JS&location=Seattle&employmentType=full-time');
  assert.equal(combined.data.pagination.total, 1, 'independent filters compose without overwriting OR clauses');
  const safeLiteral = await request('/jobs?title=%5B%2A%5D');
  assert.equal(safeLiteral.data.pagination.total, 0, 'title input is treated as a literal, not an executable regex');
  const noResults = await request('/jobs?location=Reykjavik');
  assert.equal(noResults.data.jobs.length, 0);
  assert.equal(noResults.data.pagination.total, 0);
  assert.equal(noResults.data.pagination.totalPages, 1);

  const experience = await request('/jobs?minExperience=3&maxExperience=7');
  assert.equal(experience.data.pagination.total, 3, 'experience range filter selects overlapping job requirements');

  const salary = await request('/jobs?minSalary=140000&salaryCurrency=USD');
  assert.equal(salary.data.pagination.total, 1);
  const maxSalary = await request('/jobs?maxSalary=100000');
  assert.equal(maxSalary.data.pagination.total, 1);

  const newest = await request('/jobs?sort=newest');
  assert.equal(newest.data.jobs[0]._id, newestId.toString());
  const salarySort = await request('/jobs?sort=salary');
  assert.equal(salarySort.data.jobs[0]._id, newestId.toString());
  const relevance = await request('/jobs?q=Senior&sort=relevance');
  assert.equal(relevance.response.status, 200, `text relevance search succeeds: ${JSON.stringify(relevance.data)}`);
  assert.equal(relevance.data.jobs.length, 1);
  assert.equal(relevance.data.jobs[0]._id, newestId.toString());

  const page = await request('/jobs?limit=1&page=1');
  assert.equal(page.data.jobs.length, 1);
  assert.equal(page.data.pagination.totalPages, 3);
  assert.equal(page.data.pagination.hasNextPage, true);
  const lastPage = await request('/jobs?limit=1&page=999');
  assert.equal(lastPage.data.pagination.page, 3, 'overlarge page requests clamp to the final page');
  assert.equal(lastPage.data.pagination.hasNextPage, false);
  assert.equal(lastPage.data.pagination.hasPreviousPage, true);

  const invalidRange = await request('/jobs?minSalary=100000&maxSalary=1');
  assert.equal(invalidRange.response.status, 400, 'invalid range rejected');
  const invalidExperienceRange = await request('/jobs?minExperience=10&maxExperience=2');
  assert.equal(invalidExperienceRange.response.status, 400);
  const invalidType = await request('/jobs?employmentType=volunteer');
  assert.equal(invalidType.response.status, 400, 'invalid employment type rejected');
  const invalidSort = await request('/jobs?sort=match-score');
  assert.equal(invalidSort.response.status, 400, 'unsupported sort rejected');
  const relevanceWithoutQuery = await request('/jobs?sort=relevance');
  assert.equal(relevanceWithoutQuery.response.status, 400);
  const badPage = await request('/jobs?page=0');
  assert.equal(badPage.response.status, 400);

  const details = await request(`/jobs/${newestId}`);
  assert.equal(details.response.status, 200);
  assert.equal(details.data.job.company.name, 'Discovery Company');
  assert.equal(details.data.job.salary.maximum, 180000);
  const closedDetails = await request(`/jobs/${closedId}`);
  assert.equal(closedDetails.response.status, 404);
  const invalidId = await request('/jobs/not-an-object-id');
  assert.equal(invalidId.response.status, 400);

  console.log('Job discovery integration checks passed: published-only search, filters, sorting, pagination bounds, validation, safe public fields, and job details.');
} finally {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  if (connected) {
    await Promise.all([
      Job.deleteMany({ employer: ownerId }),
      Company.deleteOne({ _id: companyId }),
      Skill.deleteOne({ _id: skillId }),
      User.deleteOne({ _id: ownerId }),
    ]);
    await mongoose.disconnect();
  }
  await memoryServer?.stop();
}

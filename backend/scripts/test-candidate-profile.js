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
const { CandidateProfile, Skill, User } = models;
const candidateEmail = `profile-${randomUUID()}@example.test`;
let server;
let candidateId;
let employerId;
let databaseConnected = false;

async function request(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method,
    headers: {
      origin: 'http://localhost:5173',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await response.json() };
}

async function removeCandidate() {
  if (!candidateId) return;
  await Promise.all([
    CandidateProfile.deleteMany({ user: candidateId }),
    User.deleteOne({ _id: candidateId }),
  ]);
}

try {
  await connectDatabase(testUri);
  databaseConnected = true;
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const registration = await request('/auth/candidate/register', {
    method: 'POST',
    body: {
      email: candidateEmail,
      password: 'Candidate-profile-test-42',
      firstName: 'Morgan',
      lastName: 'Graduate',
    },
  });
  assert.equal(registration.response.status, 201, 'candidate signup creates the profile');
  candidateId = new mongoose.Types.ObjectId(registration.data.user.id);
  const cookie = registration.response.headers.get('set-cookie').split(';', 1)[0];

  const unauthenticated = await request('/candidate/profile');
  assert.equal(unauthenticated.response.status, 401, 'profile API requires authentication');
  const initial = await request('/candidate/profile', { cookie });
  assert.equal(initial.response.status, 200, 'candidate can load their profile');
  assert.equal(initial.data.profile.completion.percentage, 8, 'initial completion reflects the registered name only');
  assert.equal(initial.data.profile.skills.length, 0);
  assert.equal('passwordHash' in initial.data.profile, false);
  const employer = await request('/auth/employer/register', {
    method: 'POST',
    body: {
      email: `employer-${randomUUID()}@example.test`,
      password: 'Employer-profile-test-42',
      firstName: 'Taylor',
      lastName: 'Recruiter',
      companyName: 'Profile Test Company',
    },
  });
  assert.equal(employer.response.status, 201);
  employerId = new mongoose.Types.ObjectId(employer.data.user.id);
  const claimedIdentity = await request(`/candidate/profile?userId=${employerId}`, { cookie });
  assert.equal(claimedIdentity.response.status, 200);
  assert.equal(claimedIdentity.data.profile.firstName, 'Morgan', 'identity query parameters cannot select another profile');
  const ownershipSpoof = await request('/candidate/profile', {
    method: 'PATCH',
    cookie,
    body: { user: employerId.toString(), firstName: 'Impersonated' },
  });
  assert.equal(ownershipSpoof.response.status, 400, 'profile updates cannot supply ownership fields');
  const employerProfileAccess = await request('/candidate/profile', {
    cookie: employer.response.headers.get('set-cookie').split(';', 1)[0],
  });
  assert.equal(employerProfileAccess.response.status, 403, 'employer cannot access candidate profile API');

  const invalid = await request('/candidate/profile', {
    method: 'PATCH',
    cookie,
    body: { projects: [{ name: 'Invalid project', url: 'javascript:alert(1)' }] },
  });
  assert.equal(invalid.response.status, 400, 'profile validation rejects unsafe URLs');

  const update = await request('/candidate/profile', {
    method: 'PATCH',
    cookie,
    body: {
      firstName: 'Morgan',
      lastName: 'Graduate',
      phone: '+1 555 0100',
      location: { city: 'Seattle', region: 'WA', country: 'United States', countryCode: 'US' },
      headline: 'Graduate software engineer',
      summary: 'Interested in building reliable software products.',
      skills: [
        { name: 'JavaScript', proficiency: 'advanced', yearsExperience: 2 },
        { name: ' javascript ', proficiency: 'intermediate', yearsExperience: 1 },
      ],
      education: [{
        degree: 'Bachelor of Science',
        institution: 'Northwest University',
        fieldOfStudy: 'Computer Science',
        level: 'bachelor',
        startYear: 2021,
        endYear: 2025,
      }],
      experience: [{
        employer: 'Campus Lab',
        title: 'Software Intern',
        startDate: '2024-05-01',
        endDate: '2024-08-31',
        description: 'Built internal web tools.',
        technologies: ['Node.js', 'JavaScript'],
      }],
      projects: [{
        name: 'Portfolio',
        description: 'A personal portfolio site.',
        technologies: ['React', 'JavaScript'],
        url: 'https://example.test/portfolio',
        githubUrl: 'https://github.com/example/portfolio',
      }],
      certifications: [{
        name: 'Cloud Fundamentals',
        issuer: 'Example Academy',
        issuedAt: '2025-02-01',
        credentialUrl: 'https://example.test/certificates/1',
      }],
      preferredRoles: ['Frontend Engineer'],
      preferredLocations: [{ city: 'Seattle', country: 'United States', remoteType: 'hybrid' }],
      preferredEmploymentTypes: ['full-time', 'internship'],
    },
  });
  assert.equal(update.response.status, 200, `valid profile update succeeds: ${JSON.stringify(update.data)}`);
  assert.equal(update.data.profile.completion.percentage, 100, 'all meaningful profile sections produce full completion');
  assert.equal(update.data.profile.skills.length, 1, 'skill normalization deduplicates case and whitespace variants');
  assert.equal(update.data.profile.skills[0].name, 'JavaScript');
  assert.equal(update.data.profile.experience[0].technologies.length, 2);
  assert.equal(update.data.profile.projects[0].githubUrl, 'https://github.com/example/portfolio');
  assert.equal(update.data.profile.preferredLocations[0].remoteType, 'hybrid');

  const loadedAgain = await request('/candidate/profile', { cookie });
  assert.equal(loadedAgain.response.status, 200);
  assert.equal(loadedAgain.data.profile.education[0].institution, 'Northwest University', 'profile persists on subsequent read');

  const removeSkill = await request('/candidate/profile', {
    method: 'PATCH',
    cookie,
    body: { skills: [] },
  });
  assert.equal(removeSkill.response.status, 200, 'skills can be removed');
  assert.equal(removeSkill.data.profile.skills.length, 0);
  assert.equal(removeSkill.data.profile.completion.percentage, 92, 'completion recalculates after removing a populated section');

  console.log('Candidate profile integration checks passed: authentication/ownership, load, update, validation, skill normalization, edit/removal, persistence, and completion.');
} finally {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  if (databaseConnected) {
    await removeCandidate();
    if (employerId) {
      const { Company, EmployerProfile } = models;
      await Promise.all([
        EmployerProfile.deleteMany({ user: employerId }),
        Company.deleteMany({ createdBy: employerId }),
        User.deleteOne({ _id: employerId }),
      ]);
    }
    await mongoose.disconnect();
  }
  await memoryServer?.stop();
}

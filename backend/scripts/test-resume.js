import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import yazl from 'yazl';
import mongoose from 'mongoose';
import { io } from 'socket.io-client';
import {
  extractResumeText,
  RESUME_MIME_TYPES,
} from '../src/services/resume-extraction.service.js';
import { parseResumeText } from '../src/services/resume-parser.service.js';

const resumeLines = [
  'Jordan Example',
  'jordan@example.test',
  '+1 206 555 0182',
  'Skills',
  'JavaScript, Node.js, React, PostgreSQL',
  'Education',
  'Bachelor of Science in Computer Science',
  'Northwest University 2024',
  'Experience',
  'Software Engineer at Example Systems | 2022 - 2024',
  'Projects',
  'Project: Job Insights Dashboard | React, Node.js, JavaScript',
  'Certifications',
  'AWS Certified Developer - Associate, Amazon',
];

function createPdf(lines) {
  const escapePdf = (line) => line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const textCommands = lines.map((line, index) => (
    `${index === 0 ? '50 750 Td' : '0 -18 Td'} (${escapePdf(line)}) Tj`
  )).join('\n');
  const content = `BT /F1 11 Tf\n${textCommands}\nET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function createDocx(lines, extraEntries = []) {
  const zip = new yazl.ZipFile();
  const chunks = [];
  return new Promise((resolve, reject) => {
    zip.outputStream.on('data', (chunk) => chunks.push(chunk));
    zip.outputStream.on('error', reject);
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)));
    zip.addBuffer(Buffer.from(
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>',
    ), '[Content_Types].xml');
    zip.addBuffer(Buffer.from(
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
    ), '_rels/.rels');
    const paragraphs = lines.map((line) => (
      `<w:p><w:r><w:t xml:space="preserve">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`
    )).join('');
    zip.addBuffer(Buffer.from(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body>${paragraphs}<w:sectPr/></w:body></w:document>`,
    ), 'word/document.xml');
    for (const [name, content] of extraEntries) {
      zip.addBuffer(Buffer.from(content), name);
    }
    zip.end();
  });
}

async function assertResumeContent(buffer, mimeType) {
  const text = await extractResumeText(buffer, mimeType);
  const parsed = parseResumeText(text);
  assert.match(text, /Jordan Example/);
  assert.equal(parsed.fields.name.value, 'Jordan Example');
  assert.equal(parsed.fields.email.value, 'jordan@example.test');
  assert.ok(parsed.skills.some(({ name }) => name === 'JavaScript'));
  assert.ok(parsed.education.some(({ value }) => value.level === 'bachelor'));
  assert.ok(parsed.experience.some(({ value }) => value.title === 'Software Engineer'));
  assert.ok(parsed.projects.some(({ value }) => value.name === 'Job Insights Dashboard'));
  assert.ok(parsed.certifications.some(({ value }) => value.name.includes('AWS Certified Developer')));
  assert.equal(parsed.parserVersion, 'rule-based-1.0');
  return parsed;
}

test('extracts text and structured resume fields from PDF', async () => {
  const parsed = await assertResumeContent(createPdf(resumeLines), RESUME_MIME_TYPES.pdf);
  assert.equal(parsed.fields.phone.value, '+1 206 555 0182');
});

test('extracts text and structured resume fields from DOCX', async () => {
  const parsed = await assertResumeContent(await createDocx(resumeLines), RESUME_MIME_TYPES.docx);
  assert.equal(parsed.fields.phone.value, '+1 206 555 0182');
});

test('leaves unclear information explicitly unknown instead of inventing values', () => {
  const parsed = parseResumeText('A short unstructured document with no contact information.');
  assert.equal(parsed.fields.name.status, 'unknown');
  assert.equal(parsed.fields.email.status, 'unknown');
  assert.equal(parsed.fields.phone.status, 'unknown');
  assert.deepEqual(parsed.education, []);
  assert.deepEqual(parsed.experience, []);
});

test('keeps fallback experience extraction below the automatic-merge confidence threshold', () => {
  const parsed = parseResumeText([
    'Experience',
    'Software Engineer | 2021 - 2023',
    'Northwind Systems',
  ].join('\n'));
  assert.equal(parsed.experience.length, 1);
  assert.equal(parsed.experience[0].confidence, 0.68);
  assert.equal(parsed.experience[0].status, 'review');
});

test('rejects content that does not match the declared PDF/DOCX format', async () => {
  await assert.rejects(
    extractResumeText(Buffer.from('not a PDF'), RESUME_MIME_TYPES.pdf),
    { statusCode: 400 },
  );
  await assert.rejects(
    extractResumeText(Buffer.from('not a DOCX'), RESUME_MIME_TYPES.docx),
    { statusCode: 400 },
  );
});

test('rejects macro-enabled DOCX archives', async () => {
  const macroDocument = await createDocx(resumeLines, [['word/vbaProject.bin', 'macro data']]);
  await assert.rejects(
    extractResumeText(macroDocument, RESUME_MIME_TYPES.docx),
    { statusCode: 400 },
  );
});

test('candidate upload endpoint stores private metadata and merges confident extraction', async () => {
  let memoryServer;
  let server;
  let socket;
  let candidateId;
  let otherCandidateId;
  let testModels;
  let databaseConnected = false;

  try {
    let testUri = process.env.MONGODB_TEST_URI;
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
    testModels = models;
    await connectDatabase(testUri);
    databaseConnected = true;
    server = createServer(app);
    const { attachSocketServer } = await import('../src/sockets/index.js');
    attachSocketServer(server);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    async function request(path, { method = 'GET', body, cookie, json = true } = {}) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
        method,
        headers: {
          origin: 'http://localhost:5173',
          ...(json && body ? { 'content-type': 'application/json' } : {}),
          ...(cookie ? { cookie } : {}),
        },
        ...(body ? { body: json ? JSON.stringify(body) : body } : {}),
      });
      return {
        response,
        data: response.status === 204 ? null : await response.json(),
      };
    }

    const email = `resume-${randomUUID()}@example.test`;
    const registration = await request('/auth/candidate/register', {
      method: 'POST',
      body: {
        email,
        password: 'Resume-upload-test-42',
        firstName: 'Maya',
        lastName: 'Candidate',
      },
    });
    assert.equal(registration.response.status, 201);
    candidateId = new mongoose.Types.ObjectId(registration.data.user.id);
    const cookie = registration.response.headers.get('set-cookie').split(';', 1)[0];
    socket = io(`http://127.0.0.1:${server.address().port}`, {
      path: '/api/socket.io',
      transports: ['websocket'],
      extraHeaders: { Cookie: cookie, Origin: 'http://localhost:5173' },
      reconnection: false,
    });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Resume test Socket.IO connection timed out.')), 10000);
      socket.once('connect', () => { clearTimeout(timeout); resolve(); });
      socket.once('connect_error', (error) => { clearTimeout(timeout); reject(error); });
    });

    const document = await createDocx(resumeLines);
    const recommendationsUpdated = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Resume upload did not emit a recommendation update.')), 10000);
      socket.once('recommendations:updated', (event) => {
        clearTimeout(timeout);
        resolve(event);
      });
    });
    const form = new FormData();
    form.append(
      'resume',
      new Blob([document], { type: RESUME_MIME_TYPES.docx }),
      'C:\\private\\resume-upload-test.docx',
    );
    const uploaded = await request('/candidate/profile/resume', {
      method: 'POST',
      cookie,
      body: form,
      json: false,
    });
    assert.equal(uploaded.response.status, 200, `resume upload succeeds: ${JSON.stringify(uploaded.data)}`);
    const resumeEvent = await recommendationsUpdated;
    assert.equal(resumeEvent.trigger, 'resume');
    assert.ok(Array.isArray(resumeEvent.recommendations));
    assert.equal(uploaded.data.resume.status, 'processed');
    assert.equal(uploaded.data.resume.originalName, 'resume-upload-test.docx');
    assert.equal('storageKey' in uploaded.data.resume, false, 'private storage keys are not returned');
    assert.equal(uploaded.data.parsed.fields.email.value, 'jordan@example.test');
    assert.equal(uploaded.data.profile.firstName, 'Maya', 'an existing candidate name is never overwritten');
    assert.equal(uploaded.data.profile.phone, '+1 206 555 0182', 'confident missing profile fields are filled');
    assert.ok(uploaded.data.profile.skills.some((skill) => skill.name === 'JavaScript'));
    assert.equal(uploaded.data.profile.education.length, 1);
    assert.equal(uploaded.data.profile.experience.length, 1);
    assert.equal(uploaded.data.profile.projects.length, 1);
    assert.equal(uploaded.data.profile.certifications.length, 1);
    assert.equal(uploaded.data.profile.resume, uploaded.data.resume.id);
    assert.equal(uploaded.data.parsed.fields.name.confidence, 0.86);
    assert.ok(uploaded.data.resume.extractedSkills.some(
      ({ name, confidence }) => name === 'JavaScript' && confidence === 0.92,
    ));
    const candidateProfile = await models.CandidateProfile.findOne({ user: candidateId });
    const application = await models.Application.create({
      candidate: candidateProfile._id,
      job: new mongoose.Types.ObjectId(),
      resume: uploaded.data.resume.id,
      statusHistory: [{ status: 'submitted', changedBy: candidateId }],
    });
    const submittedResume = await fetch(
      `http://127.0.0.1:${server.address().port}/api/candidate/applications/${application.id}/resume`,
      { headers: { origin: 'http://localhost:5173', cookie } },
    );
    assert.equal(submittedResume.status, 200, 'a candidate can download the resume snapshot attached to their own application');
    assert.equal(Buffer.from(await submittedResume.arrayBuffer()).toString('utf8').slice(0, 2), 'PK', 'the application resume is streamed as the original DOCX file');

    const current = await request('/candidate/profile/resume', { cookie });
    assert.equal(current.response.status, 200);
    assert.equal(current.data.resume.id, uploaded.data.resume.id);
    assert.equal('storageKey' in current.data.resume, false);
    const unauthenticated = await request('/candidate/profile/resume');
    assert.equal(unauthenticated.response.status, 401);
    const otherRegistration = await request('/auth/candidate/register', {
      method: 'POST',
      body: {
        email: `resume-other-${randomUUID()}@example.test`,
        password: 'Other-resume-test-42',
        firstName: 'Other',
        lastName: 'Candidate',
      },
    });
    assert.equal(otherRegistration.response.status, 201);
    otherCandidateId = new mongoose.Types.ObjectId(otherRegistration.data.user.id);
    const otherResume = await request('/candidate/profile/resume', {
      cookie: otherRegistration.response.headers.get('set-cookie').split(';', 1)[0],
    });
    assert.equal(otherResume.response.status, 200);
    assert.equal(otherResume.data.resume, null, 'a candidate cannot read another candidate’s resume metadata');
    const otherApplicationResume = await fetch(
      `http://127.0.0.1:${server.address().port}/api/candidate/applications/${application.id}/resume`,
      {
        headers: {
          origin: 'http://localhost:5173',
          cookie: otherRegistration.response.headers.get('set-cookie').split(';', 1)[0],
        },
      },
    );
    assert.equal(otherApplicationResume.status, 404, 'another candidate cannot download an application resume');

    const replacementLines = resumeLines.map((line) => (
      line === '+1 206 555 0182' ? '+1 425 555 0198' : line
    ));
    const replacementForm = new FormData();
    replacementForm.append(
      'resume',
      new Blob([createPdf(replacementLines)], { type: RESUME_MIME_TYPES.pdf }),
      'replacement.pdf',
    );
    const replacement = await request('/candidate/profile/resume', {
      method: 'POST',
      cookie,
      body: replacementForm,
      json: false,
    });
    assert.equal(replacement.response.status, 200);
    assert.notEqual(replacement.data.resume.id, uploaded.data.resume.id);
    assert.equal(replacement.data.profile.phone, '+1 206 555 0182', 'new extraction never overwrites a populated profile field');
    assert.equal(replacement.data.profile.firstName, 'Maya');

    const invalid = new FormData();
    invalid.append('resume', new Blob(['not a document'], { type: 'application/pdf' }), 'bad.pdf');
    const rejected = await request('/candidate/profile/resume', {
      method: 'POST',
      cookie,
      body: invalid,
      json: false,
    });
    assert.equal(rejected.response.status, 400, 'file signature validation rejects mislabeled files');

    const oversized = new FormData();
    oversized.append(
      'resume',
      new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: RESUME_MIME_TYPES.pdf }),
      'oversized.pdf',
    );
    const sizeRejected = await request('/candidate/profile/resume', {
      method: 'POST',
      cookie,
      body: oversized,
      json: false,
    });
    assert.equal(sizeRejected.response.status, 413, 'resume uploads over 5 MB are rejected explicitly');

    const records = await models.Resume.find({ candidate: candidateProfile._id });
    assert.equal(records.length, 2, 'rejected content is removed from persistent resume storage');
    assert.equal(records.filter(({ isPrimary }) => isPrimary).length, 1);
    const processedRecord = records.find(({ status }) => status === 'processed');
    assert.equal(processedRecord.sha256.length, 64);
    const publicFileAttempt = await fetch(
      `http://127.0.0.1:${server.address().port}/uploads/resumes/${processedRecord.storageKey}`,
    );
    assert.equal(publicFileAttempt.status, 404, 'resume files are not served from public static paths');
    console.log('Resume API integration check passed: authenticated upload, profile merge/preservation, metadata privacy, current resume lookup, and invalid-file rejection.');
  } finally {
    socket?.disconnect();
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    if (databaseConnected) {
      if (candidateId) {
        const profile = await testModels.CandidateProfile.findOne({ user: candidateId });
        const records = profile
          ? await testModels.Resume.find({ candidate: profile._id })
          : [];
        for (const record of records) {
          const storagePath = join(
            dirname(fileURLToPath(import.meta.url)),
            '..',
            'private-uploads',
            'resumes',
            record.storageKey,
          );
          await unlink(storagePath).catch((error) => {
            if (error.code !== 'ENOENT') throw error;
          });
        }
        await Promise.all([
          testModels.Resume.deleteMany({ user: candidateId }),
          testModels.CandidateProfile.deleteMany({ user: candidateId }),
          testModels.User.deleteOne({ _id: candidateId }),
        ]);
      }
      if (otherCandidateId) {
        await Promise.all([
          testModels.Resume.deleteMany({ user: otherCandidateId }),
          testModels.CandidateProfile.deleteMany({ user: otherCandidateId }),
          testModels.User.deleteOne({ _id: otherCandidateId }),
        ]);
      }
      await mongoose.disconnect();
    }
    await memoryServer?.stop();
  }
});

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const suites = [
  ['Matching algorithm', ['--test', 'test-job-matching.js']],
  ['Resume parsing and private upload', ['--test', 'test-resume.js']],
  ['Authentication and role authorization', ['test-auth.js']],
  ['Candidate profile privacy and validation', ['test-candidate-profile.js']],
  ['Employer jobs and ownership authorization', ['test-employer.js']],
  ['Public job discovery and injection safety', ['test-job-discovery.js']],
  ['Recipient-scoped realtime notifications', ['--test', 'test-notifications.js']],
  ['Recommendations, applications, and user-scoped realtime events', ['test-recommendations.js']],
  ['Isolated database connectivity', ['test-database.js']],
];

let failed = 0;
for (const [name, args] of suites) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(process.execPath, [...args.map((arg, index) => (
    index === args.length - 1 ? resolve(scriptsDirectory, arg) : arg
  ))], { stdio: 'inherit', env: process.env });
  if (result.error) {
    console.error(`${name} could not start: ${result.error.message}`);
    failed += 1;
  } else if (result.status !== 0) {
    console.error(`${name} failed with exit code ${result.status ?? 'unknown'}.`);
    failed += 1;
  } else {
    console.log(`${name}: PASS`);
  }
}

console.log(`\n${suites.length - failed}/${suites.length} suites passed.`);
if (failed) process.exitCode = 1;

import { JobProvider } from '../src/providers/job-provider.js';

const HIMALAYAS_API_URL = 'https://himalayas.app/jobs/api';

try {
  const response = await fetch(`${HIMALAYAS_API_URL}?limit=1`);

  if (!response.ok) {
    throw new Error(
      `Himalayas API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.jobs) || data.jobs.length === 0) {
    throw new Error('No jobs returned by Himalayas API.');
  }

  console.log('Raw Himalayas job:');
  console.log(JSON.stringify(data.jobs[0], null, 2));
} catch (error) {
  console.error('Raw Himalayas inspection: FAILED');
  console.error(error.message);
  process.exitCode = 1;
}
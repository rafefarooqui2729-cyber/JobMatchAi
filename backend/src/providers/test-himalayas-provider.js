import { himalayasProvider } from '../src/providers/himalayas.provider.js';

try {
  const result = await himalayasProvider.fetchJobs({
    limit: 5,
  });

  console.log('Himalayas API connection: PASS');
  console.log(`Jobs received: ${result.jobs.length}`);
  console.log(`Total jobs: ${result.totalCount}`);
  console.log(`Next cursor: ${result.nextCursor ?? 'none'}`);

  if (result.jobs.length > 0) {
    const firstJob = result.jobs[0];

    console.log('\nFirst job:');
    console.log(`Title: ${firstJob.title}`);
    console.log(`Company: ${firstJob.companyName}`);
    console.log(`Employment: ${firstJob.employmentType}`);
    console.log(`Job ID: ${firstJob.guid}`);
    console.log(`Apply URL: ${firstJob.applicationLink}`);
  }
} catch (error) {
  console.error('Himalayas API connection: FAILED');
  console.error(error.message);
  process.exitCode = 1;
}
import { himalayasProvider } from '../src/providers/himalayas.provider.js';

try {
  const result = await himalayasProvider.fetchJobs({
    limit: 5,
  });

  console.log('Himalayas normalization: PASS');
  console.log(`Jobs normalized: ${result.jobs.length}`);

  if (result.jobs.length > 0) {
    console.log('\nNormalized first job:');
    console.log(
      JSON.stringify(result.jobs[0], null, 2),
    );
  }
} catch (error) {
  console.error('Himalayas normalization: FAILED');
  console.error(error.message);
  process.exitCode = 1;
}
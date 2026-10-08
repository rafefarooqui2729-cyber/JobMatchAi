import { JobProvider } from './job-provider.js';
import { himalayasProvider } from './himalayas.provider.js';

class ExternalJobProvider extends JobProvider {
  constructor() {
    super('external');
  }

  async fetchJobs() {
    throw new Error(
      'No default external job provider has been configured.',
    );
  }
}

export const externalJobProvider = new ExternalJobProvider();

export {
  himalayasProvider,
};
/**
 * Base interface for external job providers.
 *
 * Every external job provider should implement:
 *
 *   fetchJobs(options)
 *
 * The provider should return normalized job data.
 */

export class JobProvider {
  constructor(name) {
    this.name = name;
  }

  async fetchJobs() {
    throw new Error(
      `${this.name} provider must implement fetchJobs().`,
    );
  }
}
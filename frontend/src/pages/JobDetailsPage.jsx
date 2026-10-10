
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../api/client.js';
import {
  Avatar,
  Badge,
  Card,
  ErrorState,
  LoadingSkeleton,
  Navbar,
  SkillChip,
} from '../components/ui/index.js';

function salaryLabel(salary) {
  if (
    !salary
    || salary.isDisclosed === false
    || (
      salary.minimum == null
      && salary.maximum == null
    )
  ) {
    return 'Salary not disclosed';
  }

  const format = (value) => (
    value == null
      ? ''
      : new Intl.NumberFormat(
        undefined,
        { maximumFractionDigits: 0 },
      ).format(value)
  );

  const range =
    salary.minimum != null && salary.maximum != null
      ? `${format(salary.minimum)}–${format(salary.maximum)}`
      : salary.minimum != null
        ? `From ${format(salary.minimum)}`
        : `Up to ${format(salary.maximum)}`;

  return `${
    salary.currency ? `${salary.currency} ` : ''
  }${range}${
    salary.period ? ` / ${salary.period}` : ''
  }`;
}

function placeLabel(location = {}) {
  const place = [
    location.city,
    location.region,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  const mode =
    location.remoteType && location.remoteType !== 'onsite'
      ? ` · ${location.remoteType}`
      : '';

  return `${
    place || (
      location.remoteType === 'remote'
        ? 'Remote'
        : 'Location not specified'
    )
  }${mode}`;
}

function SkillSection({ title, skills }) {
  if (!skills?.length) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
        {title}
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <SkillChip key={skill}>
            {skill}
          </SkillChip>
        ))}
      </div>
    </section>
  );
}

function InfoItem({ icon, label, value, accent = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-300"
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p
          className={`mt-0.5 truncate text-sm font-medium ${
            accent ? 'text-cyan-100' : 'text-slate-300'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function JobDetailsPage() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setError('A valid job ID was not provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.get(
        `/jobs/${encodeURIComponent(jobId)}`,
      );

      if (!data?.job) {
        setJob(null);
        setError('Job details were not found.');
        return;
      }

      setJob(data.job);
    } catch (requestError) {
      setJob(null);
      setError(
        requestError.response?.data?.error?.message
          || 'This job could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const isExternal = Boolean(
    job?.isExternal || job?.source === 'external',
  );

  const companyName =
    job?.company?.name
    || job?.companyName
    || 'Company';

  // Support both logo fields used by the job data.
  const companyLogo =
    job?.company?.logoUrl
    || job?.companyLogo
    || '';

  const providerName = job?.provider
    ? job.provider.charAt(0).toUpperCase()
      + job.provider.slice(1)
    : 'External source';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[8%] top-24 -z-0 h-72 w-72 rounded-full bg-cyan-500/[0.07] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-10 right-[5%] -z-0 h-80 w-80 rounded-full bg-blue-600/[0.06] blur-3xl"
      />

      <Navbar
        actions={(
          <Link
            to="/jobs"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:border-cyan-300/20 hover:bg-white/[0.07] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Search jobs
          </Link>
        )}
      />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-7 sm:px-8 sm:py-10">
        <Link
          to="/jobs"
          className="mb-5 inline-flex min-h-9 items-center rounded-lg px-2 py-1 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          ← Back to job search
        </Link>

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton
              className="h-52 border border-white/10 bg-white/[0.035]"
              rounded="rounded-2xl"
            />

            <LoadingSkeleton
              className="h-96 border border-white/10 bg-white/[0.035]"
              rounded="rounded-2xl"
            />
          </div>
        ) : error ? (
          <ErrorState
            title="Job unavailable"
            description={error}
            onRetry={loadJob}
          />
        ) : job ? (
          <div className="space-y-5">
            {/* Job Header */}
            <Card className="relative overflow-hidden p-5 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-3xl"
              />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                <Avatar
                  name={companyName}
                  src={companyLogo}
                  size="xl"
                  className="rounded-2xl border border-white/10 shadow-xl shadow-black/20"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-400">
                      {companyName}
                    </p>

                    {isExternal && (
                      <Badge tone="info">
                        External · {providerName}
                      </Badge>
                    )}
                  </div>

                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {job.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.employmentType && (
                      <Badge tone="dark">
                        {job.employmentType.replace('-', ' ')}
                      </Badge>
                    )}

                    {job.location?.remoteType && (
                      <Badge>
                        {job.location.remoteType}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <InfoItem
                      icon="⌖"
                      label="Location"
                      value={placeLabel(job.location)}
                    />

                    <InfoItem
                      icon="₹"
                      label="Salary"
                      value={salaryLabel(job.salary)}
                      accent
                    />

                    <InfoItem
                      icon="◷"
                      label="Experience"
                      value={`${job.minimumExperience ?? 0}${
                        job.maximumExperience != null
                          ? `–${job.maximumExperience}`
                          : '+'
                      } years`}
                    />
                  </div>

                  {job.publishedAt && (
                    <p className="mt-4 text-xs text-slate-500">
                      Posted{' '}
                      {new Date(job.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* External job panel */}
              {isExternal && (
                <div className="relative mt-7 overflow-hidden rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] px-4 py-4 backdrop-blur-xl">
                  <div
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-300 to-blue-500"
                  />

                  <div className="pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-400/[0.08] text-cyan-300">
                        ↗
                      </span>

                      <p className="text-sm font-semibold text-cyan-100">
                        External job listing
                      </p>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      This position is hosted on{' '}
                      <span className="font-medium text-cyan-100">
                        {providerName}
                      </span>
                      . Applications are completed on the original job platform.
                    </p>

                    {job.externalApplyUrl && (
                      <a
                        href={job.externalApplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 px-4 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-950/10 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:from-cyan-400/20 hover:to-blue-500/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/20"
                      >
                        Apply on {providerName}
                        <span className="ml-1.5" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Job Content */}
            <Card className="relative overflow-hidden p-5 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/[0.04] blur-3xl"
              />

              <div className="relative space-y-8">
                <SkillSection
                  title="Required skills"
                  skills={job.requiredSkills}
                />

                <SkillSection
                  title="Preferred skills"
                  skills={job.preferredSkills}
                />

                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                    About the role
                  </h2>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md sm:p-5">
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                      {job.description || 'No job description is available.'}
                    </p>
                  </div>
                </section>

                {job.responsibilities?.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                      Responsibilities
                    </h2>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md sm:p-5">
                      <ul className="space-y-3 text-sm leading-6 text-slate-300">
                        {job.responsibilities.map((item, index) => (
                          <li
                            key={`${index}-${item}`}
                            className="flex gap-3"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.5)]"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {job.educationRequirements?.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                      Education
                    </h2>

                    <div className="mt-3 space-y-2">
                      {job.educationRequirements.map((item, index) => (
                        <div
                          key={`${index}-${item.minimumLevel}`}
                          className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 backdrop-blur-md"
                        >
                          <p className="text-sm font-medium capitalize text-slate-200">
                            {item.minimumLevel?.replace('-', ' ')}

                            {item.isRequired && (
                              <span className="ml-2 text-xs font-medium text-cyan-300">
                                Required
                              </span>
                            )}
                          </p>

                          {item.fieldsOfStudy?.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.fieldsOfStudy.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {job.company?.description && (
                  <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                      About {companyName}
                    </h2>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md sm:p-5">
                      <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                        {job.company.description}
                      </p>

                      {job.company.website && (
                        <a
                          href={job.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center rounded-lg px-2 py-1 text-sm font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        >
                          Visit company website
                          <span className="ml-1" aria-hidden="true">
                            ↗
                          </span>
                        </a>
                      )}
                    </div>
                  </section>
                )}

                {job.applicationDeadline && (
                  <div className="border-t border-white/10 pt-5">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/15 bg-amber-400/[0.06] text-amber-300"
                      >
                        !
                      </span>

                      <p className="text-sm text-slate-400">
                        Application deadline:{' '}
                        <span className="font-medium text-slate-200">
                          {new Date(
                            job.applicationDeadline,
                          ).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}

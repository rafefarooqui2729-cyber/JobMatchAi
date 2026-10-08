import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingSkeleton,
  Navbar,
  PageHeader,
  Select,
} from '../components/ui/index.js';
import { useToast } from '../components/ui/Toast.jsx';

const applicationStatuses = [
  'submitted',
  'under-review',
  'shortlisted',
  'rejected',
  'hired',
];

function GlassBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="absolute left-[-10rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/[0.055] blur-3xl" />
      <div className="absolute right-[-12rem] top-[18%] h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.045] blur-3xl" />
      <div className="absolute bottom-[-14rem] left-[35%] h-[28rem] w-[28rem] rounded-full bg-cyan-300/[0.025] blur-3xl" />
    </div>
  );
}

function GlassSection({
  children,
  className = '',
  interactive = false,
}) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl',
        'border border-white/[0.09]',
        'bg-white/[0.045]',
        'backdrop-blur-2xl',
        'shadow-[0_18px_60px_rgba(0,0,0,0.20)]',
        interactive
          ? 'transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.065]'
          : '',
        className,
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-400/[0.025] blur-3xl"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function GlassActionLink({
  children,
  to,
  variant = 'secondary',
  className = '',
}) {
  const variants = {
    primary:
      'border-cyan-300/20 bg-gradient-to-r from-cyan-400/[0.16] to-blue-500/[0.12] text-cyan-100 hover:border-cyan-300/35 hover:bg-cyan-300/[0.14] hover:text-white',
    secondary:
      'border-white/[0.11] bg-white/[0.055] text-slate-200 hover:border-white/[0.20] hover:bg-white/[0.085] hover:text-white',
  };

  return (
    <Link
      to={to}
      className={[
        'inline-flex min-h-9 items-center justify-center rounded-xl border px-3.5',
        'text-xs font-semibold backdrop-blur-xl',
        'transition-all duration-200',
        'hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15',
        variants[variant] || variants.secondary,
        className,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function GlassMeta({ children, accent = false }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-lg border px-2.5 py-1.5',
        'text-xs backdrop-blur-xl',
        accent
          ? 'border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200'
          : 'border-white/[0.08] bg-white/[0.035] text-slate-400',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function EmployerNav() {
  return (
    <Navbar
      brandHref="/employer/dashboard"
      mobileMenuItems={[
        { label: 'Jobs', to: '/employer/dashboard' },
        { label: 'Company profile', to: '/employer/company' },
      ]}
      actions={
        <Link
          className="hidden rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-sm font-semibold text-slate-200 backdrop-blur-xl transition-all hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white sm:block"
          to="/employer/dashboard"
        >
          Jobs
        </Link>
      }
    />
  );
}

function AdminNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);

    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      toast(
        'Unable to sign out right now. Please try again.',
        { tone: 'error' },
      );
      setSigningOut(false);
    }
  }

  return (
    <Navbar
      brandHref="/admin/dashboard"
      mobileMenuItems={[
        { label: 'Overview', to: '/admin/dashboard' },
        { label: 'Notifications', to: '/admin/notifications' },
      ]}
      actions={
        <>
          <Link
            className="hidden rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-sm font-semibold text-slate-200 backdrop-blur-xl transition-all hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white sm:block"
            to="/admin/notifications"
          >
            Notifications
          </Link>

          <span className="hidden rounded-xl border border-cyan-300/10 bg-cyan-300/[0.045] px-3 py-2 text-sm font-semibold text-cyan-200/80 backdrop-blur-xl sm:block">
            Administration
          </span>

          <Button
            variant="ghost"
            size="sm"
            loading={signingOut}
            onClick={signOut}
          >
            Sign out
          </Button>
        </>
      }
    />
  );
}

function statusTone(status) {
  if (
    status === 'shortlisted' ||
    status === 'hired' ||
    status === 'active' ||
    status === 'published'
  ) {
    return 'success';
  }

  if (
    status === 'rejected' ||
    status === 'suspended' ||
    status === 'closed'
  ) {
    return 'neutral';
  }

  if (
    status === 'under-review' ||
    status === 'paused'
  ) {
    return 'warning';
  }

  return 'navy';
}

/* =========================================================
   EMPLOYER APPLICANTS
========================================================= */

export function EmployerApplicantsPage() {
  const { jobId } = useParams();

  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get(
        `/employer/jobs/${jobId}/applications`,
        {
          params: filter ? { status: filter } : {},
        },
      );

      setData(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          'Applicants could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [filter, jobId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(application, status) {
    setUpdatingId(application.id);

    try {
      await apiClient.patch(
        `/employer/applications/${application.id}/status`,
        { status },
      );

      toast(
        'Application status updated.',
        { tone: 'success' },
      );

      await load();
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message ||
          'Application status could not be updated.',
        { tone: 'error' },
      );
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <GlassBackground />

      <EmployerNav />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Hiring workspace"
          title={data?.job.title || 'Applicants'}
          description={
            data
              ? `${data.job.company} · Review applicants and update their application status.`
              : 'Review candidates for this opening.'
          }
          actions={
            <GlassActionLink to="/employer/dashboard">
              ← Back to jobs
            </GlassActionLink>
          }
        />

        {loading ? (
          <div
            className="mt-7 space-y-4"
            aria-label="Loading applicants"
          >
            <LoadingSkeleton
              className="h-16"
              rounded="rounded-2xl"
            />

            <LoadingSkeleton
              className="h-32"
              rounded="rounded-2xl"
            />

            <LoadingSkeleton
              className="h-32"
              rounded="rounded-2xl"
            />
          </div>
        ) : error ? (
          <GlassSection className="mt-7">
            <ErrorState
              title="Applicants unavailable"
              description={error}
              onRetry={load}
            />
          </GlassSection>
        ) : (
          <>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <GlassMeta accent>
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                {data.pagination.total} applicant
                {data.pagination.total === 1 ? '' : 's'}
              </GlassMeta>

              <div className="w-full sm:w-60">
                <Select
                  label="Filter by status"
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                  options={[
                    {
                      value: '',
                      label: 'All statuses',
                    },
                    ...[
                      ...applicationStatuses,
                      'withdrawn',
                    ].map((value) => ({
                      value,
                      label: value.replace('-', ' '),
                    })),
                  ]}
                />
              </div>
            </div>

            {data.applicants.length === 0 ? (
              <GlassSection className="mt-5 p-6 sm:p-8">
                <EmptyState
                  title="No applicants found"
                  description={
                    filter
                      ? 'Try another status filter or view all applicants.'
                      : 'Applications for this role will appear here.'
                  }
                />
              </GlassSection>
            ) : (
              <section
                className="mt-5 space-y-4"
                aria-label="Applicants"
              >
                {data.applicants.map((application) => {
                  const profilePrivate =
                    application.candidate.profileVisible === false;

                  return (
                    <GlassSection
                      key={application.id}
                      interactive
                      className="p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold tracking-tight text-white">
                              {profilePrivate
                                ? 'Profile private'
                                : `${application.candidate.firstName} ${application.candidate.lastName}`}
                            </h2>

                            <Badge
                              tone={statusTone(
                                application.status,
                              )}
                              dot
                            >
                              {application.status.replace(
                                '-',
                                ' ',
                              )}
                            </Badge>

                            {application.matchScore != null && (
                              <Badge tone="navy">
                                {application.matchScore}% match
                              </Badge>
                            )}
                          </div>

                          {profilePrivate ? (
                            <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                              <p className="text-sm leading-6 text-slate-400">
                                This candidate’s profile is not
                                visible to employers. Only
                                application status information
                                is available.
                              </p>
                            </div>
                          ) : (
                            <>
                              {application.candidate.headline && (
                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                  {application.candidate.headline}
                                </p>
                              )}

                              {application.candidate.location && (
                                <p className="mt-2 text-xs text-slate-500">
                                  {[
                                    application.candidate
                                      .location.city,
                                    application.candidate
                                      .location.region,
                                    application.candidate
                                      .location.country,
                                  ]
                                    .filter(Boolean)
                                    .join(', ')}
                                </p>
                              )}

                              {!!application.candidate.skills
                                ?.length && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {application.candidate.skills
                                    .slice(0, 8)
                                    .map((skill) => (
                                      <span
                                        key={skill}
                                        className="rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[11px] font-medium text-slate-400"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </>
                          )}

                          <div className="mt-3">
                            <GlassMeta>
                              Applied{' '}
                              {new Date(
                                application.createdAt,
                              ).toLocaleDateString()}
                            </GlassMeta>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {application.hasResume && (
                            <a
                              className="inline-flex min-h-9 items-center rounded-xl border border-white/[0.10] bg-white/[0.045] px-3 text-xs font-semibold text-slate-300 backdrop-blur-xl transition-all hover:border-cyan-300/20 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
                              href={`/api/employer/applications/${application.id}/resume`}
                            >
                              Resume
                            </a>
                          )}

                          <Select
                            aria-label={`Update status for ${
                              application.candidate.firstName ||
                              'applicant'
                            }`}
                            value={application.status}
                            onChange={(event) =>
                              updateStatus(
                                application,
                                event.target.value,
                              )
                            }
                            disabled={
                              updatingId === application.id ||
                              application.status === 'withdrawn'
                            }
                            options={(
                              application.status === 'withdrawn'
                                ? [
                                    'withdrawn',
                                    ...applicationStatuses,
                                  ]
                                : applicationStatuses
                            ).map((value) => ({
                              value,
                              label: value.replace('-', ' '),
                            }))}
                          />

                          <GlassActionLink
                            to={`/employer/applications/${application.id}`}
                          >
                            Details
                          </GlassActionLink>
                        </div>
                      </div>

                      {application.match?.explanation && (
                        <div className="mt-5 rounded-xl border border-cyan-300/[0.08] bg-cyan-300/[0.035] p-3">
                          <p className="text-xs leading-5 text-slate-400">
                            <span className="font-semibold text-cyan-200/80">
                              Match insight:
                            </span>{' '}
                            {application.match.explanation}
                          </p>
                        </div>
                      )}
                    </GlassSection>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   EMPLOYER APPLICATION DETAILS
========================================================= */

export function EmployerApplicationDetailsPage() {
  const { applicationId } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get(
        `/employer/applications/${applicationId}`,
      );

      setApplication(response.data.application);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          'Application could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <GlassBackground />

      <EmployerNav />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Hiring workspace"
          title="Application details"
          description="Review the candidate’s application status and available profile information."
        />

        {loading ? (
          <div className="mt-7">
            <LoadingSkeleton
              className="h-80"
              rounded="rounded-2xl"
            />
          </div>
        ) : error ? (
          <GlassSection className="mt-7">
            <ErrorState
              title="Application unavailable"
              description={error}
              onRetry={load}
            />
          </GlassSection>
        ) : (
          application && (
            <GlassSection className="mt-7 p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cyan-200/70">
                    {application.job.title}
                  </p>

                  <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {application.candidate.profileVisible ===
                    false
                      ? 'Profile private'
                      : `${application.candidate.firstName} ${application.candidate.lastName}`}
                  </h2>

                  {application.candidate.headline && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {application.candidate.headline}
                    </p>
                  )}
                </div>

                <Badge
                  tone={statusTone(application.status)}
                  dot
                >
                  {application.status.replace('-', ' ')}
                </Badge>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Applied
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {new Date(
                      application.createdAt,
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-300/[0.10] bg-cyan-300/[0.035] p-4 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/60">
                    Match score
                  </p>

                  <div className="mt-1 flex items-baseline gap-1">
                    <p className="text-3xl font-semibold tracking-tight text-white">
                      {application.matchScore}
                    </p>

                    <span className="text-sm font-semibold text-cyan-300">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {application.hasResume && (
                <a
                  className="mt-6 inline-flex min-h-10 items-center rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/[0.15] to-blue-500/[0.10] px-4 text-sm font-semibold text-cyan-100 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-cyan-300/[0.16] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
                  href={`/api/employer/applications/${application.id}/resume`}
                >
                  Download applicant resume
                </a>
              )}

              <div className="mt-7 border-t border-white/[0.08] pt-5">
                <Link
                  className="inline-flex rounded-lg px-2 py-1 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.045] hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
                  to="/employer/dashboard"
                >
                  ← Back to jobs
                </Link>
              </div>
            </GlassSection>
          )
        )}
      </main>
    </div>
  );
}

/* =========================================================
   ADMIN
========================================================= */

function Metric({ label, value }) {
  return (
    <GlassSection className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {value ?? '—'}
      </p>

      <div className="mt-4 h-px bg-gradient-to-r from-cyan-300/20 via-white/[0.06] to-transparent" />
    </GlassSection>
  );
}

export function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        overviewResponse,
        usersResponse,
        jobsResponse,
      ] = await Promise.all([
        apiClient.get('/admin/overview'),
        apiClient.get('/admin/users', {
          params: {
            limit: 10,
            q: query || undefined,
          },
        }),
        apiClient.get('/admin/jobs', {
          params: {
            limit: 10,
          },
        }),
      ]);

      setOverview(overviewResponse.data);
      setUsers(usersResponse.data.users);
      setJobs(jobsResponse.data.jobs);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          'Administration tools could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function setUserStatus(user, status) {
    setWorkingId(user._id);

    try {
      await apiClient.patch(
        `/admin/users/${user._id}/status`,
        { status },
      );

      toast(
        `Account ${status}.`,
        { tone: 'success' },
      );

      await load();
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message ||
          'Account status could not be updated.',
        { tone: 'error' },
      );
    } finally {
      setWorkingId('');
    }
  }

  async function moderateJob(job, status) {
    setWorkingId(job.id);

    try {
      await apiClient.patch(
        `/admin/jobs/${job.id}/moderate`,
        { status },
      );

      toast(
        `Job ${status}.`,
        { tone: 'success' },
      );

      await load();
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message ||
          'Job moderation could not be updated.',
        { tone: 'error' },
      );
    } finally {
      setWorkingId('');
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <GlassBackground />

      <AdminNav />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Platform administration"
          title="Operations overview"
          description="Review live platform activity and manage accounts and job listings."
        />

        {loading ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingSkeleton
                key={index}
                className="h-28"
                rounded="rounded-2xl"
              />
            ))}
          </div>
        ) : error ? (
          <GlassSection className="mt-7">
            <ErrorState
              title="Administration unavailable"
              description={error}
              onRetry={load}
            />
          </GlassSection>
        ) : (
          overview && (
            <>
              <section
                className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
                aria-label="Platform totals"
              >
                <Metric
                  label="Candidates"
                  value={overview.counts.candidates}
                />

                <Metric
                  label="Employers"
                  value={overview.counts.employers}
                />

                <Metric
                  label="All jobs"
                  value={overview.counts.jobs}
                />

                <Metric
                  label="Active jobs"
                  value={overview.counts.activeJobs}
                />

                <Metric
                  label="Applications"
                  value={overview.counts.applications}
                />
              </section>

              {/* User accounts */}
              <GlassSection className="mt-7">
                <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white">
                        User accounts
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Search by account email; administrator
                        accounts are protected from status changes.
                      </p>
                    </div>

                    <GlassMeta accent>
                      {users.length} shown
                    </GlassMeta>
                  </div>
                </div>

                <div className="border-b border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">
                  <Input
                    label="Search email"
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    placeholder="name@example.com"
                  />
                </div>

                <div className="divide-y divide-white/[0.07]">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-semibold text-white">
                          {user.email}
                        </p>

                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {user.role} · joined{' '}
                          {new Date(
                            user.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={statusTone(user.status)}
                          dot
                        >
                          {user.status}
                        </Badge>

                        {user.role !== 'admin' && (
                          <Button
                            variant={
                              user.status === 'active'
                                ? 'secondary'
                                : 'subtle'
                            }
                            size="sm"
                            loading={workingId === user._id}
                            onClick={() =>
                              setUserStatus(
                                user,
                                user.status === 'active'
                                  ? 'suspended'
                                  : 'active',
                              )
                            }
                          >
                            {user.status === 'active'
                              ? 'Suspend'
                              : 'Reactivate'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <div className="p-5">
                      <EmptyState
                        title="No accounts found"
                        description="Try a different email search."
                      />
                    </div>
                  )}
                </div>
              </GlassSection>

              {/* Job moderation */}
              <GlassSection className="mt-6">
                <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white">
                        Job moderation
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Pause or close listings that require
                        intervention.
                      </p>
                    </div>

                    <GlassMeta>
                      {jobs.length} listings
                    </GlassMeta>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.07]">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">
                            {job.title}
                          </p>

                          {job.status === 'published' && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.75)]" />
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {job.company} ·{' '}
                          {job.employerEmail ||
                            'Employer unavailable'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={statusTone(job.status)}
                          dot
                        >
                          {job.status}
                        </Badge>

                        {job.status === 'published' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={workingId === job.id}
                            onClick={() =>
                              moderateJob(job, 'paused')
                            }
                          >
                            Pause
                          </Button>
                        )}

                        {job.status !== 'closed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={workingId === job.id}
                            onClick={() =>
                              moderateJob(job, 'closed')
                            }
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {jobs.length === 0 && (
                    <div className="p-5">
                      <EmptyState
                        title="No job listings"
                        description="Job listings will appear here as employers publish them."
                      />
                    </div>
                  )}
                </div>
              </GlassSection>

              {/* Recent applications */}
              <GlassSection className="mt-6">
                <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white">
                        Recent applications
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Latest application activity across the
                        platform.
                      </p>
                    </div>

                    <GlassMeta accent>
                      Live activity
                    </GlassMeta>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.07]">
                  {overview.recentApplications.map(
                    (application) => (
                      <div
                        key={application.id}
                        className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-white/[0.025] sm:px-5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">
                            {application.jobTitle}
                          </p>

                          <span className="text-slate-600">
                            ·
                          </span>

                          <p className="text-sm text-slate-400">
                            {application.company}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>
                            {application.candidateName}
                          </span>

                          <span className="text-slate-700">
                            ·
                          </span>

                          <span className="capitalize">
                            {application.status.replace(
                              '-',
                              ' ',
                            )}
                          </span>

                          <span className="text-slate-700">
                            ·
                          </span>

                          <span>
                            {new Date(
                              application.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ),
                  )}

                  {overview.recentApplications.length === 0 && (
                    <div className="p-5">
                      <EmptyState
                        title="No application activity"
                        description="Submitted applications will appear in this overview."
                      />
                    </div>
                  )}
                </div>
              </GlassSection>
            </>
          )
        )}
      </main>
    </div>
  );
}
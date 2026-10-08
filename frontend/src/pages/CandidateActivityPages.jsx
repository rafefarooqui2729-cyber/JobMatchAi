import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useRealtime } from '../socket/RealtimeProvider.jsx';
import { SOCKET_EVENTS } from '../socket/events.js';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Navbar,
  PageHeader,
} from '../components/ui/index.js';
import { useToast } from '../components/ui/Toast.jsx';

/* =========================================================
   SHARED NAVIGATION
========================================================= */

function WorkspaceNav({ role, mobileMenuItems }) {
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
      brandHref={`/${role}/dashboard`}
      mobileMenuItems={mobileMenuItems}
      actions={
        <>
          <Link
            className={[
              'hidden',
              'rounded-xl',
              'border',
              'border-white/15',
              'bg-white/[0.055]',
              'px-3.5',
              'py-2',
              'text-sm',
              'font-semibold',
              'text-slate-200',
              'backdrop-blur-xl',
              'transition-all',
              'duration-200',
              'hover:-translate-y-0.5',
              'hover:border-cyan-300/25',
              'hover:bg-white/[0.09]',
              'hover:text-white',
              'focus-visible:outline-none',
              'focus-visible:ring-4',
              'focus-visible:ring-cyan-400/15',
              'sm:block',
            ].join(' ')}
            to={`/${role}/dashboard`}
          >
            Workspace
          </Link>

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

function CandidateNav() {
  return (
    <WorkspaceNav
      role="candidate"
      mobileMenuItems={[
        {
          label: 'Dashboard',
          to: '/candidate/dashboard',
        },
        {
          label: 'Explore jobs',
          to: '/jobs',
        },
        {
          label: 'Applications',
          to: '/candidate/applications',
        },
        {
          label: 'Saved jobs',
          to: '/candidate/saved-jobs',
        },
        {
          label: 'Notifications',
          to: '/candidate/notifications',
        },
        {
          label: 'Profile',
          to: '/candidate/profile',
        },
      ]}
    />
  );
}

/* =========================================================
   GLASS BACKGROUND
========================================================= */

function GlassBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[2%] top-24 -z-0 h-96 w-96 rounded-full bg-cyan-400/[0.055] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-8rem] right-[0%] -z-0 h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.055] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-[42%] -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-white/[0.018] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[28%] top-[12%] -z-0 h-48 w-48 rounded-full bg-sky-300/[0.025] blur-3xl"
      />
    </>
  );
}

/* =========================================================
   SHARED WORKSPACE
========================================================= */

function Workspace({
  title,
  description,
  children,
  loading,
  error,
  onRetry,
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <GlassBackground />

      <CandidateNav />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Candidate workspace"
          title={title}
          description={description}
        />

        {loading ? (
          <div
            className="mt-7 space-y-4"
            aria-label="Loading"
          >
            <GlassLoadingCard height="h-24" />
            <GlassLoadingCard height="h-24" />
            <GlassLoadingCard height="h-24" />
          </div>
        ) : error ? (
          <div className="mt-7">
            <GlassStateCard>
              <ErrorState
                title="We couldn't load this page"
                description={error}
                onRetry={onRetry}
              />
            </GlassStateCard>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

/* =========================================================
   GLASS HELPERS
========================================================= */

function statusTone(status) {
  if (
    status === 'shortlisted'
    || status === 'hired'
  ) {
    return 'success';
  }

  if (
    status === 'rejected'
    || status === 'withdrawn'
  ) {
    return 'neutral';
  }

  if (status === 'under-review') {
    return 'warning';
  }

  return 'navy';
}

function GlassLoadingCard({ height = 'h-24' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.045] p-4 shadow-[0_20px_70px_-40px_rgba(34,211,238,0.22)] backdrop-blur-xl sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      <LoadingSkeleton
        className={`${height} border border-white/10 bg-white/[0.035]`}
        rounded="rounded-xl"
      />
    </div>
  );
}

function GlassStateCard({ children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.055] p-5 shadow-[0_24px_80px_-40px_rgba(34,211,238,0.25)] backdrop-blur-2xl sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-300/[0.035] blur-3xl"
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function GlassActionLink({
  children,
  to,
  variant = 'secondary',
}) {
  const classes =
    variant === 'primary'
      ? [
          'border-cyan-300/25',
          'bg-gradient-to-r',
          'from-cyan-400/90',
          'to-blue-500/90',
          'text-white',
          'shadow-[0_10px_35px_-15px_rgba(34,211,238,0.7)]',
          'hover:from-cyan-300',
          'hover:to-blue-400',
          'hover:shadow-[0_14px_40px_-12px_rgba(34,211,238,0.75)]',
        ]
      : [
          'border-white/15',
          'bg-white/[0.065]',
          'text-slate-200',
          'hover:border-cyan-300/25',
          'hover:bg-white/[0.11]',
          'hover:text-white',
        ];

  return (
    <Link
      to={to}
      className={[
        'inline-flex',
        'min-h-10',
        'items-center',
        'justify-center',
        'rounded-xl',
        'border',
        'px-3.5',
        'text-sm',
        'font-semibold',
        'backdrop-blur-xl',
        'transition-all',
        'duration-200',
        'hover:-translate-y-0.5',
        'focus-visible:outline-none',
        'focus-visible:ring-4',
        'focus-visible:ring-cyan-400/15',
        ...classes,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function GlassCard({
  children,
  className = '',
  interactive = false,
}) {
  return (
    <div
      className={[
        'group',
        'relative',
        'overflow-hidden',
        'rounded-2xl',
        'border',
        'border-white/15',
        'bg-white/[0.065]',
        'backdrop-blur-2xl',
        'shadow-[0_22px_75px_-42px_rgba(34,211,238,0.3)]',
        'transition-all',
        'duration-300',
        interactive
          ? [
              'hover:-translate-y-1',
              'hover:border-white/25',
              'hover:bg-white/[0.09]',
              'hover:shadow-[0_28px_85px_-38px_rgba(34,211,238,0.4)]',
            ].join(' ')
          : '',
        className,
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-300/[0.025] blur-3xl transition-opacity duration-300 group-hover:bg-cyan-300/[0.045]"
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function GlassMeta({
  children,
  accent = false,
}) {
  return (
    <span
      className={[
        'inline-flex',
        'items-center',
        'rounded-lg',
        'border',
        'px-2.5',
        'py-1',
        'text-xs',
        accent
          ? [
              'border-cyan-300/15',
              'bg-cyan-300/[0.055]',
              'text-slate-400',
            ].join(' ')
          : [
              'border-white/10',
              'bg-white/[0.04]',
              'text-slate-500',
            ].join(' '),
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/* =========================================================
   APPLICATIONS
========================================================= */

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get(
        '/candidate/applications',
      );

      setApplications(response.data.applications);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message
          || 'Your applications could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Workspace
      title="Applications"
      description="Track each application and see status updates as they happen."
      loading={loading}
      error={error}
      onRetry={load}
    >
      {applications.length === 0 ? (
        <div className="mt-7">
          <GlassStateCard>
            <EmptyState
              title="No applications yet"
              description="When you apply to a role, its status and history will appear here."
              action={
                <GlassActionLink
                  to="/jobs"
                  variant="primary"
                >
                  Explore open roles
                </GlassActionLink>
              }
            />
          </GlassStateCard>
        </div>
      ) : (
        <section
          className="mt-7 space-y-4"
          aria-label="Your applications"
        >
          {applications.map((application) => (
            <GlassCard
              key={application.id}
              interactive
              className="p-4 sm:p-5"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-base font-semibold text-white sm:text-lg">
                      {application.job.title}
                    </h2>

                    <Badge
                      tone={statusTone(application.status)}
                      dot
                    >
                      {application.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-400">
                    {application.job.company?.name || 'Company'}
                    {application.job.location?.city
                      ? ` · ${application.job.location.city}`
                      : ''}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <GlassMeta>
                      Applied{' '}
                      {new Date(
                        application.createdAt,
                      ).toLocaleDateString()}
                    </GlassMeta>

                    <GlassMeta accent>
                      Match{' '}
                      <span className="ml-1 font-semibold text-cyan-300">
                        {application.matchScore}%
                      </span>
                    </GlassMeta>
                  </div>
                </div>

                <div className="shrink-0">
                  <GlassActionLink
                    to={`/candidate/applications/${application.id}`}
                  >
                    View application
                  </GlassActionLink>
                </div>
              </div>
            </GlassCard>
          ))}
        </section>
      )}
    </Workspace>
  );
}

/* =========================================================
   APPLICATION DETAILS
========================================================= */

export function CandidateApplicationDetailsPage() {
  const { applicationId } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get(
        `/candidate/applications/${applicationId}`,
      );

      setApplication(response.data.application);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message
          || 'Application details could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Workspace
      title="Application details"
      description="A private view of your application and its status history."
      loading={loading}
      error={error}
      onRetry={load}
    >
      {application && (
        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Main application panel */}
          <GlassCard className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-cyan-200/70">
                  {application.job.company?.name || 'Company'}
                </p>

                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {application.job.title}
                </h2>
              </div>

              <Badge
                tone={statusTone(application.status)}
                dot
              >
                {application.status.replace('-', ' ')}
              </Badge>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-inner shadow-white/[0.015] backdrop-blur-xl sm:p-5">
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                />

                <div>
                  <p className="text-sm leading-6 text-slate-400">
                    Submitted{' '}
                    <span className="font-medium text-slate-200">
                      {new Date(
                        application.createdAt,
                      ).toLocaleString()}
                    </span>
                    .
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your application is visible only to you and
                    the hiring team for this role.
                  </p>
                </div>
              </div>
            </div>

            {application.hasResume && (
              <a
                href={`/api/candidate/applications/${application.id}/resume`}
                className={[
                  'mt-5',
                  'inline-flex',
                  'min-h-10',
                  'items-center',
                  'rounded-xl',
                  'border',
                  'border-white/15',
                  'bg-white/[0.055]',
                  'px-3.5',
                  'text-sm',
                  'font-semibold',
                  'text-slate-200',
                  'backdrop-blur-xl',
                  'transition-all',
                  'duration-200',
                  'hover:-translate-y-0.5',
                  'hover:border-cyan-300/25',
                  'hover:bg-white/[0.09]',
                  'hover:text-white',
                  'focus-visible:outline-none',
                  'focus-visible:ring-4',
                  'focus-visible:ring-cyan-400/15',
                ].join(' ')}
              >
                Download resume submitted with this application
              </a>
            )}

            {/* Timeline */}
            <div className="mt-9 border-t border-white/10 pt-7">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/65">
                    Application timeline
                  </p>

                  <h3 className="mt-1.5 text-base font-semibold text-white">
                    Status history
                  </h3>
                </div>

                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-500">
                  {application.statusHistory.length}{' '}
                  {application.statusHistory.length === 1
                    ? 'event'
                    : 'events'}
                </span>
              </div>

              <ol className="mt-7 space-y-6">
                {application.statusHistory.map(
                  (event, index) => (
                    <li
                      key={`${event.status}-${event.changedAt}-${index}`}
                      className="relative flex gap-4"
                    >
                      {index <
                        application.statusHistory.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[5px] top-4 h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-cyan-300/30 via-white/10 to-transparent"
                        />
                      )}

                      <span className="relative mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center">
                        <span className="absolute h-6 w-6 rounded-full bg-cyan-400/15 blur-sm" />

                        <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold capitalize text-slate-200">
                          {event.status.replace('-', ' ')}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(
                            event.changedAt,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ),
                )}
              </ol>
            </div>
          </GlassCard>

          {/* Match panel */}
          <GlassCard
            className="h-fit p-5 sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
              Match snapshot
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
              <div className="flex items-end gap-1">
                <p className="text-5xl font-semibold tracking-tight text-white">
                  {application.matchScore}
                </p>

                <span className="mb-1.5 text-lg font-medium text-cyan-300">
                  %
                </span>
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_18px_rgba(34,211,238,0.45)] transition-[width] duration-700 motion-reduce:transition-none"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        application.matchScore,
                      ),
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                Match score recorded when you applied.
              </p>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <Link
                className="inline-flex text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200 hover:underline"
                to={`/jobs/${application.job._id}`}
              >
                View job details →
              </Link>
            </div>
          </GlassCard>
        </div>
      )}

      <Link
        className={[
          'mt-6',
          'inline-flex',
          'rounded-lg',
          'px-2',
          'py-1',
          'text-sm',
          'font-semibold',
          'text-slate-400',
          'transition-all',
          'duration-200',
          'hover:bg-white/[0.045]',
          'hover:text-cyan-300',
          'focus-visible:outline-none',
          'focus-visible:ring-4',
          'focus-visible:ring-cyan-400/15',
        ].join(' ')}
        to="/candidate/applications"
      >
        ← All applications
      </Link>
    </Workspace>
  );
}

/* =========================================================
   SAVED JOBS
========================================================= */

export function CandidateSavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState('');

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get(
        '/candidate/saved-jobs',
      );

      setSavedJobs(response.data.savedJobs);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message
          || 'Saved jobs could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(jobId) {
    setRemoving(jobId);

    try {
      await apiClient.delete(
        `/candidate/saved-jobs/${jobId}`,
      );

      setSavedJobs((current) =>
        current.filter(({ job }) => job._id !== jobId),
      );

      toast(
        'Job removed from your saved list.',
        { tone: 'success' },
      );
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message
          || 'This job could not be removed.',
        { tone: 'error' },
      );
    } finally {
      setRemoving('');
    }
  }

  return (
    <Workspace
      title="Saved jobs"
      description="Keep promising roles close and return to them when you’re ready."
      loading={loading}
      error={error}
      onRetry={load}
    >
      {savedJobs.length === 0 ? (
        <div className="mt-7">
          <GlassStateCard>
            <EmptyState
              title="No saved jobs"
              description="Save a role from recommendations or job search to keep it here."
              action={
                <GlassActionLink
                  to="/jobs"
                  variant="primary"
                >
                  Browse jobs
                </GlassActionLink>
              }
            />
          </GlassStateCard>
        </div>
      ) : (
        <section
          className="mt-7 space-y-4"
          aria-label="Saved jobs"
        >
          {savedJobs.map(
            ({ job, savedAt, isActive }) => (
              <GlassCard
                key={job._id}
                interactive
                className="p-4 sm:p-5"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-semibold text-white sm:text-lg">
                        {job.title}
                      </h2>

                      <Badge
                        tone={
                          isActive
                            ? 'success'
                            : 'neutral'
                        }
                        dot
                      >
                        {isActive
                          ? 'Accepting applications'
                          : 'No longer active'}
                      </Badge>
                    </div>

                    <p className="mt-1.5 text-sm text-slate-400">
                      {job.company?.name || 'Company'}
                      {job.location?.city
                        ? ` · ${job.location.city}`
                        : job.location?.remoteType ===
                            'remote'
                          ? ' · Remote'
                          : ''}
                    </p>

                    <div className="mt-4">
                      <GlassMeta>
                        Saved{' '}
                        {new Date(
                          savedAt,
                        ).toLocaleDateString()}
                      </GlassMeta>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isActive && (
                      <GlassActionLink
                        to={`/jobs/${job._id}`}
                        variant="primary"
                      >
                        View job
                      </GlassActionLink>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      loading={removing === job._id}
                      onClick={() => remove(job._id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ),
          )}
        </section>
      )}
    </Workspace>
  );
}

/* =========================================================
   NOTIFICATIONS NAVIGATION
========================================================= */

function NotificationNav({ role }) {
  const mobileMenuItems =
    role === 'employer'
      ? [
          {
            label: 'Jobs',
            to: '/employer/dashboard',
          },
          {
            label: 'Company profile',
            to: '/employer/company',
          },
          {
            label: 'Notifications',
            to: '/employer/notifications',
          },
        ]
      : role === 'admin'
        ? [
            {
              label: 'Overview',
              to: '/admin/dashboard',
            },
            {
              label: 'Notifications',
              to: '/admin/notifications',
            },
          ]
        : [
            {
              label: 'Dashboard',
              to: '/candidate/dashboard',
            },
            {
              label: 'Explore jobs',
              to: '/jobs',
            },
            {
              label: 'Applications',
              to: '/candidate/applications',
            },
            {
              label: 'Saved jobs',
              to: '/candidate/saved-jobs',
            },
            {
              label: 'Notifications',
              to: '/candidate/notifications',
            },
            {
              label: 'Profile',
              to: '/candidate/profile',
            },
          ];

  return (
    <WorkspaceNav
      role={role}
      mobileMenuItems={mobileMenuItems}
    />
  );
}

function notificationDestination(
  notification,
  role,
) {
  const { type, id } =
    notification.resource ?? {};

  if (!id) {
    return `/${role}/dashboard`;
  }

  if (type === 'application') {
    return role === 'employer'
      ? `/employer/applications/${id}`
      : role === 'admin'
        ? '/admin/dashboard'
        : `/candidate/applications/${id}`;
  }

  if (type === 'job') {
    return `/jobs/${id}`;
  }

  return `/${role}/dashboard`;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export function CandidateNotificationsPage() {
  const { user } = useAuth();
  const { subscribe } = useRealtime();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState('');
  const [updating, setUpdating] =
    useState(false);

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get(
        '/notifications?limit=50',
      );

      setNotifications(
        response.data.notifications,
      );

      setUnreadCount(
        response.data.unreadCount,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message
          || 'Notifications could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () =>
      subscribe(
        SOCKET_EVENTS.NOTIFICATION_CREATED,
        ({ notification }) => {
          if (!notification?._id) {
            return;
          }

          setNotifications((current) => {
            if (
              current.some(
                (item) =>
                  item._id === notification._id,
              )
            ) {
              return current;
            }

            return [
              notification,
              ...current,
            ].slice(0, 50);
          });

          if (!notification.readAt) {
            setUnreadCount(
              (count) => count + 1,
            );
          }
        },
      ),
    [subscribe],
  );

  async function markAllRead() {
    setUpdating(true);

    try {
      await apiClient.patch(
        '/notifications/read-all',
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          readAt:
            item.readAt
            || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);

      toast(
        'All notifications marked as read.',
        { tone: 'success' },
      );
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message
          || 'Notifications could not be updated.',
        { tone: 'error' },
      );
    } finally {
      setUpdating(false);
    }
  }

  async function openNotification(
    notification,
  ) {
    if (notification.readAt) {
      return;
    }

    try {
      const response =
        await apiClient.patch(
          `/notifications/${notification._id}/read`,
        );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? response.data.notification
            : item,
        ),
      );

      setUnreadCount((count) =>
        Math.max(0, count - 1),
      );
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message
          || 'This notification could not be marked as read.',
        { tone: 'error' },
      );
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <GlassBackground />

      <NotificationNav role={user.role} />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Candidate workspace"
          title="Notifications"
          description="Updates about applications, opportunities, and your account."
        />

        {loading ? (
          <div
            className="mt-7 space-y-4"
            aria-label="Loading"
          >
            <GlassLoadingCard />

            <GlassLoadingCard />
          </div>
        ) : error ? (
          <div className="mt-7">
            <GlassStateCard>
              <ErrorState
                title="Notifications unavailable"
                description={error}
                onRetry={load}
              />
            </GlassStateCard>
          </div>
        ) : (
          <>
            {/* Notification toolbar */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <div className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-white/[0.065] px-3.5 py-2 shadow-[0_12px_40px_-25px_rgba(34,211,238,0.35)] backdrop-blur-xl">
                <span
                  aria-hidden="true"
                  className={[
                    'h-2',
                    'w-2',
                    'rounded-full',
                    unreadCount
                      ? 'bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]'
                      : 'bg-slate-500',
                  ].join(' ')}
                />

                <p className="text-sm font-medium text-slate-300">
                  {unreadCount} unread
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                loading={updating}
                disabled={!unreadCount}
                onClick={markAllRead}
              >
                Mark all as read
              </Button>
            </div>

            {notifications.length === 0 ? (
              <div className="mt-5">
                <GlassStateCard>
                  <EmptyState
                    title="You're all caught up"
                    description="New updates will appear here when there’s something to share."
                  />
                </GlassStateCard>
              </div>
            ) : (
              <section
                className="mt-5 space-y-4"
                aria-label="Notifications"
              >
                {notifications.map(
                  (notification) => {
                    const unread =
                      !notification.readAt;

                    return (
                      <Link
                        key={notification._id}
                        to={notificationDestination(
                          notification,
                          user.role,
                        )}
                        onClick={() =>
                          openNotification(
                            notification,
                          )
                        }
                        className={[
                          'group',
                          'relative',
                          'block',
                          'overflow-hidden',
                          'rounded-2xl',
                          'border',
                          'p-4',
                          'backdrop-blur-2xl',
                          'outline-none',
                          'transition-all',
                          'duration-300',
                          'hover:-translate-y-1',
                          'focus-visible:ring-4',
                          'focus-visible:ring-cyan-300/15',
                          unread
                            ? [
                                'border-cyan-300/20',
                                'bg-gradient-to-br',
                                'from-cyan-400/[0.09]',
                                'via-white/[0.065]',
                                'to-blue-500/[0.055]',
                                'shadow-[0_22px_70px_-32px_rgba(34,211,238,0.42)]',
                              ].join(' ')
                            : [
                                'border-white/10',
                                'bg-white/[0.045]',
                                'hover:border-white/20',
                                'hover:bg-white/[0.075]',
                                'hover:shadow-[0_22px_65px_-35px_rgba(255,255,255,0.2)]',
                              ].join(' '),
                        ].join(' ')}
                      >
                        <span
                          aria-hidden="true"
                          className={[
                            'pointer-events-none',
                            'absolute',
                            'inset-x-6',
                            'top-0',
                            'h-px',
                            'bg-gradient-to-r',
                            'from-transparent',
                            unread
                              ? 'via-cyan-300/45'
                              : 'via-white/25',
                            'to-transparent',
                          ].join(' ')}
                        />

                        <span
                          aria-hidden="true"
                          className={[
                            'pointer-events-none',
                            'absolute',
                            '-right-20',
                            '-top-20',
                            'h-40',
                            'w-40',
                            'rounded-full',
                            'blur-3xl',
                            unread
                              ? 'bg-cyan-300/[0.045]'
                              : 'bg-white/[0.015]',
                          ].join(' ')}
                        />

                        <div className="relative z-10 flex items-start gap-3">
                          <span className="relative mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center">
                            {unread && (
                              <span className="absolute h-6 w-6 rounded-full bg-cyan-400/20 blur-sm" />
                            )}

                            <span
                              className={[
                                'relative',
                                'h-2.5',
                                'w-2.5',
                                'rounded-full',
                                unread
                                  ? 'bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                                  : 'bg-slate-600',
                              ].join(' ')}
                            />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={[
                                  'font-semibold',
                                  unread
                                    ? 'text-white'
                                    : 'text-slate-300',
                                ].join(' ')}
                              >
                                {notification.title}
                              </p>

                              {unread && (
                                <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
                                  New
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm leading-6 text-slate-400">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                              {new Date(
                                notification.createdAt,
                              ).toLocaleString()}
                            </p>
                          </div>

                          <span
                            aria-hidden="true"
                            className="shrink-0 pt-0.5 text-lg text-slate-600 transition-all duration-200 group-hover:translate-x-1 group-hover:text-cyan-300"
                          >
                            →
                          </span>
                        </div>
                      </Link>
                    );
                  },
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
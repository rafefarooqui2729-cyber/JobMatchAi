import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client.js';
import {
  Avatar,
  Badge,
  Button,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pagination,
  Table,
} from '../components/ui/index.js';
import EmployerNavbar from '../components/employer/EmployerNavbar.jsx';
import { useToast } from '../components/ui/Toast.jsx';

function statusTone(status) {
  if (status === 'published') return 'success';
  if (status === 'closed') return 'neutral';
  if (status === 'paused') return 'warning';
  return 'navy';
}

function GlassBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[2%] top-24 -z-0 h-96 w-96 rounded-full bg-cyan-400/[0.055] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-8rem] right-[2%] -z-0 h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.055] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-[42%] -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-white/[0.018] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[25%] top-[10%] -z-0 h-48 w-48 rounded-full bg-sky-300/[0.025] blur-3xl"
      />
    </>
  );
}

function GlassPanel({
  children,
  className = '',
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
        'shadow-[0_24px_80px_-42px_rgba(34,211,238,0.3)]',
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

function GlassAction({
  children,
  to,
  variant = 'secondary',
}) {
  const variants =
    variant === 'primary'
      ? [
          'border-cyan-300/25',
          'bg-gradient-to-r',
          'from-cyan-400/90',
          'to-blue-500/90',
          'text-white',
          'shadow-[0_12px_35px_-16px_rgba(34,211,238,0.75)]',
          'hover:from-cyan-300',
          'hover:to-blue-400',
        ]
      : [
          'border-white/15',
          'bg-white/[0.055]',
          'text-slate-200',
          'hover:border-cyan-300/25',
          'hover:bg-white/[0.1]',
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
        ...variants,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function Metric({ label, value, accent = false }) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>

        <span
          aria-hidden="true"
          className={[
            'mt-1',
            'h-9',
            'w-9',
            'rounded-xl',
            'border',
            accent
              ? 'border-cyan-300/20 bg-cyan-300/[0.08]'
              : 'border-white/10 bg-white/[0.045]',
          ].join(' ')}
        />
      </div>
    </GlassPanel>
  );
}

function GlassLoadingCard({ className = '' }) {
  return (
    <div
      className={[
        'relative',
        'overflow-hidden',
        'rounded-2xl',
        'border',
        'border-white/15',
        'bg-white/[0.045]',
        'p-5',
        'backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <LoadingSkeleton
        className="h-full min-h-20 border border-white/10 bg-white/[0.035]"
        rounded="rounded-xl"
      />
    </div>
  );
}

export default function EmployerDashboardPage() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toast = useToast();
  const pageSize = 8;

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        companyResponse,
        jobsResponse,
      ] = await Promise.all([
        apiClient.get('/employer/company'),
        apiClient.get('/employer/jobs'),
      ]);

      setCompany(companyResponse.data.company);
      setJobs(jobsResponse.data.jobs);

      return jobsResponse.data.jobs;
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message
          || 'Employer workspace could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  async function changeStatus(job, action) {
    setActionLoading(true);

    try {
      await apiClient.post(
        `/employer/jobs/${job._id}/${action}`,
      );

      toast(
        action === 'publish'
          ? 'Job published.'
          : 'Job closed.',
        { tone: 'success' },
      );

      await loadWorkspace();
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message
          || 'Job status could not be updated.',
        { tone: 'error' },
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteJob() {
    if (!pendingDelete) {
      return;
    }

    setActionLoading(true);

    try {
      await apiClient.delete(
        `/employer/jobs/${pendingDelete._id}`,
      );

      setPendingDelete(null);

      toast(
        'Job deleted.',
        { tone: 'success' },
      );

      const remainingJobs =
        await loadWorkspace();

      if (remainingJobs) {
        setPage((current) =>
          Math.max(
            1,
            Math.min(
              current,
              Math.ceil(
                remainingJobs.length / pageSize,
              ),
            ),
          ),
        );
      }
    } catch (requestError) {
      toast(
        requestError.response?.data?.error?.message
          || 'Job could not be deleted.',
        { tone: 'error' },
      );
    } finally {
      setActionLoading(false);
    }
  }

  const pageCount = Math.max(
    1,
    Math.ceil(jobs.length / pageSize),
  );

  const pageJobs = jobs.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const publishedCount = jobs.filter(
    (job) => job.status === 'published',
  ).length;

  const draftCount = jobs.filter(
    (job) => job.status === 'draft',
  ).length;

  const columns = [
    {
      key: 'title',
      header: 'Job',
      render: (_, job) => (
        <div className="min-w-40">
          <p className="font-semibold text-white">
            {job.title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {job.location?.city
              || job.location?.country
              || (
                job.location?.remoteType === 'remote'
                  ? 'Remote'
                  : 'Location not specified'
              )}
          </p>
        </div>
      ),
    },

    {
      key: 'employmentType',
      header: 'Type',
      render: (value) => (
        <span className="capitalize text-slate-300">
          {value?.replace('-', ' ')}
        </span>
      ),
    },

    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge
          tone={statusTone(value)}
          dot
        >
          {value}
        </Badge>
      ),
    },

    {
      key: 'updatedAt',
      header: 'Updated',
      render: (value) =>
        value
          ? new Date(value).toLocaleDateString()
          : '—',
    },

    {
      key: 'actions',
      header: 'Actions',
      render: (_, job) => (
        <div className="flex min-w-64 flex-wrap gap-1.5">
          <Link
            to={`/employer/jobs/${job._id}/edit`}
            className={[
              'inline-flex',
              'min-h-9',
              'items-center',
              'rounded-lg',
              'border',
              'border-white/10',
              'bg-white/[0.04]',
              'px-2.5',
              'text-xs',
              'font-semibold',
              'text-slate-300',
              'transition-all',
              'duration-200',
              'hover:border-cyan-300/20',
              'hover:bg-white/[0.08]',
              'hover:text-white',
              'focus-visible:outline-none',
              'focus-visible:ring-2',
              'focus-visible:ring-cyan-400/20',
            ].join(' ')}
          >
            Edit
          </Link>

          <Link
            to={`/employer/jobs/${job._id}/applications`}
            className={[
              'inline-flex',
              'min-h-9',
              'items-center',
              'rounded-lg',
              'border',
              'border-white/10',
              'bg-white/[0.04]',
              'px-2.5',
              'text-xs',
              'font-semibold',
              'text-slate-300',
              'transition-all',
              'duration-200',
              'hover:border-cyan-300/20',
              'hover:bg-white/[0.08]',
              'hover:text-white',
              'focus-visible:outline-none',
              'focus-visible:ring-2',
              'focus-visible:ring-cyan-400/20',
            ].join(' ')}
          >
            Applicants
          </Link>

          {job.status === 'draft'
            || job.status === 'paused' ? (
            <Button
              variant="subtle"
              size="sm"
              disabled={actionLoading}
              onClick={() =>
                changeStatus(job, 'publish')
              }
            >
              Publish
            </Button>
          ) : job.status === 'published' ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={actionLoading}
              onClick={() =>
                changeStatus(job, 'close')
              }
            >
              Close
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            disabled={actionLoading}
            onClick={() =>
              setPendingDelete(job)
            }
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-canvas">
        <GlassBackground />

        <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
          <div className="space-y-5">
            <GlassLoadingCard className="h-20" />

            <GlassLoadingCard className="h-36" />

            <div className="grid gap-3 sm:grid-cols-3">
              <GlassLoadingCard className="h-28" />
              <GlassLoadingCard className="h-28" />
              <GlassLoadingCard className="h-28" />
            </div>

            <GlassLoadingCard className="h-[26rem]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <GlassBackground />

      <div className="relative z-20">
        <EmployerNavbar />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Employer workspace"
          title="Your jobs"
          description="Create and manage openings for your company."
          actions={
            <GlassAction
              to="/employer/jobs/new"
              variant="primary"
            >
              + Create job
            </GlassAction>
          }
        />

        {error && (
          <div className="mt-6">
            <GlassPanel className="p-5">
              <ErrorState
                title="Workspace unavailable"
                description={error}
                onRetry={loadWorkspace}
              />
            </GlassPanel>
          </div>
        )}

        {company && (
          <GlassPanel className="mt-6 p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 blur-xl" />

                <Avatar
                  name={company.name}
                  src={company.logoUrl}
                  size="lg"
                  className="relative rounded-2xl border border-white/20 bg-white/[0.9] shadow-[0_12px_40px_-20px_rgba(34,211,238,0.45)]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-cyan-200/65">
                  Company
                </p>

                <h2 className="mt-1.5 truncate text-lg font-semibold text-white sm:text-xl">
                  {company.name}
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-400">
                  {[
                    company.industry,
                    company.headquarters?.city,
                    company.headquarters?.country,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                    || 'Add company details to complete your profile.'}
                </p>
              </div>

              <Link
                to="/employer/company"
                className={[
                  'inline-flex',
                  'min-h-10',
                  'items-center',
                  'justify-center',
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
                  'hover:bg-white/[0.1]',
                  'hover:text-white',
                  'focus-visible:outline-none',
                  'focus-visible:ring-4',
                  'focus-visible:ring-cyan-400/15',
                ].join(' ')}
              >
                Edit company profile
              </Link>
            </div>
          </GlassPanel>
        )}

        {!error && (
          <>
            <div className="my-5 grid gap-3 sm:grid-cols-3">
              <Metric
                label="All jobs"
                value={jobs.length}
              />

              <Metric
                label="Published"
                value={publishedCount}
                accent
              />

              <Metric
                label="Drafts"
                value={draftCount}
              />
            </div>

            <GlassPanel>
              <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">
                      Job listings
                    </h2>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {jobs.length} total
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Showing up to 100 most recently updated jobs.
                  </p>
                </div>

                <GlassAction
                  to="/employer/jobs/new"
                  variant="secondary"
                >
                  Create a job
                </GlassAction>
              </div>

              {jobs.length === 0 ? (
                <div className="p-5 sm:p-8">
                  <EmptyState
                    title="No jobs yet"
                    description="Create a draft opening to start building your job listings."
                    action={
                      <GlassAction
                        to="/employer/jobs/new"
                        variant="primary"
                      >
                        Create your first job
                      </GlassAction>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table
                      rowKey="_id"
                      caption={`${company?.name ?? 'Company'} job listings`}
                      columns={columns}
                      rows={pageJobs}
                    />
                  </div>

                  <div className="border-t border-white/10 px-5 py-4">
                    <Pagination
                      page={page}
                      pageCount={pageCount}
                      onPageChange={setPage}
                    />
                  </div>
                </>
              )}
            </GlassPanel>
          </>
        )}
      </main>

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        onClose={() =>
          setPendingDelete(null)
        }
        onConfirm={deleteJob}
        title="Delete this job?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will be permanently removed.`
            : ''
        }
        confirmLabel="Delete job"
        destructive
        loading={actionLoading}
      />
    </div>
  );
}
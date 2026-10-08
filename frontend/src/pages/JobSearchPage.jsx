import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingSkeleton,
  Navbar,
  Pagination,
  Select,
  SkillChip,
} from '../components/ui/index.js';

const employmentTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'salary', label: 'Highest salary' },
  { value: 'relevance', label: 'Relevance' },
];

const emptyFilters = {
  q: '',
  title: '',
  skill: '',
  location: '',
  employmentType: '',
  minExperience: '',
  maxExperience: '',
  minSalary: '',
  maxSalary: '',
  salaryCurrency: '',
  sort: 'newest',
};

function stateFromSearch(search) {
  const params = new URLSearchParams(search);

  return Object.fromEntries(
    Object.keys(emptyFilters).map((key) => [
      key,
      params.get(key) ?? emptyFilters[key],
    ]),
  );
}

function paramsFromFilters(filters, page = 1) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    const normalized = value.trim();

    if (
      normalized &&
      !(key === 'sort' && normalized === 'newest')
    ) {
      params.set(key, normalized);
    }
  }

  params.set('page', String(page));

  return params;
}

function salaryLabel(salary) {
  if (
    !salary ||
    salary.isDisclosed === false ||
    (salary.minimum == null && salary.maximum == null)
  ) {
    return 'Salary not disclosed';
  }

  const amount = (value) =>
    value == null
      ? ''
      : new Intl.NumberFormat(undefined, {
          maximumFractionDigits: 0,
        }).format(value);

  const range =
    salary.minimum != null && salary.maximum != null
      ? `${amount(salary.minimum)}–${amount(salary.maximum)}`
      : salary.minimum != null
        ? `From ${amount(salary.minimum)}`
        : `Up to ${amount(salary.maximum)}`;

  return `${salary.currency ? `${salary.currency} ` : ''}${range}${
    salary.period ? ` / ${salary.period}` : ''
  }`;
}

function locationLabel(location = {}) {
  const place = [
    location.city,
    location.region,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  if (location.remoteType === 'remote') {
    return place ? `${place} · Remote` : 'Remote';
  }

  if (location.remoteType === 'hybrid') {
    return place ? `${place} · Hybrid` : 'Hybrid';
  }

  return place || 'Location not specified';
}

function FilterFields({ filters, onChange }) {
  return (
    <div className="space-y-4">
      <Input
        label="Job title"
        value={filters.title}
        onChange={(event) => onChange('title', event.target.value)}
        maxLength={120}
        placeholder="e.g. Product designer"
      />

      <Input
        label="Skill"
        value={filters.skill}
        onChange={(event) => onChange('skill', event.target.value)}
        maxLength={100}
        placeholder="e.g. React"
        hint="Enter one skill."
      />

      <Input
        label="Location"
        value={filters.location}
        onChange={(event) => onChange('location', event.target.value)}
        maxLength={120}
        placeholder="City, region, or country"
      />

      <Select
        label="Employment type"
        value={filters.employmentType}
        onChange={(event) =>
          onChange('employmentType', event.target.value)
        }
        options={employmentTypes}
        placeholder="Any type"
      />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-200">
          Experience range
          <span className="ml-1 text-slate-500">(years)</span>
        </legend>

        <div className="grid grid-cols-2 gap-3">
          <Input
            aria-label="Minimum experience years"
            type="number"
            min="0"
            max="80"
            step="1"
            placeholder="Min"
            value={filters.minExperience}
            onChange={(event) =>
              onChange('minExperience', event.target.value)
            }
          />

          <Input
            aria-label="Maximum experience years"
            type="number"
            min="0"
            max="80"
            step="1"
            placeholder="Max"
            value={filters.maxExperience}
            onChange={(event) =>
              onChange('maxExperience', event.target.value)
            }
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-200">
          Salary range
        </legend>

        <div className="grid grid-cols-2 gap-3">
          <Input
            aria-label="Minimum salary"
            type="number"
            min="0"
            step="1000"
            placeholder="Min"
            value={filters.minSalary}
            onChange={(event) =>
              onChange('minSalary', event.target.value)
            }
          />

          <Input
            aria-label="Maximum salary"
            type="number"
            min="0"
            step="1000"
            placeholder="Max"
            value={filters.maxSalary}
            onChange={(event) =>
              onChange('maxSalary', event.target.value)
            }
          />
        </div>

        <Input
          className="mt-3"
          label="Currency"
          value={filters.salaryCurrency}
          onChange={(event) =>
            onChange(
              'salaryCurrency',
              event.target.value.toUpperCase(),
            )
          }
          maxLength={3}
          placeholder="USD"
          hint="Optional ISO currency code."
        />
      </fieldset>
    </div>
  );
}

function JobResultCard({ job }) {
  const company = job.company ?? {};
  const isExternal = Boolean(
    job.isExternal || job.source === 'external',
  );

  const companyName =
    company.name ||
    job.companyName ||
    'Company';

  const providerLabel = job.provider
    ? job.provider.charAt(0).toUpperCase() +
      job.provider.slice(1)
    : 'External source';

  return (
    <Card
      animated
      className="group relative overflow-hidden p-5 sm:p-6"
    >
      {/* Ambient card glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition-opacity duration-300 group-hover:bg-cyan-400/15"
      />

      {/* Top glass highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"
      />

      <div className="relative flex gap-3.5">
        <Avatar
          name={companyName}
          src={company.logoUrl}
          size="lg"
          className="rounded-2xl border border-white/10 shadow-lg shadow-black/10"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-xs font-medium text-slate-400">
              {companyName}
            </p>

            {isExternal && (
              <Badge tone="info">
                External
              </Badge>
            )}
          </div>

          <h2 className="mt-1 text-lg font-semibold leading-6 tracking-tight text-white">
            <Link
              className="rounded-sm transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              to={`/jobs/${job._id}`}
            >
              {job.title}
            </Link>
          </h2>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="dark">
              {job.employmentType?.replace('-', ' ')}
            </Badge>

            {job.location?.remoteType && (
              <Badge>
                {job.location.remoteType}
              </Badge>
            )}

            {isExternal && (
              <Badge>
                via {providerLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid gap-2.5 text-sm text-slate-400 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300"
          >
            ⌖
          </span>

          <span className="min-w-0 truncate">
            {locationLabel(job.location)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300"
          >
            ₹
          </span>

          <span className="font-medium text-cyan-100">
            {salaryLabel(job.salary)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300"
          >
            ◷
          </span>

          <span>
            {job.minimumExperience ?? 0}
            {job.maximumExperience != null
              ? `–${job.maximumExperience}`
              : '+'}{' '}
            years experience
          </span>
        </div>
      </div>

      <SkillList
        label="Required"
        skills={job.requiredSkills}
      />

      <SkillList
        label="Preferred"
        skills={job.preferredSkills}
        muted
      />

      <div className="relative mt-5 border-t border-white/10 pt-4">
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/jobs/${job._id}`}
            className="inline-flex min-h-10 items-center rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 px-4 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-950/10 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:from-cyan-400/20 hover:to-blue-500/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/20"
          >
            View job details
            <span
              className="ml-1.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </Link>

          {isExternal && job.externalApplyUrl && (
            <a
              href={job.externalApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] px-4 text-sm font-semibold text-emerald-100 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/35 hover:bg-emerald-400/[0.13] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
            >
              Apply externally
              <span className="ml-1.5" aria-hidden="true">
                ↗
              </span>
            </a>
          )}
        </div>

        {isExternal && job.externalApplyUrl && (
          <p className="mt-2 text-xs text-slate-500">
            You’ll complete your application on the external job site.
          </p>
        )}
      </div>
    </Card>
  );
}

function SkillList({
  label,
  skills = [],
  muted = false,
}) {
  if (!skills.length) return null;

  return (
    <div className="relative mt-4 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      {skills.slice(0, 8).map((skill) => (
        <SkillChip
          key={skill}
          className={muted ? 'opacity-70' : ''}
        >
          {skill}
        </SkillChip>
      ))}

      {skills.length > 8 && (
        <span className="text-xs text-slate-500">
          +{skills.length - 8} more
        </span>
      )}
    </div>
  );
}

export default function JobSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryFilters = useMemo(
    () => stateFromSearch(location.search),
    [location.search],
  );

  const [filters, setFilters] = useState(queryFilters);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 12,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] =
    useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  useEffect(() => {
    setFilters(queryFilters);
  }, [queryFilters]);

  const loadJobs = useCallback(
    async (signal) => {
      const params = new URLSearchParams(
        location.search,
      );

      params.set('limit', '12');

      setLoading(true);
      setError('');

      try {
        const { data } = await apiClient.get(
          `/jobs?${params.toString()}`,
          { signal },
        );

        setJobs(data.jobs);
        setPagination(data.pagination);

        if (
          params.get('page') !==
          String(data.pagination.page)
        ) {
          params.set(
            'page',
            String(data.pagination.page),
          );

          navigate(
            {
              pathname: '/jobs',
              search: `?${params.toString()}`,
            },
            { replace: true },
          );
        }
      } catch (requestError) {
        if (requestError.code === 'ERR_CANCELED') {
          return;
        }

        setError(
          requestError.response?.data?.error?.message ||
            'Jobs could not be loaded. Please try again.',
        );

        setJobs([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [location.search, navigate],
  );

  useEffect(() => {
    const controller = new AbortController();

    loadJobs(controller.signal);

    return () => controller.abort();
  }, [loadJobs]);

  function changeFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationError('');
  }

  function applyFilters(event) {
    event.preventDefault();

    if (
      filters.minExperience &&
      filters.maxExperience &&
      Number(filters.minExperience) >
        Number(filters.maxExperience)
    ) {
      setValidationError(
        'Minimum experience cannot exceed maximum experience.',
      );
      return;
    }

    if (
      filters.minSalary &&
      filters.maxSalary &&
      Number(filters.minSalary) >
        Number(filters.maxSalary)
    ) {
      setValidationError(
        'Minimum salary cannot exceed maximum salary.',
      );
      return;
    }

    if (
      filters.sort === 'relevance' &&
      filters.q.trim().length < 2
    ) {
      setValidationError(
        'Enter at least two characters to sort by relevance.',
      );
      return;
    }

    navigate({
      pathname: '/jobs',
      search: `?${paramsFromFilters(filters).toString()}`,
    });

    setMobileFiltersOpen(false);
  }

  function changeSort(value) {
    const next = {
      ...queryFilters,
      sort: value,
    };

    if (
      value === 'relevance' &&
      next.q.trim().length < 2
    ) {
      setValidationError(
        'Enter a search term of at least two characters before sorting by relevance.',
      );
      return;
    }

    setValidationError('');
    setFilters(next);

    navigate({
      pathname: '/jobs',
      search: `?${paramsFromFilters(next, 1).toString()}`,
    });
  }

  function resetFilters() {
    setFilters(emptyFilters);
    setValidationError('');
    navigate('/jobs');
    setMobileFiltersOpen(false);
  }

  const page = Number(
    new URLSearchParams(location.search).get('page') || 1,
  );

  const filterForm = (mobile = false) => (
    <form
      onSubmit={applyFilters}
      className="space-y-4"
    >
      {mobile && (
        <h2 className="text-base font-semibold text-white">
          Filters
        </h2>
      )}

      <Input
        label="Search roles"
        value={filters.q}
        onChange={(event) =>
          changeFilter('q', event.target.value)
        }
        maxLength={120}
        placeholder="Title, company, or keywords"
      />

      <FilterFields
        filters={filters}
        onChange={changeFilter}
      />

      {validationError && (
        <div
          className="rounded-xl border border-rose-300/20 bg-rose-400/[0.07] px-3.5 py-3 text-sm font-medium text-rose-200 backdrop-blur-md"
          role="alert"
        >
          {validationError}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          className="flex-1"
        >
          Apply filters
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={resetFilters}
        >
          Reset
        </Button>
      </div>
    </form>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[8%] top-24 -z-0 h-72 w-72 rounded-full bg-cyan-500/[0.07] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-10 right-[5%] -z-0 h-80 w-80 rounded-full bg-blue-600/[0.06] blur-3xl"
      />

      <Navbar
        actions={
          <Link
            to="/login"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:border-cyan-300/20 hover:bg-white/[0.07] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Sign in
          </Link>
        }
      />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <header className="mb-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Explore opportunities
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Find your next role
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Search real openings and narrow the list by
                the details that matter to you.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-right backdrop-blur-xl sm:block">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Available
              </p>

              <p className="mt-0.5 text-xl font-semibold text-cyan-100">
                {loading ? '—' : pagination.total}
              </p>
            </div>
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm text-slate-400">
            {pagination.total}{' '}
            {pagination.total === 1
              ? 'opening'
              : 'openings'}
          </p>

          <Button
            variant="secondary"
            onClick={() =>
              setMobileFiltersOpen(true)
            }
          >
            Filters
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <Card className="sticky top-20 overflow-hidden p-5">
              <div
                aria-hidden="true"
                className="mb-5 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
              />

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  Filters
                </h2>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Reset
                </button>
              </div>

              {filterForm()}
            </Card>
          </aside>

          <section
            aria-label="Job search results"
            aria-busy={loading}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 shadow-xl shadow-black/10 backdrop-blur-xl">
              <p className="text-sm text-slate-400">
                {loading
                  ? 'Searching openings…'
                  : `${pagination.total} ${
                      pagination.total === 1
                        ? 'opening'
                        : 'openings'
                    }`}

                {!loading &&
                  pagination.total > 0 &&
                  ` · Page ${pagination.page} of ${pagination.totalPages}`}
              </p>

              <Select
                label="Sort jobs"
                value={queryFilters.sort}
                onChange={(event) =>
                  changeSort(event.target.value)
                }
                options={sortOptions}
                className="w-48"
              />
            </div>

            {error && (
              <ErrorState
                title="Job search unavailable"
                description={error}
                onRetry={() => loadJobs()}
                className="mb-4"
              />
            )}

            {loading ? (
              <div
                className="space-y-4"
                aria-label="Loading jobs"
              >
                {[0, 1, 2].map((item) => (
                  <LoadingSkeleton
                    key={item}
                    className="h-56 border border-white/10 bg-white/[0.035]"
                    rounded="rounded-2xl"
                  />
                ))}
              </div>
            ) : !error && jobs.length === 0 ? (
              <Card className="relative overflow-hidden p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-cyan-400/[0.06] blur-3xl"
                />

                <EmptyState
                  title="No matching jobs"
                  description="Try adjusting your keywords or filters to see more opportunities."
                  action={
                    <Button
                      variant="secondary"
                      onClick={resetFilters}
                    >
                      Clear all filters
                    </Button>
                  }
                />
              </Card>
            ) : !error ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${location.search}-${jobs.length}`}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -5,
                    }}
                    transition={{
                      duration: 0.18,
                    }}
                    className="space-y-4"
                  >
                    {jobs.map((job) => (
                      <JobResultCard
                        key={job._id}
                        job={job}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 shadow-xl shadow-black/10 backdrop-blur-xl">
                  <Pagination
                    page={pagination.page}
                    pageCount={pagination.totalPages}
                    onPageChange={(nextPage) =>
                      navigate({
                        pathname: '/jobs',
                        search: `?${paramsFromFilters(
                          queryFilters,
                          nextPage,
                        ).toString()}`,
                      })
                    }
                  />
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>

      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              aria-label="Close filters"
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() =>
                setMobileFiltersOpen(false)
              }
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Job filters"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22 }}
              className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto border-l border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    Refine search
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Filter jobs
                  </h2>
                </div>

                <Button
                  variant="ghost"
                  aria-label="Close filters"
                  onClick={() =>
                    setMobileFiltersOpen(false)
                  }
                >
                  Close
                </Button>
              </div>

              {filterForm(true)}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


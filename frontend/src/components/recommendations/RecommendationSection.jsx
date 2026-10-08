import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import apiClient from '../../api/client.js';
import { motionVariants } from '../../design-system/motion.js';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  MatchScore,
  SkillChip,
} from '../ui/index.js';
import RecommendationActions from './RecommendationActions.jsx';
import { useRealtime } from '../../socket/RealtimeProvider.jsx';
import { SOCKET_EVENTS } from '../../socket/events.js';

function formatSalary(salary) {
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

  const money = (amount) => (
    new Intl.NumberFormat(
      undefined,
      {
        maximumFractionDigits: 0,
      },
    ).format(amount)
  );

  const range =
    salary.minimum != null
    && salary.maximum != null
      ? `${money(salary.minimum)}–${money(salary.maximum)}`
      : salary.minimum != null
        ? `From ${money(salary.minimum)}`
        : `Up to ${money(salary.maximum)}`;

  return `${
    salary.currency
      ? `${salary.currency} `
      : ''
  }${range}${
    salary.period
      ? ` / ${salary.period}`
      : ''
  }`;
}

function formatLocation(location = {}) {
  const place = [
    location.city,
    location.region,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  return place
    || (
      location.remoteType === 'remote'
        ? 'Remote'
        : 'Location not specified'
    );
}

function RecommendationCard({
  recommendation,
  onActionChange,
  reduceMotion,
}) {
  const { job } = recommendation;

  const missing = [
    ...(recommendation.missingRequiredSkills || []),
    ...(recommendation.missingPreferredSkills || []),
  ];

  const isExternal = Boolean(
    job?.isExternal
    || job?.source === 'external',
  );

  const companyName =
    job.company?.name
    || job.companyName
    || 'Company';

  const providerName = job.provider
    ? job.provider.charAt(0).toUpperCase()
      + job.provider.slice(1)
    : 'External source';

  return (
    <motion.div
      layout={!reduceMotion}
      variants={
        reduceMotion
          ? undefined
          : motionVariants.item
      }
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
            }
      }
      transition={{
        duration: 0.18,
      }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden border-white/20 bg-white/[0.055] p-5 shadow-[0_20px_60px_-32px_rgba(34,211,238,0.32)] transition-all duration-300 hover:border-white/30 hover:bg-white/[0.075] hover:shadow-[0_25px_75px_-30px_rgba(34,211,238,0.4)] sm:p-6">
        {/* Top glass highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
        />

        {/* Cyan glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/[0.075] blur-3xl transition-opacity duration-300 group-hover:bg-cyan-400/[0.11]"
        />

        {/* Bottom blue glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/3 h-48 w-48 rounded-full bg-blue-500/[0.045] blur-3xl"
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar
                name={companyName}
                src={job.company?.logoUrl}
                size="lg"
                className="rounded-xl border border-white/20 bg-white/[0.10] shadow-lg shadow-black/20"
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 top-0 h-px bg-white/40"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-slate-300">
                  {companyName}
                </p>

                {isExternal && (
                  <Badge
                    tone="info"
                    dot
                  >
                    External · {providerName}
                  </Badge>
                )}
              </div>

              <h3 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-6 tracking-tight text-white">
                {job.title}
              </h3>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
                <span
                  aria-hidden="true"
                  className="text-cyan-300"
                >
                  ⌖
                </span>

                <span className="truncate">
                  {formatLocation(job.location)}
                </span>
              </p>
            </div>

            {/* Match score */}
            <div className="relative shrink-0 rounded-2xl border border-white/15 bg-white/[0.055] p-2 backdrop-blur-xl">
              <MatchScore
                score={recommendation.overallScore}
                size="md"
              />
            </div>
          </div>

          {/* Match label */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <Badge
              tone="navy"
              className="border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100"
            >
              {recommendation.matchStrength} match
            </Badge>

            <span className="text-xs font-medium text-slate-500">
              Profile match
            </span>
          </div>

          {/* Job metadata */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {job.employmentType && (
              <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Employment
                </p>

                <p className="mt-0.5 truncate text-xs font-medium capitalize text-slate-200">
                  {job.employmentType.replace('-', ' ')}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Compensation
              </p>

              <p className="mt-0.5 truncate text-xs font-medium text-cyan-100">
                {formatSalary(job.salary)}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-3.5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Match explanation
            </p>

            <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-300">
              {recommendation.explanation}
            </p>
          </div>

          {/* Skills */}
          <div className="mt-5 space-y-4">
            <SkillList
              label="Matched skills"
              skills={recommendation.matchedSkills || []}
              empty="No matching skills identified yet."
              tone="success"
            />

            <SkillList
              label="Skills to build"
              skills={missing}
              empty="No listed skills are missing."
              tone="warning"
            />
          </div>

          {/* Footer */}
          <div className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to={`/candidate/jobs/${job._id}/match`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.035] px-3.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-400/[0.06] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
            >
              View match details
              <span
                aria-hidden="true"
                className="ml-1.5 text-cyan-300"
              >
                →
              </span>
            </Link>

            <RecommendationActions
              jobId={job._id}
              isSaved={recommendation.isSaved}
              hasApplied={recommendation.hasApplied}
              isExternal={isExternal}
              onChange={(changes) =>
                onActionChange(job._id, changes)
              }
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SkillList({
  label,
  skills,
  empty,
  tone = 'success',
}) {
  const toneStyles = {
    success: {
      label: 'text-emerald-200',
      dot: 'bg-emerald-300',
    },
    warning: {
      label: 'text-amber-200',
      dot: 'bg-amber-300',
    },
  };

  const styles =
    toneStyles[tone] || toneStyles.success;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${styles.dot} shadow-[0_0_8px_currentColor]`}
        />

        <p
          className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}
        >
          {label}
        </p>
      </div>

      {skills.length ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {skills
            .slice(0, 8)
            .map((skill) => (
              <SkillChip key={skill}>
                {skill}
              </SkillChip>
            ))}
        </div>
      ) : (
        <p className="mt-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-slate-500">
          {empty}
        </p>
      )}
    </div>
  );
}

export default function RecommendationSection() {
  const [recommendations, setRecommendations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [cardVersions, setCardVersions] =
    useState({});

  const recommendationsRef =
    useRef([]);

  const reduceMotion =
    useReducedMotion();

  const {
    connectionStatus,
    reconnectedAt,
    subscribe,
  } = useRealtime();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } =
        await apiClient.get(
          '/candidate/recommendations',
        );

      recommendationsRef.current =
        data.recommendations;

      setRecommendations(
        data.recommendations,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message
          || 'Recommendations could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (reconnectedAt > 0) {
      load();
    }
  }, [load, reconnectedAt]);

  useEffect(
    () => subscribe(
      SOCKET_EVENTS.RECOMMENDATIONS_UPDATED,
      (event) => {
        const next =
          event.recommendations ?? [];

        const previousById =
          new Map(
            recommendationsRef.current.map(
              (item) => [
                item.job._id,
                item,
              ],
            ),
          );

        setCardVersions((current) => {
          const versions = {
            ...current,
          };

          for (const item of next) {
            const previous =
              previousById.get(
                item.job._id,
              );

            const changed =
              !previous
              || previous.overallScore
                !== item.overallScore
              || JSON.stringify(
                previous.categoryScores,
              )
                !== JSON.stringify(
                  item.categoryScores,
                )
              || JSON.stringify(
                previous.matchedSkills,
              )
                !== JSON.stringify(
                  item.matchedSkills,
                )
              || JSON.stringify(
                previous.missingRequiredSkills,
              )
                !== JSON.stringify(
                  item.missingRequiredSkills,
                )
              || JSON.stringify(
                previous.missingPreferredSkills,
              )
                !== JSON.stringify(
                  item.missingPreferredSkills,
                );

            if (changed) {
              versions[item.job._id] =
                (versions[item.job._id] ?? 0)
                + 1;
            }
          }

          return versions;
        });

        recommendationsRef.current =
          next;

        setRecommendations(next);
        setError('');
        setLoading(false);
      },
    ),
    [subscribe],
  );

  function updateAction(jobId, changes) {
    const updated =
      recommendationsRef.current.map(
        (recommendation) => (
          recommendation.job._id === jobId
            ? {
                ...recommendation,
                ...changes,
              }
            : recommendation
        ),
      );

    recommendationsRef.current =
      updated;

    setRecommendations(updated);
  }

  return (
    <section
      aria-labelledby="recommendations-heading"
      className="mx-auto mt-8 max-w-6xl"
    >
      {/* Section heading */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/[0.05] px-3 py-1.5 backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]"
            />

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Matched to your profile
            </p>
          </div>

          <h2
            id="recommendations-heading"
            className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Recommended for you
          </h2>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
            Ranked using your skills, experience, education,
            projects and location.
          </p>

          <p
            className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500"
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                  : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
              }`}
            />

            {connectionStatus === 'connected'
              ? 'Live updates connected'
              : 'Live updates reconnecting; recommendations remain available'}
          </p>
        </div>

        <Link
          to="/jobs"
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.07] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
        >
          Explore all jobs
          <span
            aria-hidden="true"
            className="ml-1.5 text-cyan-300"
          >
            →
          </span>
        </Link>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/15 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6"
            >
              <LoadingSkeleton
                className="h-80 border border-white/10 bg-white/[0.035]"
                rounded="rounded-xl"
              />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-white/15 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6">
          <ErrorState
            title="Recommendations unavailable"
            description={error}
            onRetry={load}
          />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-8">
          <EmptyState
            title="No active recommendations yet"
            description="Published roles will appear here when they match your profile. Add skills and preferences to improve your match."
            action={(
              <Link
                to="/candidate/profile"
                className="inline-flex min-h-11 items-center rounded-xl border border-white/20 bg-white/[0.07] px-4 text-sm font-semibold text-white backdrop-blur-md transition hover:border-cyan-300/30 hover:bg-cyan-400/[0.08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
              >
                Review your profile
              </Link>
            )}
          />
        </div>
      ) : (
        <motion.div
          variants={motionVariants.stagger}
          initial={
            reduceMotion
              ? false
              : 'initial'
          }
          animate="animate"
          className="grid gap-5 md:grid-cols-2"
        >
          {recommendations.map(
            (recommendation) => (
              <RecommendationCard
                key={`${recommendation.job._id}:${
                  cardVersions[
                    recommendation.job._id
                  ] ?? 0
                }`}
                recommendation={
                  recommendation
                }
                onActionChange={
                  updateAction
                }
                reduceMotion={
                  reduceMotion
                }
              />
            ),
          )}
        </motion.div>
      )}
    </section>
  );
}
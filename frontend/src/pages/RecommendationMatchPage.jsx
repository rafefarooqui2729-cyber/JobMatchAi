import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../api/client.js';
import RecommendationActions from '../components/recommendations/RecommendationActions.jsx';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  MatchScore,
  Navbar,
  SkillChip,
} from '../components/ui/index.js';

const categories = [
  ['skills', 'Skills'],
  ['experience', 'Experience'],
  ['education', 'Education'],
  ['projects', 'Projects'],
  ['location', 'Location'],
];

export default function RecommendationMatchPage() {
  const { jobId } = useParams();

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.get(
        `/candidate/recommendations/${jobId}`,
      );

      setRecommendation(data.recommendation);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message
          || 'Match details could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  function updateAction(changes) {
    setRecommendation((current) => ({
      ...current,
      ...changes,
    }));
  }

  const job = recommendation?.job;

  const isExternal = Boolean(
    job?.isExternal || job?.source === 'external',
  );

  const companyName =
    job?.company?.name
    || job?.companyName
    || 'Company';

  const providerName = job?.provider
    ? job.provider.charAt(0).toUpperCase()
      + job.provider.slice(1)
    : 'External source';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">

      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[2%] top-24 -z-0 h-80 w-80 rounded-full bg-cyan-400/[0.055] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[-4rem] top-[34%] -z-0 h-[26rem] w-[26rem] rounded-full bg-blue-500/[0.05] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-5rem] left-[30%] -z-0 h-80 w-80 rounded-full bg-cyan-300/[0.025] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-0 -z-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent"
      />

      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <Navbar
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
            label: 'Candidate profile',
            to: '/candidate/profile',
          },
        ]}
        actions={(
          <Link
            to="/candidate/dashboard"
            className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-semibold text-slate-300 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.08] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15 sm:block"
          >
            Dashboard
          </Link>
        )}
      />

      {/* =========================================================
          MAIN
      ========================================================= */}

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">

        {/* Back */}

        <Link
          to="/candidate/dashboard"
          className="mb-5 inline-flex min-h-9 items-center rounded-lg px-2 py-1 text-sm font-semibold text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
        >
          ← Back to recommendations
        </Link>

        {/* =======================================================
            LOADING
        ======================================================= */}

        {loading ? (
          <div className="space-y-5">
            <GlassLoadingCard height="h-56" />
            <GlassLoadingCard height="h-80" />
            <GlassLoadingCard height="h-72" />
          </div>
        ) : error ? (

          /* =====================================================
             ERROR
          ===================================================== */

          <GlassStateCard>
            <ErrorState
              title="Match details unavailable"
              description={error}
              onRetry={load}
            />
          </GlassStateCard>

        ) : recommendation ? (

          <div className="space-y-5">

            {/* ===================================================
                MAIN MATCH OVERVIEW
            =================================================== */}

            <Card
              className="
                group
                relative
                overflow-hidden
                border-white/20
                bg-white/[0.065]
                p-5
                shadow-[0_28px_90px_-42px_rgba(34,211,238,0.32)]
                backdrop-blur-2xl
                sm:p-8
              "
            >

              {/* Top highlight */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[12%] top-px h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"
              />

              {/* Cyan glow */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-cyan-400/[0.09] blur-3xl transition-all duration-500 group-hover:bg-cyan-400/[0.12]"
              />

              {/* Blue glow */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/[0.05] blur-3xl"
              />

              <div className="relative z-10">

                <div className="flex flex-col gap-7">

                  {/* =================================================
                      JOB IDENTITY + SCORE
                  ================================================= */}

                  <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                    {/* =================================================
                        COMPANY + JOB
                    ================================================= */}

                    <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">

                      {/* =================================================
                          CLEAR COMPANY LOGO
                      ================================================= */}

                      <div className="relative shrink-0">

                        <div
                          className="
                            flex
                            h-24
                            w-24
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-2xl
                            border
                            border-white/40
                            bg-white
                            p-2
                            shadow-[0_18px_45px_-18px_rgba(0,0,0,0.85)]
                          "
                        >
                          <Avatar
                            name={companyName}
                            src={job?.company?.logoUrl}
                            size="xl"
                            className="h-full w-full rounded-xl border-0 bg-white object-contain"
                          />
                        </div>

                        {/* Logo glass highlight */}

                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white"
                        />

                        {/* Outer glass ring */}

                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -inset-2 rounded-[1.35rem] border border-white/[0.07]"
                        />

                      </div>

                      {/* =================================================
                          JOB INFORMATION
                      ================================================= */}

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="text-sm font-medium text-slate-400">
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

                        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                          {job.title}
                        </h1>

                        <div className="mt-4 flex flex-wrap items-center gap-2">

                          <Badge
                            tone="navy"
                            className="border-cyan-300/20 bg-cyan-300/[0.09] text-cyan-200"
                          >
                            {recommendation.matchStrength} match
                          </Badge>

                          {job?.location?.city && (
                            <Badge>
                              {job.location.city}
                            </Badge>
                          )}

                          {job?.location?.remoteType === 'remote' && (
                            <Badge tone="success" dot>
                              Remote
                            </Badge>
                          )}

                        </div>

                      </div>

                    </div>

                    {/* =================================================
                        WHY THIS MATCH / SCORE
                    ================================================= */}

                    <div
                      className="
                        relative
                        flex
                        w-full
                        items-center
                        gap-5
                        overflow-hidden
                        rounded-2xl
                        border
                        border-white/25
                        bg-white/[0.095]
                        p-5
                        shadow-[0_18px_55px_-30px_rgba(34,211,238,0.45)]
                        backdrop-blur-2xl
                        lg:min-h-[190px]
                        lg:max-w-md
                      "
                    >

                      {/* Glass highlight */}

                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
                      />

                      {/* Cyan glow */}

                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/[0.10] blur-2xl"
                      />

                      {/* =================================================
                          LARGE SCORE
                      ================================================= */}

                      <div className="relative z-10 flex shrink-0 items-center justify-center">

                        <div
                          className="
                            flex
                            h-32
                            w-32
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-white/25
                            bg-white/[0.075]
                            p-2
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_35px_-18px_rgba(34,211,238,0.65)]
                            backdrop-blur-xl
                          "
                        >
                          <MatchScore
                            score={recommendation.overallScore}
                            size="lg"
                          />
                        </div>

                      </div>

                      {/* =================================================
                          SCORE EXPLANATION
                      ================================================= */}

                      <div className="relative z-10 min-w-0">

                        <p className="text-base font-semibold text-white">
                          Why this match
                        </p>

                        <p className="mt-1.5 text-sm leading-6 text-slate-300">
                          {recommendation.explanation}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      EXTERNAL JOB NOTICE
                  ================================================= */}

                  {isExternal && (
                    <div className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.055] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">

                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent"
                      />

                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-cyan-300 to-blue-500"
                      />

                      <div className="flex gap-3 pl-2">

                        <span
                          aria-hidden="true"
                          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/[0.08] text-cyan-300 shadow-[0_0_20px_-10px_rgba(34,211,238,0.8)]"
                        >
                          ↗
                        </span>

                        <div>

                          <p className="text-sm font-semibold text-cyan-100">
                            External job listing
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            This position is provided by an external job
                            platform. Your application will be completed on{' '}
                            <span className="font-semibold text-cyan-100">
                              {providerName}
                            </span>
                            .
                          </p>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="border-t border-white/10 pt-5">

                    <RecommendationActions
                      jobId={job._id}
                      isSaved={recommendation.isSaved}
                      hasApplied={recommendation.hasApplied}
                      isExternal={isExternal}
                      onChange={updateAction}
                    />

                  </div>

                </div>

              </div>
            </Card>

            {/* =====================================================
                SCORE BREAKDOWN
            ===================================================== */}

            <Card
              className="
                relative
                overflow-hidden
                border-white/20
                bg-white/[0.055]
                p-5
                shadow-[0_24px_75px_-40px_rgba(59,130,246,0.28)]
                backdrop-blur-2xl
                sm:p-8
              "
            >

              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-blue-500/[0.05] blur-3xl"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />

              <div className="relative z-10">

                <div>

                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    Score breakdown
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    See how each part of your profile contributes to this
                    match.
                  </p>

                </div>

                <div className="mt-7 space-y-6">

                  {categories.map(([key, label]) => {
                    const score =
                      recommendation.categoryScores?.[key] ?? 0;

                    return (
                      <div key={key}>

                        <div className="mb-2.5 flex items-center justify-between gap-4 text-sm">

                          <span className="font-medium text-slate-300">
                            {label}
                          </span>

                          <span className="font-semibold tabular-nums text-cyan-100">
                            {score}%
                          </span>

                        </div>

                        <div
                          role="progressbar"
                          aria-label={`${label} match`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={score}
                          className="relative h-2.5 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.065]"
                        >

                          <div
                            className="relative h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_-4px_rgba(34,211,238,0.85)] transition-[width] duration-700 motion-reduce:transition-none"
                            style={{
                              width: `${Math.min(
                                Math.max(score, 0),
                                100,
                              )}%`,
                            }}
                          />

                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40"
                          />

                        </div>

                      </div>
                    );
                  })}

                </div>

              </div>
            </Card>

            {/* =====================================================
                SKILLS ANALYSIS
            ===================================================== */}

            <Card
              className="
                relative
                overflow-hidden
                border-white/20
                bg-white/[0.055]
                p-5
                shadow-[0_24px_75px_-40px_rgba(34,211,238,0.25)]
                backdrop-blur-2xl
                sm:p-8
              "
            >

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-500/[0.045] blur-3xl"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />

              <div className="relative z-10">

                <div className="mb-7">

                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    Skills analysis
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                    Understand which skills are helping your match and which
                    ones could improve it.
                  </p>

                </div>

                <div className="grid gap-4 lg:grid-cols-3">

                  <SkillSection
                    title="Matched skills"
                    description="Skills already represented in your profile."
                    skills={recommendation.matchedSkills}
                    empty="No required or preferred skills matched yet."
                    tone="success"
                  />

                  <SkillSection
                    title="Missing required skills"
                    description="Important skills currently missing from your profile."
                    skills={recommendation.missingRequiredSkills}
                    empty="All listed required skills are represented in your profile."
                    tone="danger"
                  />

                  <SkillSection
                    title="Missing preferred skills"
                    description="Optional skills that could strengthen your match."
                    skills={recommendation.missingPreferredSkills}
                    empty="No preferred skills are missing."
                    tone="warning"
                  />

                </div>

              </div>
            </Card>

          </div>

        ) : (

          /* =======================================================
             EMPTY
          ======================================================= */

          <GlassStateCard>
            <EmptyState
              title="Match details are unavailable"
              description="This role may no longer be accepting applications."
            />
          </GlassStateCard>

        )}

      </main>
    </div>
  );
}


/* ===============================================================
   SKILL SECTION
================================================================ */

function SkillSection({
  title,
  description,
  skills,
  empty,
  tone = 'success',
}) {
  const toneStyles = {
    success: {
      container: 'border-emerald-300/15 bg-emerald-300/[0.035]',
      icon: 'border-emerald-300/20 bg-emerald-400/[0.09] text-emerald-300',
      heading: 'text-emerald-200',
    },

    danger: {
      container: 'border-rose-300/15 bg-rose-300/[0.035]',
      icon: 'border-rose-300/20 bg-rose-400/[0.09] text-rose-300',
      heading: 'text-rose-200',
    },

    warning: {
      container: 'border-amber-300/15 bg-amber-300/[0.035]',
      icon: 'border-amber-300/20 bg-amber-400/[0.09] text-amber-300',
      heading: 'text-amber-200',
    },
  };

  const styles =
    toneStyles[tone] || toneStyles.success;

  return (
    <section
      className={[
        'relative',
        'overflow-hidden',
        'rounded-2xl',
        'border',
        'p-4',
        'backdrop-blur-xl',
        styles.container,
      ].join(' ')}
    >

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.09]"
      />

      <div className="relative z-10">

        <div className="flex items-start gap-3">

          <span
            aria-hidden="true"
            className={[
              'grid',
              'h-8',
              'w-8',
              'shrink-0',
              'place-items-center',
              'rounded-lg',
              'border',
              'text-sm',
              'font-semibold',
              styles.icon,
            ].join(' ')}
          >
            {tone === 'success'
              ? '✓'
              : tone === 'danger'
                ? '!'
                : '+'}
          </span>

          <div className="min-w-0">

            <h2
              className={`text-sm font-semibold ${styles.heading}`}
            >
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>

          </div>

        </div>

        {skills?.length ? (

          <div className="mt-4 flex flex-wrap gap-2">

            {skills.map((skill) => (
              <SkillChip key={skill}>
                {skill}
              </SkillChip>
            ))}

          </div>

        ) : (

          <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm leading-6 text-slate-500">
            {empty}
          </p>

        )}

      </div>
    </section>
  );
}


/* ===============================================================
   GLASS LOADING CARD
================================================================ */

function GlassLoadingCard({ height }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.045] p-5 shadow-[0_20px_60px_-35px_rgba(34,211,238,0.2)] backdrop-blur-2xl sm:p-8">

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
      />

      <LoadingSkeleton
        className={`${height} border border-white/10 bg-white/[0.035]`}
        rounded="rounded-2xl"
      />

    </div>
  );
}


/* ===============================================================
   GLASS STATE CARD
================================================================ */

function GlassStateCard({ children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.045] p-5 shadow-[0_20px_60px_-35px_rgba(34,211,238,0.2)] backdrop-blur-2xl sm:p-8">

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />

      <div className="relative z-10">
        {children}
      </div>

    </div>
  );
}
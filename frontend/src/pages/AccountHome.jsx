import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button, Card, Navbar } from '../components/ui/index.js';
import { useToast } from '../components/ui/Toast.jsx';
import RecommendationSection from '../components/recommendations/RecommendationSection.jsx';

export default function AccountHome() {
  const { user, logout } = useAuth();
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
        'We could not sign you out. Check your connection and try again.',
        { tone: 'error' },
      );

      setSigningOut(false);
    }
  }

  const isCandidate = user.role === 'candidate';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">

      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[3%] top-24 -z-0 h-80 w-80 rounded-full bg-cyan-400/[0.055] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[0%] top-[38%] -z-0 h-[26rem] w-[26rem] rounded-full bg-blue-500/[0.05] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-5rem] left-[32%] -z-0 h-96 w-96 rounded-full bg-cyan-300/[0.025] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-0 -z-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent"
      />

      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <Navbar
        brandHref={
          isCandidate
            ? '/candidate/dashboard'
            : '/admin/dashboard'
        }
        mobileMenuItems={
          isCandidate
            ? [
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
                  label: 'Candidate profile',
                  to: '/candidate/profile',
                },
              ]
            : []
        }
        actions={
          <>
            {isCandidate && (
              <>
                <Link
                  to="/jobs"
                  className="hidden rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-medium text-slate-300 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15 sm:block"
                >
                  Explore jobs
                </Link>

                <Link
                  to="/candidate/applications"
                  className="hidden rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-medium text-slate-300 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15 md:block"
                >
                  Applications
                </Link>

                <Link
                  to="/candidate/saved-jobs"
                  className="hidden rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-medium text-slate-300 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15 md:block"
                >
                  Saved jobs
                </Link>

                <Link
                  to="/candidate/notifications"
                  className="hidden rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-medium text-slate-300 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15 md:block"
                >
                  Notifications
                </Link>

                <Link
                  to="/candidate/profile"
                  className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] px-3 py-2 text-sm font-medium text-cyan-100 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-400/[0.10] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
                >
                  Profile
                </Link>
              </>
            )}

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

      {/* =========================================================
          MAIN
      ========================================================= */}

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">

        {isCandidate ? (
          <>
            {/* =====================================================
                HERO
            ===================================================== */}

            <motion.section
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.35,
              }}
              className="group relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/[0.06] shadow-[0_25px_90px_-40px_rgba(34,211,238,0.32)] backdrop-blur-2xl"
            >

              {/* Top white glass highlight */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
              />

              {/* Secondary highlight */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[10%] top-px h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent"
              />

              {/* Cyan ambient glow */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-400/[0.11] blur-3xl transition-all duration-500 group-hover:bg-cyan-400/[0.14]"
              />

              {/* Blue ambient glow */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-36 right-1/4 h-80 w-80 rounded-full bg-blue-600/[0.08] blur-3xl"
              />

              {/* Large glass circle */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.11]"
              />

              {/* Smaller glass circle */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-7 -top-14 h-44 w-44 rounded-full border border-white/[0.10]"
              />

              {/* Inner circle */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-24 top-8 h-20 w-20 rounded-full border border-white/[0.07]"
              />

              {/* Accent light */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-20 top-5 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.95)]"
              />

              {/* Content */}

              <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">

                <div className="max-w-3xl">

                  {/* Label */}

                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/[0.065] px-3.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">

                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.85)]"
                    />

                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                      Candidate workspace
                    </p>

                  </div>

                  {/* Heading */}

                  <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.7rem]">
                    Your next opportunity
                    <span className="text-cyan-300">
                      {' '}starts here.
                    </span>
                  </h1>

                  {/* Description */}

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    See active opportunities ranked against your profile,
                    with clear explanations of the skills and experience
                    behind every match.
                  </p>

                  {/* Actions */}

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                    <Link
                      to="/jobs"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-200/20 bg-gradient-to-r from-cyan-400 to-blue-500 px-5 text-sm font-semibold text-slate-950 shadow-[0_12px_35px_-12px_rgba(34,211,238,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-400 hover:shadow-[0_16px_40px_-12px_rgba(34,211,238,0.85)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
                    >
                      Explore open roles

                      <span
                        aria-hidden="true"
                        className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>

                    <Link
                      to="/candidate/profile"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/[0.055] px-5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/20"
                    >
                      Manage your profile
                    </Link>

                  </div>
                </div>

                {/* Decorative bottom glass strip */}

                <div
                  aria-hidden="true"
                  className="mt-8 h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent sm:mt-10"
                />

              </div>
            </motion.section>

            {/* =====================================================
                RECOMMENDATIONS
            ===================================================== */}

            <div className="mt-8 sm:mt-9">
              <RecommendationSection />
            </div>
          </>
        ) : (

          /* =======================================================
             ADMIN VIEW
          ======================================================= */

          <section className="mx-auto max-w-3xl pt-8 sm:pt-14">

            {/* Label */}

            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/[0.06] px-3.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">

              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]"
              />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Administration
              </p>

            </div>

            {/* Heading */}

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Platform access verified.
            </h1>

            {/* Description */}

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              You’re signed in as an administrator. There are no
              administration tools connected to this workspace yet.
            </p>

            {/* Account glass card */}

            <Card
              className="
                group
                relative
                mt-7
                overflow-hidden
                border-white/20
                bg-white/[0.06]
                p-5
                shadow-[0_25px_70px_-35px_rgba(34,211,238,0.28)]
                backdrop-blur-2xl
                sm:p-7
              "
            >

              {/* Top highlight */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
              />

              {/* Ambient glow */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/[0.07] blur-3xl"
              />

              <div className="relative z-10">

                <div className="flex items-center justify-between gap-4">

                  <h2 className="text-base font-semibold text-white">
                    Account
                  </h2>

                  <span className="rounded-full border border-emerald-300/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                    Active
                  </span>

                </div>

                <p className="mt-3 break-all text-sm text-slate-400">
                  {user.email}
                </p>

                <div className="mt-5 border-t border-white/10 pt-5">

                  <Button
                    variant="secondary"
                    loading={signingOut}
                    onClick={signOut}
                  >
                    Sign out
                  </Button>

                </div>

              </div>
            </Card>

          </section>
        )}
      </main>
    </div>
  );
}
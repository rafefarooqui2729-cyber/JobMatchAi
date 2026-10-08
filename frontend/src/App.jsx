import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';

import AccountHome from './pages/AccountHome.jsx';
import DesignSystemPage from './pages/DesignSystemPage.jsx';
import CandidateProfilePage from './pages/CandidateProfilePage.jsx';
import EmployerDashboardPage from './pages/EmployerDashboardPage.jsx';
import CompanyProfilePage from './pages/CompanyProfilePage.jsx';
import EmployerJobEditorPage from './pages/EmployerJobEditorPage.jsx';
import JobSearchPage from './pages/JobSearchPage.jsx';
import JobDetailsPage from './pages/JobDetailsPage.jsx';
import RecommendationMatchPage from './pages/RecommendationMatchPage.jsx';

const CandidateApplicationDetailsPage = lazy(
  () =>
    import('./pages/CandidateActivityPages.jsx').then(
      (module) => ({
        default:
          module.CandidateApplicationDetailsPage,
      }),
    ),
);

const CandidateApplicationsPage = lazy(
  () =>
    import('./pages/CandidateActivityPages.jsx').then(
      (module) => ({
        default:
          module.CandidateApplicationsPage,
      }),
    ),
);

const CandidateNotificationsPage = lazy(
  () =>
    import('./pages/CandidateActivityPages.jsx').then(
      (module) => ({
        default:
          module.CandidateNotificationsPage,
      }),
    ),
);

const CandidateSavedJobsPage = lazy(
  () =>
    import('./pages/CandidateActivityPages.jsx').then(
      (module) => ({
        default:
          module.CandidateSavedJobsPage,
      }),
    ),
);

const AdminDashboardPage = lazy(
  () =>
    import('./pages/WorkforcePages.jsx').then(
      (module) => ({
        default:
          module.AdminDashboardPage,
      }),
    ),
);

const EmployerApplicationDetailsPage = lazy(
  () =>
    import('./pages/WorkforcePages.jsx').then(
      (module) => ({
        default:
          module.EmployerApplicationDetailsPage,
      }),
    ),
);

const EmployerApplicantsPage = lazy(
  () =>
    import('./pages/WorkforcePages.jsx').then(
      (module) => ({
        default:
          module.EmployerApplicantsPage,
      }),
    ),
);

import {
  LoginPage,
  RegistrationPage,
} from './pages/AuthPage.jsx';

import { ToastProvider } from './components/ui/Toast.jsx';

import {
  AppErrorBoundary,
} from './components/ui/index.js';

import { motionVariants } from './design-system/motion.js';

import { RealtimeProvider } from './socket/RealtimeProvider.jsx';

/* =========================================================
   SHARED GLASS BACKGROUND
========================================================= */

function GlassBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-[-12rem] top-[-14rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/[0.055] blur-3xl" />

      <div className="absolute right-[-14rem] top-[12%] h-[36rem] w-[36rem] rounded-full bg-blue-500/[0.05] blur-3xl" />

      <div className="absolute bottom-[-16rem] left-[28%] h-[34rem] w-[34rem] rounded-full bg-cyan-300/[0.025] blur-3xl" />

      <div className="absolute left-1/2 top-[42%] h-80 w-80 -translate-x-1/2 rounded-full bg-white/[0.015] blur-3xl" />
    </div>
  );
}

/* =========================================================
   GLASS BUTTON LINK
========================================================= */

function GlassLink({
  children,
  to,
  variant = 'secondary',
}) {
  const styles =
    variant === 'primary'
      ? [
          'border-cyan-300/25',
          'bg-gradient-to-r',
          'from-cyan-400/90',
          'to-blue-500/90',
          'text-white',
          'shadow-[0_14px_40px_-16px_rgba(34,211,238,0.65)]',
          'hover:from-cyan-300',
          'hover:to-blue-400',
          'hover:shadow-[0_18px_45px_-14px_rgba(34,211,238,0.75)]',
        ].join(' ')
      : [
          'border-white/[0.12]',
          'bg-white/[0.055]',
          'text-slate-200',
          'hover:border-cyan-300/25',
          'hover:bg-white/[0.09]',
          'hover:text-white',
        ].join(' ');

  return (
    <Link
      to={to}
      className={[
        'inline-flex',
        'min-h-11',
        'items-center',
        'justify-center',
        'rounded-xl',
        'border',
        'px-5',
        'text-sm',
        'font-semibold',
        'backdrop-blur-xl',
        'transition-all',
        'duration-200',
        'hover:-translate-y-0.5',
        'focus-visible:outline-none',
        'focus-visible:ring-4',
        'focus-visible:ring-cyan-400/15',
        styles,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

/* =========================================================
   LANDING PAGE
========================================================= */

function LandingPage() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return (
      <Navigate
        to={`/${user.role}/dashboard`}
        replace
      />
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-canvas px-5 py-8 text-slate-100 sm:px-8 sm:py-12">
      <GlassBackground />

      {/* Additional landing-page glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10rem] top-1/3 h-80 w-80 rounded-full bg-cyan-400/[0.035] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-blue-500/[0.035] blur-3xl"
      />

      <motion.section
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
          ease: 'easeOut',
        }}
        className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
      >
        {/* Hero content */}
        <div>
          <Link
            to="/"
            aria-label="JobMatch AI home"
            className="group inline-flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-blue-500/15 text-sm font-bold tracking-tight text-white shadow-[0_10px_30px_-15px_rgba(34,211,238,0.7)]">
              JM
            </span>

            <span className="text-sm font-semibold tracking-tight text-slate-100">
              JobMatch AI
            </span>
          </Link>

          <div className="mt-14 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/[0.045] px-3 py-1.5 backdrop-blur-xl">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.85)]"
            />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              A clearer path to your next role
            </p>
          </div>

          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.25rem]">
            Find the work that fits{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              you.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Understand how your skills and experience line up
            with real opportunities—with recommendations you
            can actually explain.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <GlassLink
              to="/register/candidate"
              variant="primary"
            >
              Join as a candidate
            </GlassLink>

            <GlassLink to="/jobs">
              Browse open roles
            </GlassLink>

            <GlassLink to="/register/employer">
              Create an employer account
            </GlassLink>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 transition hover:text-cyan-200"
            >
              Sign in
            </Link>

            <span className="mx-2 text-slate-600">
              ·
            </span>

            <Link
              to="/login"
              className="text-slate-400 underline decoration-white/10 underline-offset-4 transition hover:text-slate-200"
            >
              Admin access
            </Link>
          </p>
        </div>

        {/* Glass feature panel */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-cyan-400/[0.08] via-transparent to-blue-500/[0.06] blur-2xl"
          />

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.11] bg-white/[0.045] p-6 shadow-[0_30px_100px_-45px_rgba(34,211,238,0.35)] backdrop-blur-2xl sm:p-8">
            {/* top highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />

            {/* glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/[0.055] blur-3xl"
            />

            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-slate-400 backdrop-blur-xl">
                Intelligent job matching
              </div>

              <p className="mt-5 text-sm font-medium text-slate-300">
                A more considered search
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                Built around your strengths
              </h2>

              <div className="mt-7 rounded-2xl border border-white/[0.09] bg-white/[0.055] p-5 shadow-[0_18px_55px_-35px_rgba(34,211,238,0.45)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/15 to-blue-500/10 text-sm font-semibold text-cyan-100 shadow-[0_8px_25px_-15px_rgba(34,211,238,0.8)]">
                    JM

                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 top-0 h-px bg-white/30"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      Your profile, your direction
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Skills · Experience · Ambition
                    </p>
                  </div>
                </div>

                <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    'Skills',
                    'Experience',
                    'Education',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                    >
                      <p className="text-xs font-medium text-slate-400">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-300">
                  Clear signals. Human-readable reasons.
                  Your next step, made simpler.
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]"
                />

                Transparent by design.
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

/* =========================================================
   404 PAGE
========================================================= */

function NotFoundPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-4 py-10 text-slate-100">
      <GlassBackground />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.035] blur-3xl"
      />

      <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/[0.11] bg-white/[0.045] p-7 text-center shadow-[0_30px_100px_-45px_rgba(34,211,238,0.35)] backdrop-blur-2xl sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-400/[0.045] blur-3xl"
        />

        <div className="relative z-10">
          <Link
            to="/"
            className="mx-auto inline-flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 backdrop-blur-xl transition-all hover:border-white/[0.15] hover:bg-white/[0.065] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/15"
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/[0.12] text-[11px] font-bold text-cyan-100"
            >
              JM
            </span>

            <span className="text-sm font-bold tracking-tight text-white">
              JobMatch AI
            </span>
          </Link>

          <p className="mt-8 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[0.045] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            404 · Page not found
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            This page isn't here.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            The link may be outdated, or the page may have moved.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <GlassLink
              to="/"
              variant="primary"
            >
              Go to home
            </GlassLink>

            <GlassLink to="/jobs">
              Browse roles
            </GlassLink>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   LAZY-LOAD FALLBACK
========================================================= */

function PageLoadingFallback() {
  return (
    <main
      aria-label="Loading page"
      className="relative min-h-screen overflow-hidden bg-canvas p-5 sm:p-8"
    >
      <GlassBackground />

      <div className="relative z-10 mx-auto max-w-6xl space-y-5">
        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.045] p-4 backdrop-blur-2xl">
          <div className="h-12 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.045]" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.045] p-5 backdrop-blur-2xl">
          <div className="h-28 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.035]" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.045] p-5 backdrop-blur-2xl">
            <div className="h-64 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.035]" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.045] p-5 backdrop-blur-2xl">
            <div className="h-64 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.035]" />
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   ROUTED APP
========================================================= */

function RoutedApp() {
  const location = useLocation();

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
    >
      <motion.div
        key={location.pathname}
        variants={motionVariants.page}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
      >
        <Suspense
          fallback={<PageLoadingFallback />}
        >
          <Routes location={location}>
            <Route
              path="/"
              element={<LandingPage />}
            />

            <Route
              path="/design-system"
              element={<DesignSystemPage />}
            />

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/register/:role"
              element={<RegistrationPage />}
            />

            <Route
              path="/jobs"
              element={<JobSearchPage />}
            />

            <Route
              path="/jobs/:jobId"
              element={<JobDetailsPage />}
            />

            {/* Candidate */}
            <Route
              element={
                <ProtectedRoute roles={['candidate']} />
              }
            >
              <Route
                path="/candidate/dashboard"
                element={<AccountHome />}
              />

              <Route
                path="/candidate/profile"
                element={<CandidateProfilePage />}
              />

              <Route
                path="/candidate/jobs/:jobId/match"
                element={<RecommendationMatchPage />}
              />

              <Route
                path="/candidate/applications"
                element={<CandidateApplicationsPage />}
              />

              <Route
                path="/candidate/applications/:applicationId"
                element={
                  <CandidateApplicationDetailsPage />
                }
              />

              <Route
                path="/candidate/saved-jobs"
                element={<CandidateSavedJobsPage />}
              />

              <Route
                path="/candidate/notifications"
                element={<CandidateNotificationsPage />}
              />
            </Route>

            {/* Employer */}
            <Route
              element={
                <ProtectedRoute roles={['employer']} />
              }
            >
              <Route
                path="/employer/dashboard"
                element={<EmployerDashboardPage />}
              />

              <Route
                path="/employer/company"
                element={<CompanyProfilePage />}
              />

              <Route
                path="/employer/jobs/new"
                element={<EmployerJobEditorPage />}
              />

              <Route
                path="/employer/jobs/:jobId/edit"
                element={<EmployerJobEditorPage />}
              />

              <Route
                path="/employer/jobs/:jobId/applications"
                element={<EmployerApplicantsPage />}
              />

              <Route
                path="/employer/applications/:applicationId"
                element={
                  <EmployerApplicationDetailsPage />
                }
              />

              <Route
                path="/employer/notifications"
                element={<CandidateNotificationsPage />}
              />
            </Route>

            {/* Admin */}
            <Route
              element={
                <ProtectedRoute roles={['admin']} />
              }
            >
              <Route
                path="/admin/dashboard"
                element={<AdminDashboardPage />}
              />

              <Route
                path="/admin/notifications"
                element={<CandidateNotificationsPage />}
              />
            </Route>

            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================
   APPLICATION ROOT
========================================================= */

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RealtimeProvider>
          <AppErrorBoundary>
            <RoutedApp />
          </AppErrorBoundary>
        </RealtimeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
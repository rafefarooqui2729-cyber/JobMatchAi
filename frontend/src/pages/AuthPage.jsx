import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { roleHome } from '../auth/ProtectedRoute.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { LoadingSkeleton } from '../components/ui/index.js';

const inputClass = [
  'mt-2 w-full rounded-2xl border',
  'border-white/[0.12]',
  'bg-white/[0.055]',
  'px-4 py-3.5',
  'text-sm font-medium text-white',
  'outline-none',
  'backdrop-blur-2xl',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_30px_rgba(0,0,0,0.10)]',
  'transition-all duration-200',
  'placeholder:text-slate-500',
  'hover:border-white/[0.20]',
  'hover:bg-white/[0.075]',
  'focus:border-cyan-300/45',
  'focus:bg-white/[0.085]',
  'focus:ring-4',
  'focus:ring-cyan-400/10',
].join(' ');

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-400/[0.065] blur-[110px]" />

      <div className="absolute right-[-18rem] top-[10%] h-[38rem] w-[38rem] rounded-full bg-blue-500/[0.055] blur-[120px]" />

      <div className="absolute bottom-[-18rem] left-[25%] h-[34rem] w-[34rem] rounded-full bg-indigo-500/[0.035] blur-[110px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.025),transparent_42%)]" />
    </div>
  );
}

function GlassBrand() {
  return (
    <Link
      to="/"
      className={[
        'group inline-flex w-fit items-center gap-3 rounded-2xl border',
        'border-white/[0.09] bg-white/[0.045]',
        'px-3 py-2',
        'backdrop-blur-2xl',
        'shadow-[0_12px_35px_rgba(0,0,0,0.16)]',
        'transition-all duration-200',
        'hover:-translate-y-0.5',
        'hover:border-white/[0.16]',
        'hover:bg-white/[0.075]',
      ].join(' ')}
    >
      <span
        className={[
          'grid h-11 w-11 place-items-center rounded-2xl border',
          'border-cyan-300/20',
          'bg-gradient-to-br from-cyan-300/[0.18] to-blue-500/[0.10]',
          'text-sm font-bold text-cyan-100',
          'shadow-[0_0_30px_rgba(34,211,238,0.12)]',
        ].join(' ')}
      >
        JM
      </span>

      <span className="text-sm font-semibold tracking-tight text-white">
        JobMatch AI
      </span>
    </Link>
  );
}

function BrandPanel() {
  return (
    <aside
      className={[
        'relative hidden min-h-full overflow-hidden lg:flex',
        'flex-col justify-between',
        'border-r border-white/[0.08]',
        'bg-white/[0.025]',
        'p-10 xl:p-12',
        'backdrop-blur-2xl',
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/[0.08] blur-[90px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-28 h-96 w-96 rounded-full bg-blue-500/[0.07] blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent"
      />

      <div className="relative z-10">
        <GlassBrand />
      </div>

      <div className="relative z-10 max-w-md py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.055] px-3 py-1.5 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />

          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Intelligent matching
          </span>
        </div>

        <h2 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-white xl:text-5xl">
          Make your next move with clarity.
        </h2>

        <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
          Build your profile, discover relevant opportunities, and understand
          why a role matches your experience.
        </p>

        <div className="mt-9 grid gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 backdrop-blur-xl">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
              ✓
            </span>

            <div>
              <p className="text-xs font-semibold text-white">
                Explainable matches
              </p>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Understand your strengths and gaps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 backdrop-blur-xl">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-blue-300/15 bg-blue-300/[0.07] text-blue-200">
              ✦
            </span>

            <div>
              <p className="text-xs font-semibold text-white">
                Focused opportunities
              </p>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Find roles that fit your profile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-xs text-slate-600">
        A better way to understand your fit.
      </p>
    </aside>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required = true,
}) {
  return (
    <label className="block text-sm font-semibold text-slate-200">
      {label}

      <input
        className={inputClass}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        maxLength={name === 'password' ? 72 : undefined}
      />
    </label>
  );
}

function GlassSelect({ children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputClass} appearance-none pr-11`}
      >
        {children}
      </select>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
      >
        ▾
      </span>
    </div>
  );
}

function AuthPage({ mode }) {
  const { role: registrationRole } = useParams();
  const isRegistration = mode === 'register';

  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = isRegistration ? registrationRole : undefined;

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#020817] px-4 py-8">
        <AmbientBackground />

        <div
          role="status"
          aria-label="Loading your account"
          className={[
            'relative z-10 w-full max-w-6xl overflow-hidden rounded-[2rem]',
            'border border-white/[0.10]',
            'bg-white/[0.035]',
            'p-6 sm:p-10',
            'shadow-[0_30px_100px_rgba(0,0,0,0.35)]',
            'backdrop-blur-2xl',
          ].join(' ')}
        >
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <LoadingSkeleton
              className="hidden h-[30rem] lg:block"
              rounded="rounded-3xl"
            />

            <div className="mx-auto w-full max-w-md space-y-5 py-8">
              <LoadingSkeleton className="h-10 w-40" />
              <LoadingSkeleton className="mt-10 h-4 w-36" />
              <LoadingSkeleton className="h-10 w-3/4" />
              <LoadingSkeleton className="h-5 w-full" />
              <LoadingSkeleton className="mt-8 h-14 w-full" />
              <LoadingSkeleton className="h-14 w-full" />
              <LoadingSkeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  async function submit(event) {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const fields = Object.fromEntries(formData.entries());

    try {
      let authenticatedUser;

      if (isRegistration) {
        authenticatedUser = await register(role, fields);
      } else {
        const selectedRole = fields.role;

        delete fields.role;

        authenticatedUser = await login(selectedRole, fields);
      }

      navigate(roleHome(authenticatedUser.role), {
        replace: true,
      });
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 409) {
        setError(
          'An account with this email already exists. Try signing in.',
        );
      } else if (status === 401) {
        setError(
          'Those credentials could not be verified. Check your details and try again.',
        );
      } else if (status === 429) {
        setError(
          'Too many attempts. Please wait a little and try again.',
        );
      } else {
        setError(
          requestError.response?.data?.error?.message ||
            'We could not complete that request. Please try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] px-4 py-5 sm:px-8 sm:py-8">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: 'easeOut',
        }}
        className={[
          'relative z-10 mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl',
          'overflow-hidden rounded-[2rem]',
          'border border-white/[0.11]',
          'bg-white/[0.035]',
          'shadow-[0_35px_120px_rgba(0,0,0,0.42)]',
          'backdrop-blur-3xl',
          'lg:grid-cols-[0.88fr_1.12fr]',
        ].join(' ')}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 z-30 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />

        <BrandPanel />

        <section className="relative flex items-center justify-center overflow-hidden px-5 py-10 sm:px-10 sm:py-12 lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-400/[0.035] blur-[80px]"
          />

          <div className="relative z-10 w-full max-w-md">
            <div className="lg:hidden">
              <GlassBrand />
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-300/[0.055] px-3 py-1.5 backdrop-blur-xl">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  {isRegistration
                    ? 'Create your account'
                    : 'Welcome back'}
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                {isRegistration
                  ? role === 'employer'
                    ? 'Join as an employer'
                    : 'Start with your profile'
                  : 'Sign in to JobMatch'}
              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                {isRegistration
                  ? 'Set up your secure account to get started.'
                  : 'Access your account and continue where you left off.'}
              </p>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={submit}
            >
              {isRegistration && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="First name"
                    name="firstName"
                    autoComplete="given-name"
                  />

                  <Field
                    label="Last name"
                    name="lastName"
                    autoComplete="family-name"
                  />
                </div>
              )}

              {isRegistration && role === 'employer' && (
                <>
                  <Field
                    label="Company name"
                    name="companyName"
                    autoComplete="organization"
                  />

                  <Field
                    label="Your role"
                    name="jobTitle"
                    autoComplete="organization-title"
                    required={false}
                  />

                  <Field
                    label="Company website"
                    name="companyWebsite"
                    type="url"
                    autoComplete="url"
                    required={false}
                  />

                  <Field
                    label="Industry"
                    name="industry"
                    required={false}
                  />
                </>
              )}

              {!isRegistration && (
                <label className="block text-sm font-semibold text-slate-200">
                  Account type

                  <GlassSelect
                    name="role"
                    defaultValue="candidate"
                  >
                    <option value="candidate">
                      Candidate
                    </option>

                    <option value="employer">
                      Employer
                    </option>

                    <option value="admin">
                      Administrator
                    </option>
                  </GlassSelect>
                </label>
              )}

              <Field
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
              />

              <div>
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete={
                    isRegistration
                      ? 'new-password'
                      : 'current-password'
                  }
                />

                {isRegistration && (
                  <p className="mt-2 text-xs text-slate-500">
                    At least 8 characters.
                  </p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className={[
                    'relative overflow-hidden rounded-2xl border',
                    'border-rose-300/20',
                    'bg-rose-400/[0.07]',
                    'px-4 py-3.5',
                    'text-sm leading-6 text-rose-200',
                    'backdrop-blur-2xl',
                    'shadow-[0_10px_30px_rgba(244,63,94,0.06)]',
                  ].join(' ')}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/25 to-transparent"
                  />

                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={[
                  'group relative w-full overflow-hidden rounded-2xl border',
                  'border-cyan-300/25',
                  'bg-gradient-to-r from-cyan-400/[0.18] via-blue-500/[0.18] to-cyan-400/[0.14]',
                  'px-5 py-3.5',
                  'text-sm font-semibold text-white',
                  'backdrop-blur-2xl',
                  'shadow-[0_12px_35px_rgba(6,182,212,0.12),inset_0_1px_0_rgba(255,255,255,0.10)]',
                  'transition-all duration-200',
                  'hover:-translate-y-0.5',
                  'hover:border-cyan-200/40',
                  'hover:bg-gradient-to-r',
                  'hover:from-cyan-400/[0.24]',
                  'hover:via-blue-500/[0.24]',
                  'hover:to-cyan-400/[0.20]',
                  'hover:shadow-[0_18px_40px_rgba(6,182,212,0.18)]',
                  'focus:outline-none',
                  'focus:ring-4',
                  'focus:ring-cyan-400/15',
                  'disabled:cursor-wait',
                  'disabled:opacity-60',
                  'disabled:hover:translate-y-0',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"
                />

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-20 top-0 h-full w-20 skew-x-[-20deg] bg-white/[0.10] blur-md transition-transform duration-700 group-hover:translate-x-[32rem]"
                />

                <span className="relative">
                  {submitting
                    ? 'Please wait…'
                    : isRegistration
                      ? 'Create account'
                      : 'Sign in'}
                </span>
              </button>
            </form>

            <div className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5 text-center backdrop-blur-xl">
              <p className="text-sm text-slate-500">
                {isRegistration
                  ? 'Already have an account?'
                  : 'New to JobMatch AI?'}{' '}

                {isRegistration ? (
                  <Link
                    to="/login"
                    className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    Sign in
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register/candidate"
                      className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
                    >
                      Candidate
                    </Link>

                    <span className="mx-1.5 text-slate-700">
                      ·
                    </span>

                    <Link
                      to="/register/employer"
                      className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
                    >
                      Employer
                    </Link>
                  </>
                )}
              </p>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-600">
              Secure account access • JobMatch AI
            </p>
          </div>
        </section>
      </motion.div>
    </main>
  );
}

export function LoginPage() {
  return <AuthPage mode="login" />;
}

export function RegistrationPage() {
  const { role } = useParams();

  if (!['candidate', 'employer'].includes(role)) {
    return <Navigate to="/register/candidate" replace />;
  }

  return <AuthPage mode="register" />;
}
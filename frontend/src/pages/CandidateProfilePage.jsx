import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
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
  PageHeader,
  ProgressBar,
  Select,
  SkillChip,
} from '../components/ui/index.js';
import { useToast } from '../components/ui/Toast.jsx';

const employmentOptions = [
  'full-time',
  'part-time',
  'contract',
  'temporary',
  'internship',
];

const proficiencyOptions = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
];

const educationOptions = [
  { value: 'high-school', label: 'High school' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'associate', label: 'Associate' },
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

const emptyLocation = {
  city: '',
  region: '',
  country: '',
  countryCode: '',
};

const emptyProfile = {
  firstName: '',
  lastName: '',
  phone: '',
  location: emptyLocation,
  headline: '',
  summary: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  preferredRoles: [],
  preferredLocations: [],
  preferredEmploymentTypes: [],
  profileVisibility: 'employers',
};

function dateValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

function editableProfile(profile) {
  return {
    ...emptyProfile,
    ...profile,

    location: {
      ...emptyLocation,
      ...profile.location,
    },

    skills: (profile.skills ?? []).map((skill) => ({
      ...skill,
    })),

    education: (profile.education ?? []).map((item) => ({
      ...item,
      startYear: item.startYear ?? '',
      endYear: item.endYear ?? '',
    })),

    experience: (profile.experience ?? []).map((item) => ({
      ...item,
      startDate: dateValue(item.startDate),
      endDate: dateValue(item.endDate),
      technologies: [...(item.technologies ?? [])],
    })),

    projects: (profile.projects ?? []).map((item) => ({
      ...item,
      technologies: [...(item.technologies ?? [])],
    })),

    certifications: (profile.certifications ?? []).map((item) => ({
      ...item,
      issuedAt: dateValue(item.issuedAt),
    })),

    preferredRoles: [...(profile.preferredRoles ?? [])],

    preferredLocations: (profile.preferredLocations ?? []).map(
      (location) => ({
        ...location,
      }),
    ),

    preferredEmploymentTypes: [
      ...(profile.preferredEmploymentTypes ?? []),
    ],
  };
}

/* =========================================================
   GLASS HELPERS
========================================================= */

const glassInputClasses = [
  'w-full',
  'rounded-xl',
  'border',
  'border-white/10',
  'bg-white/[0.045]',
  'text-white',
  'backdrop-blur-xl',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_12px_35px_-25px_rgba(0,0,0,0.9)]',
  'transition-all',
  'duration-200',
  'hover:border-white/20',
  'focus:border-cyan-300/40',
  'focus:bg-white/[0.07]',
  'focus:ring-4',
  'focus:ring-cyan-300/10',
].join(' ');

function GlassSection({
  children,
  className = '',
  glow = 'cyan',
}) {
  const glowClass =
    glow === 'blue'
      ? 'bg-blue-500/[0.045]'
      : 'bg-cyan-400/[0.04]';

  return (
    <section
      className={[
        'group',
        'relative',
        'overflow-hidden',
        'rounded-3xl',
        'border',
        'border-white/[0.11]',
        'bg-gradient-to-br',
        'from-white/[0.075]',
        'via-white/[0.04]',
        'to-white/[0.018]',
        'shadow-[0_30px_90px_-45px_rgba(0,0,0,0.95)]',
        'backdrop-blur-2xl',
        'transition-all',
        'duration-300',
        'hover:border-white/[0.16]',
        className,
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <span
        aria-hidden="true"
        className={[
          'pointer-events-none',
          'absolute',
          '-right-24',
          '-top-24',
          'h-56',
          'w-56',
          'rounded-full',
          glowClass,
          'blur-3xl',
        ].join(' ')}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent"
      />

      <div className="relative z-10">{children}</div>
    </section>
  );
}

function InnerGlass({
  children,
  className = '',
  hover = true,
}) {
  return (
    <div
      className={[
        'relative',
        'overflow-hidden',
        'rounded-2xl',
        'border',
        'border-white/[0.09]',
        'bg-white/[0.045]',
        'backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_18px_45px_-30px_rgba(0,0,0,0.9)]',
        hover
          ? 'transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.06]'
          : '',
        className,
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* =========================================================
   TEXT AREA
========================================================= */

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  maxLength,
  hint,
}) {
  const id = `profile-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-200"
      >
        {label}
      </label>

      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value ?? ''}
        onChange={onChange}
        className={`${glassInputClasses} resize-y px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-slate-600`}
      />

      {hint && (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  title,
  description,
  action,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]"
          />

          <h2 className="text-base font-semibold tracking-tight text-white">
            {title}
          </h2>
        </div>

        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   FORM HELPERS
========================================================= */

function addItem(setForm, key, item) {
  setForm((current) => ({
    ...current,
    [key]: [...current[key], item],
  }));
}

function updateItem(
  setForm,
  key,
  index,
  field,
  value,
) {
  setForm((current) => ({
    ...current,
    [key]: current[key].map(
      (item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
    ),
  }));
}

function removeItem(setForm, key, index) {
  setForm((current) => ({
    ...current,
    [key]: current[key].filter(
      (_, itemIndex) => itemIndex !== index,
    ),
  }));
}

/* =========================================================
   ARRAY ACTIONS
========================================================= */

function ArrayActions({
  onAdd,
  onRemove,
  label,
}) {
  return (
    <div className="flex items-center gap-2">
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          Remove
        </Button>
      )}

      {onAdd && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAdd}
        >
          Add {label}
        </Button>
      )}
    </div>
  );
}

/* =========================================================
   PROFILE PAGE
========================================================= */

export default function CandidateProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyProfile);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeStage, setResumeStage] = useState('');
  const [resumeReview, setResumeReview] = useState(null);

  const resumeInput = useRef(null);

  const fullName = useMemo(
    () =>
      profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : '',
    [profile],
  );

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [
        profileResponse,
        resumeResponse,
      ] = await Promise.all([
        apiClient.get('/candidate/profile'),
        apiClient.get('/candidate/profile/resume'),
      ]);

      setProfile(profileResponse.data.profile);

      setForm(
        editableProfile(
          profileResponse.data.profile,
        ),
      );

      setResume(resumeResponse.data.resume);
    } catch (error) {
      setLoadError(
        error.response?.data?.error?.message ||
          'Your profile could not be loaded. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* =========================================================
     FIELD UPDATES
  ========================================================= */

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateLocation(field, value) {
    setForm((current) => ({
      ...current,
      location: {
        ...current.location,
        [field]: value,
      },
    }));
  }

  function cancelEditing() {
    setSaveError('');
    setForm(editableProfile(profile));
    setEditing(false);
  }

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  async function saveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setSaveError('');

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      location: form.location,
      headline: form.headline,
      summary: form.summary,

      skills: form.skills.map(
        ({
          name,
          proficiency,
          yearsExperience,
        }) => ({
          name,
          proficiency,
          yearsExperience: Number(
            yearsExperience || 0,
          ),
        }),
      ),

      education: form.education,
      experience: form.experience,
      projects: form.projects,
      certifications: form.certifications,
      preferredRoles: form.preferredRoles,
      preferredLocations:
        form.preferredLocations,
      preferredEmploymentTypes:
        form.preferredEmploymentTypes,
      profileVisibility:
        form.profileVisibility,
    };

    try {
      const { data } = await apiClient.patch(
        '/candidate/profile',
        payload,
      );

      setProfile(data.profile);
      setForm(editableProfile(data.profile));
      setEditing(false);

      toast(
        'Your candidate profile has been saved.',
        {
          tone: 'success',
        },
      );
    } catch (error) {
      setSaveError(
        error.response?.data?.error?.message ||
          'Your changes could not be saved. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     RESUME UPLOAD
  ========================================================= */

  async function uploadResume(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    const acceptedTypes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);

    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (
      !acceptedTypes.has(file.type) ||
      !['pdf', 'docx'].includes(extension)
    ) {
      setResumeError(
        'Choose a PDF or DOCX document with a matching file type.',
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError(
        'Resume must be no larger than 5 MB.',
      );
      return;
    }

    const payload = new FormData();

    payload.append('resume', file);

    setResumeError('');
    setResumeReview(null);
    setResumeProgress(0);
    setResumeStage('Uploading securely…');
    setResumeUploading(true);

    try {
      const { data } = await apiClient.post(
        '/candidate/profile/resume',
        payload,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },

          onUploadProgress(progressEvent) {
            if (!progressEvent.total) return;

            const percent = Math.min(
              100,
              Math.round(
                (progressEvent.loaded /
                  progressEvent.total) *
                  100,
              ),
            );

            setResumeProgress(percent);

            if (percent >= 100) {
              setResumeStage(
                'File received. Extracting text and reviewing profile details…',
              );
            }
          },
        },
      );

      setResume(data.resume);
      setResumeReview(data.parsed);
      setProfile(data.profile);
      setForm(editableProfile(data.profile));

      toast(
        'Resume parsed. Detected details were added without replacing existing profile information.',
        {
          tone: 'success',
        },
      );
    } catch (error) {
      setResumeError(
        error.response?.data?.error?.message ||
          'Resume could not be uploaded and parsed. Please try another file.',
      );
    } finally {
      setResumeUploading(false);
      setResumeStage('');
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-8 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[10%] top-[-10rem] h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-[100px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-10rem] right-[5%] h-80 w-80 rounded-full bg-blue-500/[0.07] blur-[110px]"
        />

        <div className="relative mx-auto max-w-5xl space-y-5">
          <LoadingSkeleton
            className="h-16 w-full border border-white/10 bg-white/[0.04] backdrop-blur-xl"
          />

          <LoadingSkeleton
            className="h-44 w-full border border-white/10 bg-white/[0.04] backdrop-blur-xl"
            rounded="rounded-2xl"
          />

          <LoadingSkeleton
            className="h-72 w-full border border-white/10 bg-white/[0.04] backdrop-blur-xl"
            rounded="rounded-2xl"
          />
        </div>
      </main>
    );
  }

  /* =========================================================
     LOAD ERROR
  ========================================================= */

  if (loadError) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-12 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-12rem] h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/[0.06] blur-[120px]"
        />

        <div className="relative mx-auto max-w-5xl">
          <ErrorState
            title="Profile unavailable"
            description={loadError}
            onRetry={loadProfile}
          />
        </div>
      </main>
    );
  }

  if (!profile) return null;

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-12rem] top-[8rem] z-0 h-96 w-96 rounded-full bg-cyan-400/[0.045] blur-[120px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[-10rem] top-[35%] z-0 h-[30rem] w-[30rem] rounded-full bg-blue-500/[0.04] blur-[130px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-12rem] left-[35%] z-0 h-96 w-96 rounded-full bg-cyan-300/[0.035] blur-[120px]"
      />

      <Navbar
        brandHref="/candidate/dashboard"
        mobileMenuItems={[
          {
            label: 'Workspace',
            to: '/candidate/dashboard',
          },
          {
            label: 'Explore jobs',
            to: '/jobs',
          },
        ]}
        actions={
          <>
            <Link
              to="/candidate/dashboard"
              className={[
                'hidden',
                'rounded-xl',
                'border',
                'border-white/10',
                'bg-white/[0.04]',
                'px-3',
                'py-2',
                'text-sm',
                'font-medium',
                'text-slate-300',
                'backdrop-blur-md',
                'transition-all',
                'duration-200',
                'hover:border-cyan-300/20',
                'hover:bg-white/[0.08]',
                'hover:text-white',
                'sm:block',
              ].join(' ')}
            >
              Workspace
            </Link>

            <Link
              to="/jobs"
              className={[
                'hidden',
                'rounded-xl',
                'border',
                'border-white/10',
                'bg-white/[0.04]',
                'px-3',
                'py-2',
                'text-sm',
                'font-medium',
                'text-slate-300',
                'backdrop-blur-md',
                'transition-all',
                'duration-200',
                'hover:border-cyan-300/20',
                'hover:bg-white/[0.08]',
                'hover:text-white',
                'sm:block',
              ].join(' ')}
            >
              Explore jobs
            </Link>

            <Avatar
              name={fullName}
              size="sm"
            />
          </>
        }
      />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Candidate workspace"
          title="Your profile"
          description="Keep your experience and preferences up to date so your profile reflects where you want to go."
          actions={
            editing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  form="candidate-profile-form"
                  loading={saving}
                >
                  Save changes
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
              >
                Edit profile
              </Button>
            )
          }
        />

        {/* =====================================================
            RESUME
        ===================================================== */}

        <GlassSection className="mt-6 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/[0.16] to-blue-500/[0.08] text-lg text-cyan-200 shadow-[0_8px_25px_-15px_rgba(34,211,238,0.8)]"
                >
                  ↑
                </span>

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Resume
                </p>
              </div>

              <h2 className="mt-3 text-base font-semibold text-white">
                Upload a resume to help complete your profile
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                PDF or DOCX, up to 5 MB. Text extraction is
                rule-based and may miss details; review the
                results before relying on them.
              </p>

              {resume && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Current file:</span>

                  <span className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.05] px-2 py-1 font-medium text-cyan-200">
                    {resume.originalName}
                  </span>

                  <span>·</span>

                  <span>
                    {resume.status === 'processed'
                      ? 'Parsed'
                      : resume.status}
                  </span>

                  {resume.parsedAt && (
                    <>
                      <span>·</span>

                      <span>
                        {new Date(
                          resume.parsedAt,
                        ).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <input
                ref={resumeInput}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={uploadResume}
                disabled={
                  resumeUploading || editing
                }
                className="sr-only"
                aria-label="Choose a PDF or DOCX resume"
              />

              <Button
                variant="secondary"
                disabled={
                  resumeUploading || editing
                }
                loading={resumeUploading}
                onClick={() =>
                  resumeInput.current?.click()
                }
              >
                {resumeUploading
                  ? 'Processing…'
                  : resume
                    ? 'Replace resume'
                    : 'Choose resume'}
              </Button>
            </div>
          </div>

          {editing && (
            <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/[0.05] px-3 py-2.5 backdrop-blur-md">
              <p className="text-xs leading-5 text-amber-200/80">
                Save or cancel profile edits before
                uploading a resume.
              </p>
            </div>
          )}

          {resumeUploading && (
            <InnerGlass
              className="mt-5 p-3"
              hover={false}
            >
              <ProgressBar
                value={resumeProgress}
                label={resumeStage}
                showValue
              />

              <p className="mt-2 text-xs text-slate-500">
                {resumeStage}
              </p>
            </InnerGlass>
          )}

          {resumeError && (
            <ErrorState
              title="Resume upload failed"
              description={resumeError}
              className="mt-4"
            />
          )}

          {resumeReview && (
            <div
              className={[
                'relative',
                'mt-5',
                'overflow-hidden',
                'rounded-2xl',
                'border',
                'border-cyan-300/15',
                'bg-gradient-to-br',
                'from-cyan-400/[0.08]',
                'via-white/[0.035]',
                'to-blue-500/[0.05]',
                'p-4',
                'shadow-[0_20px_60px_-35px_rgba(34,211,238,0.4)]',
                'backdrop-blur-xl',
              ].join(' ')}
              role="status"
              aria-live="polite"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
              />

              <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Parsing complete — review extracted details
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    We detected{' '}
                    {resumeReview.skills.length}{' '}
                    skills,{' '}
                    {resumeReview.education.length}{' '}
                    education records,{' '}
                    {resumeReview.experience.length}{' '}
                    experience records,{' '}
                    {resumeReview.projects.length}{' '}
                    projects, and{' '}
                    {resumeReview.certifications.length}{' '}
                    certifications. Unclear fields were
                    left unchanged.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setEditing(true)
                  }
                >
                  Review profile
                </Button>
              </div>

              <div className="relative z-10 mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                {[
                  'name',
                  'email',
                  'phone',
                ].map((field) => {
                  const detected =
                    resumeReview.fields[field];

                  return (
                    <InnerGlass
                      key={field}
                      className="px-3 py-2"
                      hover={false}
                    >
                      <span className="font-semibold capitalize text-slate-300">
                        {field}
                      </span>

                      <p className="mt-1 truncate text-slate-400">
                        {detected.value ??
                          'not detected'}
                      </p>

                      {detected.value && (
                        <p className="mt-1 text-[11px] text-cyan-300/80">
                          {Math.round(
                            detected.confidence * 100,
                          )}
                          % confidence
                        </p>
                      )}
                    </InnerGlass>
                  );
                })}
              </div>
            </div>
          )}
        </GlassSection>

        {/* =====================================================
            PROFILE COMPLETION
        ===================================================== */}

        <section
          aria-label="Profile completion"
          className="my-6"
        >
          <GlassSection
            className="p-5 sm:p-6"
            glow="blue"
          >
            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-4 sm:w-60">
                <div className="relative shrink-0">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-full bg-cyan-400/10 blur-2xl"
                  />

                  <div className="relative rounded-full border border-white/10 bg-white/[0.05] p-1.5 backdrop-blur-xl">
                    <Avatar
                      name={fullName}
                      size="lg"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-white">
                    {fullName}
                  </h2>

                  <p className="truncate text-sm text-slate-400">
                    {profile.headline ||
                      user.email}
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Profile Strength
                    </p>

                    <p className="text-xs text-slate-500">
                      {profile.completion
                        .strength ||
                        'Getting started'}
                    </p>
                  </div>

                  <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05] px-2.5 py-1 text-sm font-semibold text-cyan-300">
                    {profile.completion
                      .percentage}
                    %
                  </span>
                </div>

                <ProgressBar
                  value={
                    profile.completion
                      .percentage
                  }
                  label="Profile completion"
                  showValue={false}
                />

                {profile.completion
                  .suggestions?.length >
                  0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Next:{' '}
                    {
                      profile.completion
                        .suggestions[0]
                    }
                    .
                  </p>
                )}
              </div>
            </div>
          </GlassSection>
        </section>

        {/* =====================================================
            EDIT MODE
        ===================================================== */}

        {editing ? (
          <form
            id="candidate-profile-form"
            onSubmit={saveProfile}
            className="space-y-5"
          >
            {saveError && (
              <ErrorState
                title="Changes not saved"
                description={saveError}
              />
            )}

            {/* PERSONAL INFORMATION */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Personal information"
                description="The details employers see when your profile is shared."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First name"
                  required
                  value={form.firstName}
                  onChange={(event) =>
                    updateField(
                      'firstName',
                      event.target.value,
                    )
                  }
                  autoComplete="given-name"
                  maxLength={80}
                />

                <Input
                  label="Last name"
                  required
                  value={form.lastName}
                  onChange={(event) =>
                    updateField(
                      'lastName',
                      event.target.value,
                    )
                  }
                  autoComplete="family-name"
                  maxLength={80}
                />

                <Input
                  label="Phone"
                  type="tel"
                  value={form.phone ?? ''}
                  onChange={(event) =>
                    updateField(
                      'phone',
                      event.target.value,
                    )
                  }
                  autoComplete="tel"
                  maxLength={32}
                />

                <Input
                  label="Professional headline"
                  value={form.headline ?? ''}
                  onChange={(event) =>
                    updateField(
                      'headline',
                      event.target.value,
                    )
                  }
                  maxLength={180}
                  placeholder="e.g. Graduate software engineer"
                  className="sm:col-span-2"
                />

                <Input
                  label="City"
                  value={form.location.city ?? ''}
                  onChange={(event) =>
                    updateLocation(
                      'city',
                      event.target.value,
                    )
                  }
                  autoComplete="address-level2"
                />

                <Input
                  label="Region / State"
                  value={form.location.region ?? ''}
                  onChange={(event) =>
                    updateLocation(
                      'region',
                      event.target.value,
                    )
                  }
                  autoComplete="address-level1"
                />

                <Input
                  label="Country"
                  value={form.location.country ?? ''}
                  onChange={(event) =>
                    updateLocation(
                      'country',
                      event.target.value,
                    )
                  }
                  autoComplete="country-name"
                />

                <Input
                  label="Country code"
                  value={
                    form.location.countryCode ?? ''
                  }
                  onChange={(event) =>
                    updateLocation(
                      'countryCode',
                      event.target.value.toUpperCase(),
                    )
                  }
                  maxLength={2}
                  placeholder="e.g. IN"
                />

                <div className="sm:col-span-2">
                  <TextArea
                    label="Professional bio"
                    value={form.summary ?? ''}
                    onChange={(event) =>
                      updateField(
                        'summary',
                        event.target.value,
                      )
                    }
                    maxLength={4000}
                    rows={5}
                    hint="Share a concise overview of your background and goals."
                  />
                </div>
              </div>
            </GlassSection>

            {/* SKILLS */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Skills"
                description="Names are normalized and deduplicated when saved."
                action={
                  <ArrayActions
                    label="skill"
                    onAdd={() =>
                      addItem(
                        setForm,
                        'skills',
                        {
                          name: '',
                          proficiency:
                            'intermediate',
                          yearsExperience: 0,
                        },
                      )
                    }
                  />
                }
              />

              {form.skills.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-sm text-slate-500">
                  No skills added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.skills.map(
                    (skill, index) => (
                      <InnerGlass
                        key={
                          skill._id ??
                          `skill-${index}`
                        }
                        className="p-3"
                      >
                        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_9rem_auto] sm:items-end">
                          <Input
                            label="Skill"
                            required
                            value={
                              skill.name ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'skills',
                                index,
                                'name',
                                event.target.value,
                              )
                            }
                            maxLength={100}
                            placeholder="e.g. JavaScript"
                          />

                          <Select
                            label="Proficiency"
                            value={
                              skill.proficiency ??
                              'intermediate'
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'skills',
                                index,
                                'proficiency',
                                event.target.value,
                              )
                            }
                            options={
                              proficiencyOptions
                            }
                          />

                          <Input
                            label="Years"
                            type="number"
                            min="0"
                            max="80"
                            step="0.5"
                            value={
                              skill.yearsExperience ??
                              0
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'skills',
                                index,
                                'yearsExperience',
                                event.target.value,
                              )
                            }
                          />

                          <ArrayActions
                            label="skill"
                            onRemove={() =>
                              removeItem(
                                setForm,
                                'skills',
                                index,
                              )
                            }
                          />
                        </div>
                      </InnerGlass>
                    ),
                  )}
                </div>
              )}
            </GlassSection>

            {/* EDUCATION */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Education"
                action={
                  <ArrayActions
                    label="education"
                    onAdd={() =>
                      addItem(
                        setForm,
                        'education',
                        {
                          degree: '',
                          institution: '',
                          fieldOfStudy: '',
                          level: 'bachelor',
                          startYear: '',
                          endYear: '',
                          isCurrent: false,
                          description: '',
                        },
                      )
                    }
                  />
                }
              />

              {form.education.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-sm text-slate-500">
                  No education added yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {form.education.map(
                    (item, index) => (
                      <InnerGlass
                        key={
                          item._id ??
                          `education-${index}`
                        }
                        className="p-4"
                      >
                        <div className="mb-3 flex justify-end">
                          <ArrayActions
                            label="education"
                            onRemove={() =>
                              removeItem(
                                setForm,
                                'education',
                                index,
                              )
                            }
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input
                            label="Degree"
                            required
                            value={
                              item.degree ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'education',
                                index,
                                'degree',
                                event.target.value,
                              )
                            }
                            maxLength={160}
                          />

                          <Input
                            label="Institution"
                            required
                            value={
                              item.institution ??
                              ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'education',
                                index,
                                'institution',
                                event.target.value,
                              )
                            }
                            maxLength={200}
                          />

                          <Input
                            label="Field of study"
                            value={
                              item.fieldOfStudy ??
                              ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'education',
                                index,
                                'fieldOfStudy',
                                event.target.value,
                              )
                            }
                            maxLength={160}
                          />

                          <Select
                            label="Education level"
                            required
                            value={
                              item.level ??
                              'bachelor'
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'education',
                                index,
                                'level',
                                event.target.value,
                              )
                            }
                            options={
                              educationOptions
                            }
                          />

                          <Input
                            label="Start year"
                            type="number"
                            min="1950"
                            max={
                              new Date().getFullYear() +
                              10
                            }
                            value={
                              item.startYear ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'education',
                                index,
                                'startYear',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="End year"
                            type="number"
                            min="1950"
                            max={
                              new Date().getFullYear() +
                              10
                            }
                            disabled={item.isCurrent}
                            value={
                              item.isCurrent
                                ? ''
                                : item.endYear ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'education',
                                index,
                                'endYear',
                                event.target.value,
                              )
                            }
                          />

                          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 text-sm text-slate-400 transition-colors hover:border-white/10 hover:bg-white/[0.04] sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                item.isCurrent,
                              )}
                              onChange={(event) =>
                                updateItem(
                                  setForm,
                                  'education',
                                  index,
                                  'isCurrent',
                                  event.target.checked,
                                )
                              }
                              className="h-4 w-4 rounded border-white/20 bg-white/[0.05] accent-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300"
                            />

                            I am currently studying here
                          </label>
                        </div>
                      </InnerGlass>
                    ),
                  )}
                </div>
              )}
            </GlassSection>

            {/* EXPERIENCE */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Experience"
                action={
                  <ArrayActions
                    label="experience"
                    onAdd={() =>
                      addItem(
                        setForm,
                        'experience',
                        {
                          employer: '',
                          title: '',
                          startDate: '',
                          endDate: '',
                          isCurrent: false,
                          description: '',
                          technologies: [],
                        },
                      )
                    }
                  />
                }
              />

              {form.experience.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-sm text-slate-500">
                  No experience added yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {form.experience.map(
                    (item, index) => (
                      <InnerGlass
                        key={
                          item._id ??
                          `experience-${index}`
                        }
                        className="p-4"
                      >
                        <div className="mb-3 flex justify-end">
                          <ArrayActions
                            label="experience"
                            onRemove={() =>
                              removeItem(
                                setForm,
                                'experience',
                                index,
                              )
                            }
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input
                            label="Company"
                            required
                            value={
                              item.employer ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'experience',
                                index,
                                'employer',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="Role"
                            required
                            value={
                              item.title ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'experience',
                                index,
                                'title',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="Start date"
                            required
                            type="date"
                            value={
                              item.startDate ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'experience',
                                index,
                                'startDate',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="End date"
                            type="date"
                            disabled={item.isCurrent}
                            value={
                              item.isCurrent
                                ? ''
                                : item.endDate ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'experience',
                                index,
                                'endDate',
                                event.target.value,
                              )
                            }
                          />

                          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 text-sm text-slate-400 transition-colors hover:border-white/10 hover:bg-white/[0.04] sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                item.isCurrent,
                              )}
                              onChange={(event) =>
                                updateItem(
                                  setForm,
                                  'experience',
                                  index,
                                  'isCurrent',
                                  event.target.checked,
                                )
                              }
                              className="h-4 w-4 rounded border-white/20 bg-white/[0.05] accent-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300"
                            />

                            I currently work here
                          </label>

                          <div className="sm:col-span-2">
                            <TextArea
                              label="Description"
                              value={
                                item.description ??
                                ''
                              }
                              onChange={(event) =>
                                updateItem(
                                  setForm,
                                  'experience',
                                  index,
                                  'description',
                                  event.target.value,
                                )
                              }
                              rows={3}
                              maxLength={4000}
                            />
                          </div>

                          <Input
                            label="Technologies (comma separated)"
                            value={(
                              item.technologies ??
                              []
                            ).join(', ')}
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'experience',
                                index,
                                'technologies',
                                event.target.value
                                  .split(',')
                                  .map(
                                    (entry) =>
                                      entry.trim(),
                                  )
                                  .filter(Boolean),
                              )
                            }
                            className="sm:col-span-2"
                          />
                        </div>
                      </InnerGlass>
                    ),
                  )}
                </div>
              )}
            </GlassSection>

            {/* PROJECTS */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Projects"
                action={
                  <ArrayActions
                    label="project"
                    onAdd={() =>
                      addItem(
                        setForm,
                        'projects',
                        {
                          name: '',
                          description: '',
                          technologies: [],
                          url: '',
                          githubUrl: '',
                        },
                      )
                    }
                  />
                }
              />

              {form.projects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-sm text-slate-500">
                  No projects added yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {form.projects.map(
                    (item, index) => (
                      <InnerGlass
                        key={
                          item._id ??
                          `project-${index}`
                        }
                        className="p-4"
                      >
                        <div className="mb-3 flex justify-end">
                          <ArrayActions
                            label="project"
                            onRemove={() =>
                              removeItem(
                                setForm,
                                'projects',
                                index,
                              )
                            }
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input
                            label="Project title"
                            required
                            value={
                              item.name ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'projects',
                                index,
                                'name',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="Project URL"
                            type="url"
                            value={
                              item.url ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'projects',
                                index,
                                'url',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="GitHub URL"
                            type="url"
                            value={
                              item.githubUrl ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'projects',
                                index,
                                'githubUrl',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="Technologies (comma separated)"
                            value={(
                              item.technologies ??
                              []
                            ).join(', ')}
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'projects',
                                index,
                                'technologies',
                                event.target.value
                                  .split(',')
                                  .map(
                                    (entry) =>
                                      entry.trim(),
                                  )
                                  .filter(Boolean),
                              )
                            }
                          />

                          <div className="sm:col-span-2">
                            <TextArea
                              label="Description"
                              value={
                                item.description ??
                                ''
                              }
                              onChange={(event) =>
                                updateItem(
                                  setForm,
                                  'projects',
                                  index,
                                  'description',
                                  event.target.value,
                                )
                              }
                              rows={3}
                              maxLength={4000}
                            />
                          </div>
                        </div>
                      </InnerGlass>
                    ),
                  )}
                </div>
              )}
            </GlassSection>

            {/* CERTIFICATIONS */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Certifications"
                action={
                  <ArrayActions
                    label="certification"
                    onAdd={() =>
                      addItem(
                        setForm,
                        'certifications',
                        {
                          name: '',
                          issuer: '',
                          issuedAt: '',
                          credentialUrl: '',
                        },
                      )
                    }
                  />
                }
              />

              {form.certifications.length ===
              0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-sm text-slate-500">
                  No certifications added yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {form.certifications.map(
                    (item, index) => (
                      <InnerGlass
                        key={
                          item._id ??
                          `certification-${index}`
                        }
                        className="p-4"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex justify-end sm:col-span-2">
                            <ArrayActions
                              label="certification"
                              onRemove={() =>
                                removeItem(
                                  setForm,
                                  'certifications',
                                  index,
                                )
                              }
                            />
                          </div>

                          <Input
                            label="Certification name"
                            required
                            value={
                              item.name ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'certifications',
                                index,
                                'name',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="Issuer"
                            value={
                              item.issuer ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'certifications',
                                index,
                                'issuer',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="Date earned"
                            type="date"
                            value={
                              item.issuedAt ?? ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'certifications',
                                index,
                                'issuedAt',
                                event.target.value,
                              )
                            }
                          />

                          <Input
                            label="Credential URL"
                            type="url"
                            value={
                              item.credentialUrl ??
                              ''
                            }
                            onChange={(event) =>
                              updateItem(
                                setForm,
                                'certifications',
                                index,
                                'credentialUrl',
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </InnerGlass>
                    ),
                  )}
                </div>
              )}
            </GlassSection>

            {/* PREFERENCES */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Preferences"
                description="Choose the roles and locations you want to explore."
              />

              <div className="space-y-7">
                {/* Preferred roles */}

                <div>
                  <SectionHeading
                    title="Preferred roles"
                    action={
                      <ArrayActions
                        label="role"
                        onAdd={() =>
                          addItem(
                            setForm,
                            'preferredRoles',
                            '',
                          )
                        }
                      />
                    }
                  />

                  {form.preferredRoles.length ===
                    0 && (
                    <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-sm text-slate-500">
                      No preferred roles added.
                    </p>
                  )}

                  <div className="space-y-3">
                    {form.preferredRoles.map(
                      (role, index) => (
                        <InnerGlass
                          key={`role-${index}`}
                          className="p-3"
                        >
                          <div className="flex items-end gap-2">
                            <Input
                              label={`Role ${
                                index + 1
                              }`}
                              required
                              value={role}
                              onChange={(event) =>
                                setForm(
                                  (current) => ({
                                    ...current,
                                    preferredRoles:
                                      current.preferredRoles.map(
                                        (
                                          entry,
                                          itemIndex,
                                        ) =>
                                          itemIndex ===
                                          index
                                            ? event
                                                .target
                                                .value
                                            : entry,
                                      ),
                                  }),
                                )
                              }
                              maxLength={160}
                            />

                            <ArrayActions
                              label="role"
                              onRemove={() =>
                                removeItem(
                                  setForm,
                                  'preferredRoles',
                                  index,
                                )
                              }
                            />
                          </div>
                        </InnerGlass>
                      ),
                    )}
                  </div>
                </div>

                {/* Preferred locations */}

                <div>
                  <SectionHeading
                    title="Preferred locations"
                    action={
                      <ArrayActions
                        label="location"
                        onAdd={() =>
                          addItem(
                            setForm,
                            'preferredLocations',
                            {
                              city: '',
                              country: '',
                              remoteType:
                                'onsite',
                            },
                          )
                        }
                      />
                    }
                  />

                  {form.preferredLocations
                    .length === 0 && (
                    <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-sm text-slate-500">
                      No preferred locations added.
                    </p>
                  )}

                  <div className="space-y-3">
                    {form.preferredLocations.map(
                      (location, index) => (
                        <InnerGlass
                          key={`location-${index}`}
                          className="p-3"
                        >
                          <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_10rem_auto]">
                            <Input
                              label="City"
                              value={
                                location.city ??
                                ''
                              }
                              onChange={(event) =>
                                updateItem(
                                  setForm,
                                  'preferredLocations',
                                  index,
                                  'city',
                                  event.target.value,
                                )
                              }
                            />

                            <Input
                              label="Country"
                              value={
                                location.country ??
                                ''
                              }
                              onChange={(event) =>
                                updateItem(
                                  setForm,
                                  'preferredLocations',
                                  index,
                                  'country',
                                  event.target.value,
                                )
                              }
                            />

                            <Select
                              label="Work style"
                              value={
                                location.remoteType ??
                                'onsite'
                              }
                              onChange={(event) =>
                                updateItem(
                                  setForm,
                                  'preferredLocations',
                                  index,
                                  'remoteType',
                                  event.target.value,
                                )
                              }
                              options={[
                                'onsite',
                                'hybrid',
                                'remote',
                              ]}
                            />

                            <ArrayActions
                              label="location"
                              onRemove={() =>
                                removeItem(
                                  setForm,
                                  'preferredLocations',
                                  index,
                                )
                              }
                            />
                          </div>
                        </InnerGlass>
                      ),
                    )}
                  </div>
                </div>

                {/* Employment */}

                <fieldset>
                  <legend className="text-sm font-semibold text-slate-200">
                    Employment type
                  </legend>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {employmentOptions.map(
                      (type) => {
                        const selected =
                          form.preferredEmploymentTypes.includes(
                            type,
                          );

                        return (
                          <label
                            key={type}
                            className={[
                              'inline-flex',
                              'min-h-10',
                              'items-center',
                              'gap-2',
                              'rounded-xl',
                              'border',
                              selected
                                ? 'border-cyan-300/30 bg-cyan-300/[0.09] text-cyan-100'
                                : 'border-white/10 bg-white/[0.04] text-slate-400',
                              'px-3',
                              'text-sm',
                              'capitalize',
                              'backdrop-blur-md',
                              'transition-all',
                              'duration-200',
                              'hover:border-cyan-300/20',
                              'hover:bg-white/[0.07]',
                              'hover:text-slate-200',
                            ].join(' ')}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) =>
                                updateField(
                                  'preferredEmploymentTypes',
                                  event.target.checked
                                    ? [
                                        ...form.preferredEmploymentTypes,
                                        type,
                                      ]
                                    : form.preferredEmploymentTypes.filter(
                                        (entry) =>
                                          entry !==
                                          type,
                                      ),
                                )
                              }
                              className="h-4 w-4 rounded border-white/20 bg-white/[0.05] accent-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300"
                            />

                            {type.replace(
                              '-',
                              ' ',
                            )}
                          </label>
                        );
                      },
                    )}
                  </div>
                </fieldset>

                <Select
                  label="Profile visibility"
                  value={
                    form.profileVisibility
                  }
                  onChange={(event) =>
                    updateField(
                      'profileVisibility',
                      event.target.value,
                    )
                  }
                  hint="When private, employers cannot view your profile or resume from an application."
                  options={[
                    {
                      value: 'employers',
                      label:
                        'Visible to employers',
                    },
                    {
                      value: 'private',
                      label: 'Private',
                    },
                  ]}
                />
              </div>
            </GlassSection>

            {/* SAVE ACTIONS */}

            <div className="flex justify-end gap-2 pb-8">
              <Button
                variant="secondary"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                form="candidate-profile-form"
                loading={saving}
              >
                Save changes
              </Button>
            </div>
          </form>
        ) : (
          /* ===================================================
             VIEW MODE
          =================================================== */

          <div className="space-y-5">
            {/* Personal information */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading title="Personal information" />

              {profile.headline && (
                <div className="mb-4 inline-flex max-w-full rounded-xl border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[0.09] to-blue-400/[0.05] px-3 py-2 shadow-[0_10px_35px_-25px_rgba(34,211,238,0.7)]">
                  <p className="text-sm font-medium text-cyan-100">
                    {profile.headline}
                  </p>
                </div>
              )}

              {profile.summary ? (
                <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-400">
                  {profile.summary}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Add a short bio to introduce your
                  professional background.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {profile.phone && (
                  <Badge>{profile.phone}</Badge>
                )}

                {Object.values(
                  profile.location ?? {},
                ).filter(Boolean).length > 0 && (
                  <Badge>
                    {[
                      profile.location.city,
                      profile.location.region,
                      profile.location.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Badge>
                )}

                <Badge>{user.email}</Badge>
              </div>
            </GlassSection>

            {/* Skills */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading
                title="Skills"
                description="These skills are used by the job matching engine to calculate your compatibility with roles."
              />

              {profile.skills.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <SkillChip
                      key={skill.name}
                    >
                      {skill.name}

                      {skill.proficiency
                        ? ` · ${skill.proficiency}`
                        : ''}
                    </SkillChip>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No skills yet"
                  description="Add the skills you want employers to discover."
                />
              )}
            </GlassSection>

            {/* Education */}

            <ProfileCollection
              title="Education"
              items={profile.education}
              empty="Add your education history."
              render={(item) => (
                <div>
                  <p className="font-semibold text-white">
                    {item.degree ||
                      item.level}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {item.institution}

                    {item.fieldOfStudy
                      ? ` · ${item.fieldOfStudy}`
                      : ''}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.startYear ||
                      '—'}{' '}
                    –{' '}
                    {item.isCurrent
                      ? 'Present'
                      : item.endYear ||
                        '—'}
                  </p>
                </div>
              )}
            />

            {/* Experience */}

            <ProfileCollection
              title="Experience"
              items={profile.experience}
              empty="Add your professional or practical experience."
              render={(item) => (
                <div>
                  <p className="font-semibold text-white">
                    {item.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {item.employer}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {dateValue(
                      item.startDate,
                    )}{' '}
                    –{' '}
                    {item.isCurrent
                      ? 'Present'
                      : dateValue(
                          item.endDate,
                        ) || '—'}
                  </p>

                  {item.description && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  )}

                  {item.technologies?.length >
                    0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.technologies.map(
                        (tech) => (
                          <SkillChip
                            key={tech}
                          >
                            {tech}
                          </SkillChip>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            />

            {/* Projects */}

            <ProfileCollection
              title="Projects"
              items={profile.projects}
              empty="Showcase projects that demonstrate your skills."
              render={(item) => (
                <div>
                  <p className="font-semibold text-white">
                    {item.name}
                  </p>

                  {item.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {item.url && (
                      <a
                        className="font-medium text-cyan-300 underline underline-offset-4 transition-colors hover:text-cyan-200"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Project
                      </a>
                    )}

                    {item.githubUrl && (
                      <a
                        className="font-medium text-cyan-300 underline underline-offset-4 transition-colors hover:text-cyan-200"
                        href={
                          item.githubUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        GitHub
                      </a>
                    )}
                  </div>

                  {item.technologies?.length >
                    0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.technologies.map(
                        (tech) => (
                          <SkillChip
                            key={tech}
                          >
                            {tech}
                          </SkillChip>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            />

            {/* Certifications */}

            <ProfileCollection
              title="Certifications"
              items={profile.certifications}
              empty="Add certifications and credentials."
              render={(item) => (
                <div>
                  <p className="font-semibold text-white">
                    {item.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {item.issuer ||
                      'Issuer not specified'}

                    {item.issuedAt
                      ? ` · ${dateValue(
                          item.issuedAt,
                        )}`
                      : ''}
                  </p>

                  {item.credentialUrl && (
                    <a
                      className="mt-2 inline-block text-sm font-medium text-cyan-300 underline underline-offset-4 transition-colors hover:text-cyan-200"
                      href={
                        item.credentialUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      View credential
                    </a>
                  )}
                </div>
              )}
            />

            {/* Preferences */}

            <GlassSection className="p-5 sm:p-6">
              <SectionHeading title="Preferences" />

              <PreferenceGroup
                label="Roles"
                items={profile.preferredRoles}
              />

              <PreferenceGroup
                label="Locations"
                items={profile.preferredLocations.map(
                  (location) =>
                    [
                      location.city,
                      location.region,
                      location.country,
                      location.remoteType,
                    ]
                      .filter(Boolean)
                      .join(' · '),
                )}
              />

              <PreferenceGroup
                label="Employment"
                items={profile.preferredEmploymentTypes.map(
                  (type) =>
                    type.replace(
                      '-',
                      ' ',
                    ),
                )}
              />

              <PreferenceGroup
                label="Visibility"
                items={[
                  profile.profileVisibility ===
                  'private'
                    ? 'Private'
                    : 'Visible to employers',
                ]}
              />
            </GlassSection>
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   PROFILE COLLECTION
========================================================= */

function ProfileCollection({
  title,
  items,
  empty,
  render,
}) {
  return (
    <GlassSection className="p-5 sm:p-6">
      <SectionHeading title={title} />

      {items.length ? (
        <div className="divide-y divide-white/[0.08]">
          {items.map((item, index) => (
            <div
              key={
                item._id ??
                `${title}-${index}`
              }
              className="relative py-5 first:pt-0 last:pb-0"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
                />
              )}

              {render(item)}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${title.toLowerCase()} added`}
          description={empty}
        />
      )}
    </GlassSection>
  );
}

/* =========================================================
   PREFERENCE GROUP
========================================================= */

function PreferenceGroup({
  label,
  items,
}) {
  return (
    <div className="border-b border-white/[0.06] py-4 first:pt-0 last:border-b-0 last:pb-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item}
              tone="navy"
              className="capitalize"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No {label.toLowerCase()} selected.
        </p>
      )}
    </div>
  );
}
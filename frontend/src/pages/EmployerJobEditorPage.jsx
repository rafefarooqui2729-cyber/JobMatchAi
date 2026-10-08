import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import apiClient from '../api/client.js';

import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingSkeleton,
  PageHeader,
  Select,
} from '../components/ui/index.js';

import EmployerNavbar from '../components/employer/EmployerNavbar.jsx';
import { useToast } from '../components/ui/Toast.jsx';

const jobTypes = [
  'full-time',
  'part-time',
  'contract',
  'temporary',
  'internship',
];

const remoteTypes = [
  'onsite',
  'hybrid',
  'remote',
];

const salaryPeriods = [
  'hour',
  'month',
  'year',
];

const educationLevels = [
  { value: 'high-school', label: 'High school' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'associate', label: 'Associate' },
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

const initialForm = {
  title: '',
  description: '',
  responsibilitiesText: '',
  requiredSkillsText: '',
  preferredSkillsText: '',
  minimumExperience: '0',
  maximumExperience: '',
  educationRequirements: [],
  location: {
    city: '',
    region: '',
    country: '',
    countryCode: '',
    remoteType: 'onsite',
  },
  employmentType: 'full-time',
  salary: {
    minimum: '',
    maximum: '',
    currency: '',
    period: 'year',
    isDisclosed: true,
  },
  applicationDeadline: '',
};

function splitLines(text) {
  return text
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formFromJob(job) {
  return {
    title: job.title ?? '',
    description: job.description ?? '',
    responsibilitiesText: (job.responsibilities ?? []).join('\n'),
    requiredSkillsText: (job.requiredSkills ?? [])
      .map((skill) => skill.name ?? skill)
      .join(', '),
    preferredSkillsText: (job.preferredSkills ?? [])
      .map((skill) => skill.name ?? skill)
      .join(', '),
    minimumExperience: String(job.minimumExperience ?? 0),
    maximumExperience:
      job.maximumExperience == null
        ? ''
        : String(job.maximumExperience),
    educationRequirements: (job.educationRequirements ?? []).map((item) => ({
      minimumLevel: item.minimumLevel,
      fieldsOfStudyText: (item.fieldsOfStudy ?? []).join(', '),
      isRequired: Boolean(item.isRequired),
    })),
    location: {
      ...initialForm.location,
      ...job.location,
    },
    employmentType: job.employmentType ?? 'full-time',
    salary: {
      minimum: job.salary?.minimum ?? '',
      maximum: job.salary?.maximum ?? '',
      currency: job.salary?.currency ?? '',
      period: job.salary?.period ?? 'year',
      isDisclosed: job.salary?.isDisclosed !== false,
    },
    applicationDeadline: job.applicationDeadline
      ? String(job.applicationDeadline).slice(0, 10)
      : '',
  };
}

function TextArea({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
  maxLength,
  hint,
}) {
  const id = `job-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-white
        "
      >
        {label}

        {required && (
          <span
            aria-hidden="true"
            className="ml-1 text-rose-300"
          >
            *
          </span>
        )}
      </label>

      <textarea
        id={id}
        required={required}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        className="
          w-full
          rounded-xl
          border
          border-white/[0.10]
          bg-white/[0.045]
          px-3.5
          py-3
          text-sm
          leading-6
          text-white
          placeholder:text-slate-500
          outline-none
          shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
          backdrop-blur-xl
          transition
          duration-200
          hover:border-white/[0.15]
          hover:bg-white/[0.055]
          focus:border-cyan-400/50
          focus:bg-white/[0.065]
          focus:ring-4
          focus:ring-cyan-400/10
          focus:shadow-[0_0_24px_rgba(34,211,238,0.08)]
        "
      />

      {hint && (
        <p className="mt-1.5 text-xs text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="
            h-2
            w-2
            shrink-0
            rounded-full
            bg-cyan-300
            shadow-[0_0_12px_rgba(34,211,238,0.65)]
          "
        />

        <h2
          className="
            text-base
            font-semibold
            tracking-tight
            text-white
          "
        >
          {title}
        </h2>
      </div>

      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

function GlassSection({
  children,
  className = '',
}) {
  return (
    <Card
      className={`
        relative
        overflow-hidden
        space-y-4
        border-white/[0.09]
        bg-white/[0.045]
        p-5
        shadow-[0_18px_60px_rgba(0,0,0,0.18)]
        backdrop-blur-2xl
        sm:p-7
        ${className}
      `}
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/[0.20]
          to-transparent
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-48
          w-48
          rounded-full
          bg-cyan-400/[0.035]
          blur-3xl
        "
      />

      <div className="relative z-10">
        {children}
      </div>
    </Card>
  );
}

export default function EmployerJobEditorPage() {
  const { jobId } = useParams();
  const isEditing = Boolean(jobId);

  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) {
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const { data } = await apiClient.get(
        `/employer/jobs/${jobId}`,
      );

      setForm(formFromJob(data.job));
    } catch (requestError) {
      setLoadError(
        requestError.response?.data?.error?.message ||
          'Job could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  function change(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changeLocation(field, value) {
    setForm((current) => ({
      ...current,
      location: {
        ...current.location,
        [field]: value,
      },
    }));
  }

  function changeSalary(field, value) {
    setForm((current) => ({
      ...current,
      salary: {
        ...current.salary,
        [field]: value,
      },
    }));
  }

  async function save(event) {
    event.preventDefault();

    setSaving(true);
    setError('');

    const payload = {
      title: form.title,
      description: form.description,
      responsibilities: splitLines(
        form.responsibilitiesText,
      ),
      requiredSkills: splitLines(
        form.requiredSkillsText,
      ),
      preferredSkills: splitLines(
        form.preferredSkillsText,
      ),
      minimumExperience: Number(
        form.minimumExperience || 0,
      ),
      maximumExperience:
        form.maximumExperience === ''
          ? null
          : Number(form.maximumExperience),

      educationRequirements:
        form.educationRequirements.map((item) => ({
          minimumLevel: item.minimumLevel,
          fieldsOfStudy: splitLines(
            item.fieldsOfStudyText,
          ),
          isRequired: item.isRequired,
        })),

      location: form.location,
      employmentType: form.employmentType,

      salary: {
        minimum:
          form.salary.minimum === ''
            ? null
            : Number(form.salary.minimum),

        maximum:
          form.salary.maximum === ''
            ? null
            : Number(form.salary.maximum),

        currency: form.salary.currency,
        period: form.salary.period,
        isDisclosed: form.salary.isDisclosed,
      },

      applicationDeadline:
        form.applicationDeadline || null,
    };

    try {
      if (isEditing) {
        await apiClient.patch(
          `/employer/jobs/${jobId}`,
          payload,
        );
      } else {
        await apiClient.post(
          '/employer/jobs',
          payload,
        );
      }

      toast(
        isEditing
          ? 'Job changes saved.'
          : 'Job saved as a draft.',
        { tone: 'success' },
      );

      navigate('/employer/dashboard', {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          'Job could not be saved.',
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-canvas
          px-4
          py-8
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            fixed
            -left-32
            top-20
            h-80
            w-80
            rounded-full
            bg-cyan-400/[0.045]
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            fixed
            -right-32
            bottom-0
            h-96
            w-96
            rounded-full
            bg-blue-500/[0.045]
            blur-3xl
          "
        />

        <div className="relative z-10 mx-auto max-w-5xl space-y-5">
          <LoadingSkeleton className="h-16" />

          <LoadingSkeleton
            className="h-[42rem]"
            rounded="rounded-2xl"
          />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-canvas
          px-4
          py-8
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            fixed
            left-1/2
            top-1/3
            h-80
            w-80
            -translate-x-1/2
            rounded-full
            bg-cyan-400/[0.04]
            blur-3xl
          "
        />

        <div className="relative z-10 mx-auto max-w-5xl">
          <ErrorState
            title="Job unavailable"
            description={loadError}
            onRetry={loadJob}
          />
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -left-32
            top-24
            h-96
            w-96
            rounded-full
            bg-cyan-400/[0.035]
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -right-40
            top-1/3
            h-[32rem]
            w-[32rem]
            rounded-full
            bg-blue-500/[0.035]
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-[-12rem]
            left-1/3
            h-96
            w-96
            rounded-full
            bg-cyan-500/[0.025]
            blur-3xl
          "
        />
      </div>

      <EmployerNavbar />

      <main
        className="
          relative
          z-10
          mx-auto
          max-w-5xl
          px-4
          py-7
          sm:px-8
          sm:py-10
        "
      >
        <PageHeader
          eyebrow="Employer workspace"
          title={
            isEditing
              ? 'Edit job'
              : 'Create a job'
          }
          description={
            isEditing
              ? 'Update the role requirements and posting details.'
              : 'New jobs are saved as drafts. Publish when the details are ready.'
          }
          actions={
            <Link
              to="/employer/dashboard"
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                rounded-xl
                border
                border-white/[0.10]
                bg-white/[0.055]
                px-3.5
                text-sm
                font-semibold
                text-slate-200
                shadow-[0_10px_30px_rgba(0,0,0,0.14)]
                backdrop-blur-xl
                transition
                duration-200
                hover:border-white/[0.18]
                hover:bg-white/[0.09]
                hover:text-white
                focus:outline-none
                focus:ring-2
                focus:ring-cyan-400/40
              "
            >
              Back to jobs
            </Link>
          }
        />

        {error && (
          <ErrorState
            title="Job not saved"
            description={error}
            className="mt-5"
          />
        )}

        <form
          onSubmit={save}
          className="mt-6 space-y-5"
        >
          {/* Role details */}
          <GlassSection>
            <SectionTitle
              title="Role details"
              description="Give candidates a clear, accurate view of the opportunity."
            />

            <Input
              label="Job title"
              required
              maxLength={200}
              value={form.title}
              onChange={(event) =>
                change(
                  'title',
                  event.target.value,
                )
              }
              placeholder="e.g. Software Engineer"
            />

            <TextArea
              label="Description"
              required
              maxLength={20000}
              rows={7}
              value={form.description}
              onChange={(event) =>
                change(
                  'description',
                  event.target.value,
                )
              }
              hint="Describe the role, team, and what the successful candidate will do."
            />

            <TextArea
              label="Responsibilities"
              maxLength={50000}
              rows={5}
              value={form.responsibilitiesText}
              onChange={(event) =>
                change(
                  'responsibilitiesText',
                  event.target.value,
                )
              }
              hint="Enter one responsibility per line."
            />
          </GlassSection>

          {/* Skills and experience */}
          <GlassSection>
            <SectionTitle
              title="Skills and experience"
              description="Skill names are normalized and deduplicated when saved."
            />

            <TextArea
              label="Required skills"
              rows={3}
              value={form.requiredSkillsText}
              onChange={(event) =>
                change(
                  'requiredSkillsText',
                  event.target.value,
                )
              }
              hint="Separate skills with commas."
            />

            <TextArea
              label="Preferred skills"
              rows={3}
              value={form.preferredSkillsText}
              onChange={(event) =>
                change(
                  'preferredSkillsText',
                  event.target.value,
                )
              }
              hint="Separate skills with commas."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Minimum experience (years)"
                type="number"
                min="0"
                max="80"
                step="0.5"
                required
                value={form.minimumExperience}
                onChange={(event) =>
                  change(
                    'minimumExperience',
                    event.target.value,
                  )
                }
              />

              <Input
                label="Maximum experience (years)"
                type="number"
                min="0"
                max="80"
                step="0.5"
                value={form.maximumExperience}
                onChange={(event) =>
                  change(
                    'maximumExperience',
                    event.target.value,
                  )
                }
              />
            </div>
          </GlassSection>

          {/* Education */}
          <GlassSection>
            <SectionTitle
              title="Education requirements"
              description="Add only the minimum education that is relevant to this role."
            />

            {form.educationRequirements.map(
              (item, index) => (
                <div
                  key={`education-${index}`}
                  className="
                    relative
                    mb-4
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-white/[0.035]
                    p-4
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
                    backdrop-blur-xl
                    sm:grid
                    sm:grid-cols-2
                    sm:gap-4
                  "
                >
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-0
                      top-0
                      h-px
                      bg-gradient-to-r
                      from-transparent
                      via-white/[0.16]
                      to-transparent
                    "
                  />

                  <div className="relative z-10">
                    <Select
                      label="Minimum level"
                      required
                      value={item.minimumLevel}
                      options={educationLevels}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          educationRequirements:
                            current.educationRequirements.map(
                              (
                                entry,
                                itemIndex,
                              ) =>
                                itemIndex === index
                                  ? {
                                      ...entry,
                                      minimumLevel:
                                        event.target
                                          .value,
                                    }
                                  : entry,
                            ),
                        }))
                      }
                    />
                  </div>

                  <div className="relative z-10">
                    <Input
                      label="Fields of study (comma separated)"
                      value={
                        item.fieldsOfStudyText
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          educationRequirements:
                            current.educationRequirements.map(
                              (
                                entry,
                                itemIndex,
                              ) =>
                                itemIndex === index
                                  ? {
                                      ...entry,
                                      fieldsOfStudyText:
                                        event.target
                                          .value,
                                    }
                                  : entry,
                            ),
                        }))
                      }
                    />
                  </div>

                  <label
                    className="
                      relative
                      z-10
                      flex
                      min-h-10
                      items-center
                      gap-2
                      text-sm
                      text-slate-300
                    "
                  >
                    <input
                      type="checkbox"
                      checked={item.isRequired}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          educationRequirements:
                            current.educationRequirements.map(
                              (
                                entry,
                                itemIndex,
                              ) =>
                                itemIndex === index
                                  ? {
                                      ...entry,
                                      isRequired:
                                        event.target
                                          .checked,
                                    }
                                  : entry,
                            ),
                        }))
                      }
                      className="
                        h-4
                        w-4
                        rounded
                        border-white/20
                        bg-white/[0.06]
                        accent-cyan-400
                        focus-visible:ring-2
                        focus-visible:ring-cyan-400/50
                        focus-visible:ring-offset-0
                      "
                    />

                    Required for this role
                  </label>

                  <div className="relative z-10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-self-start"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          educationRequirements:
                            current.educationRequirements.filter(
                              (
                                _,
                                itemIndex,
                              ) =>
                                itemIndex !== index,
                            ),
                        }))
                      }
                    >
                      Remove requirement
                    </Button>
                  </div>
                </div>
              ),
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  educationRequirements: [
                    ...current.educationRequirements,
                    {
                      minimumLevel: 'bachelor',
                      fieldsOfStudyText: '',
                      isRequired: false,
                    },
                  ],
                }))
              }
            >
              Add education requirement
            </Button>
          </GlassSection>

          {/* Location and employment */}
          <GlassSection>
            <SectionTitle
              title="Location and employment"
              description="Tell candidates where and how the role will be performed."
            />

            <Select
              label="Employment type"
              required
              value={form.employmentType}
              options={jobTypes}
              onChange={(event) =>
                change(
                  'employmentType',
                  event.target.value,
                )
              }
            />

            <Select
              label="Work style"
              required
              value={form.location.remoteType}
              options={remoteTypes}
              onChange={(event) =>
                changeLocation(
                  'remoteType',
                  event.target.value,
                )
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City"
                value={form.location.city}
                onChange={(event) =>
                  changeLocation(
                    'city',
                    event.target.value,
                  )
                }
              />

              <Input
                label="Region / State"
                value={form.location.region}
                onChange={(event) =>
                  changeLocation(
                    'region',
                    event.target.value,
                  )
                }
              />

              <Input
                label="Country"
                value={form.location.country}
                onChange={(event) =>
                  changeLocation(
                    'country',
                    event.target.value,
                  )
                }
              />

              <Input
                label="Country code"
                maxLength={2}
                placeholder="e.g. US"
                value={form.location.countryCode}
                onChange={(event) =>
                  changeLocation(
                    'countryCode',
                    event.target.value.toUpperCase(),
                  )
                }
              />
            </div>
          </GlassSection>

          {/* Compensation */}
          <GlassSection>
            <SectionTitle
              title="Compensation and deadline"
              description="Salary is optional. A deadline must be a future date."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Minimum salary"
                type="number"
                min="0"
                step="any"
                value={form.salary.minimum}
                onChange={(event) =>
                  changeSalary(
                    'minimum',
                    event.target.value,
                  )
                }
              />

              <Input
                label="Maximum salary"
                type="number"
                min="0"
                step="any"
                value={form.salary.maximum}
                onChange={(event) =>
                  changeSalary(
                    'maximum',
                    event.target.value,
                  )
                }
              />

              <Input
                label="Currency code"
                maxLength={3}
                placeholder="e.g. USD"
                value={form.salary.currency}
                onChange={(event) =>
                  changeSalary(
                    'currency',
                    event.target.value.toUpperCase(),
                  )
                }
              />

              <Select
                label="Salary period"
                value={form.salary.period}
                options={salaryPeriods}
                onChange={(event) =>
                  changeSalary(
                    'period',
                    event.target.value,
                  )
                }
              />

              <Input
                label="Application deadline"
                type="date"
                value={form.applicationDeadline}
                onChange={(event) =>
                  change(
                    'applicationDeadline',
                    event.target.value,
                  )
                }
              />
            </div>

            <label
              className="
                flex
                min-h-10
                items-center
                gap-2
                text-sm
                text-slate-300
              "
            >
              <input
                type="checkbox"
                checked={form.salary.isDisclosed}
                onChange={(event) =>
                  changeSalary(
                    'isDisclosed',
                    event.target.checked,
                  )
                }
                className="
                  h-4
                  w-4
                  rounded
                  border-white/20
                  bg-white/[0.06]
                  accent-cyan-400
                  focus-visible:ring-2
                  focus-visible:ring-cyan-400/50
                  focus-visible:ring-offset-0
                "
              />

              Show salary range to candidates
            </label>
          </GlassSection>

          {/* Actions */}
          <div
            className="
              flex
              flex-col-reverse
              justify-end
              gap-3
              border-t
              border-white/[0.07]
              pb-8
              pt-5
              sm:flex-row
            "
          >
            <Link
              to="/employer/dashboard"
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-white/[0.10]
                bg-white/[0.045]
                px-4
                text-sm
                font-semibold
                text-slate-200
                shadow-[0_10px_30px_rgba(0,0,0,0.12)]
                backdrop-blur-xl
                transition
                duration-200
                hover:border-white/[0.18]
                hover:bg-white/[0.085]
                hover:text-white
                focus:outline-none
                focus:ring-2
                focus:ring-cyan-400/40
              "
            >
              Cancel
            </Link>

            <Button
              type="submit"
              loading={saving}
            >
              {isEditing
                ? 'Save changes'
                : 'Save as draft'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
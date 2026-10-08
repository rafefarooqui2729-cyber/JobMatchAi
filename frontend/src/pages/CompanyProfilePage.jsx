import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client.js';
import {
  Avatar,
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

const sizes = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-1000', label: '501–1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
  { value: 'unknown', label: 'Prefer not to say' },
];

function TextArea({ label, value, onChange, maxLength }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-300"
      >
        {label}
      </label>

      <textarea
        id={id}
        rows={5}
        maxLength={maxLength}
        value={value ?? ''}
        onChange={onChange}
        className="
          w-full
          resize-y
          rounded-xl
          border
          border-white/[0.10]
          bg-white/[0.055]
          px-3.5
          py-3
          text-sm
          leading-6
          text-white
          outline-none
          backdrop-blur-xl
          shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
          transition-all
          duration-200
          placeholder:text-slate-500
          hover:border-white/[0.16]
          hover:bg-white/[0.07]
          focus:border-cyan-300/40
          focus:bg-white/[0.075]
          focus:ring-4
          focus:ring-cyan-400/10
        "
      />
    </div>
  );
}

export default function CompanyProfilePage() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toast = useToast();

  const loadCompany = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.get('/employer/company');

      setCompany(data.company);

      setForm({
        name: data.company.name ?? '',
        description: data.company.description ?? '',
        website: data.company.website ?? '',
        industry: data.company.industry ?? '',
        size: data.company.size ?? 'unknown',
        headquarters: {
          city: data.company.headquarters?.city ?? '',
          region: data.company.headquarters?.region ?? '',
          country: data.company.headquarters?.country ?? '',
          countryCode: data.company.headquarters?.countryCode ?? '',
        },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          'Company profile could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  function change(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changeLocation(field, value) {
    setForm((current) => ({
      ...current,
      headquarters: {
        ...current.headquarters,
        [field]: value,
      },
    }));
  }

  async function save(event) {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      const { data } = await apiClient.patch(
        '/employer/company',
        form
      );

      setCompany(data.company);

      toast('Company profile saved.', {
        tone: 'success',
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          'Company profile could not be saved.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    const payload = new FormData();

    payload.append('logo', file);

    setUploading(true);
    setError('');

    try {
      const { data } = await apiClient.post(
        '/employer/company/logo',
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setCompany(data.company);

      toast('Company logo uploaded.', {
        tone: 'success',
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          'Logo could not be uploaded.'
      );
    } finally {
      setUploading(false);
    }
  }

  /* --------------------------------
     Loading state
  --------------------------------- */

  if (loading) {
    return (
      <main
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-[#020817]
          px-4
          py-8
          sm:px-8
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-32
            -top-32
            h-80
            w-80
            rounded-full
            bg-cyan-400/[0.05]
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-40
            -right-32
            h-96
            w-96
            rounded-full
            bg-blue-500/[0.06]
            blur-3xl
          "
        />

        <div className="relative mx-auto max-w-5xl space-y-5">
          <LoadingSkeleton className="h-16" />

          <LoadingSkeleton
            className="h-80"
            rounded="rounded-2xl"
          />
        </div>
      </main>
    );
  }

  /* --------------------------------
     Error state
  --------------------------------- */

  if (error && !form) {
    return (
      <main
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-[#020817]
          px-4
          py-8
          sm:px-8
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-32
            -top-32
            h-80
            w-80
            rounded-full
            bg-rose-500/[0.04]
            blur-3xl
          "
        />

        <div className="relative mx-auto max-w-5xl">
          <ErrorState
            title="Company unavailable"
            description={error}
            onRetry={loadCompany}
          />
        </div>
      </main>
    );
  }

  if (!form || !company) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817]">
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          -left-40
          top-20
          h-[28rem]
          w-[28rem]
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
          -bottom-40
          -right-40
          h-[32rem]
          w-[32rem]
          rounded-full
          bg-blue-600/[0.055]
          blur-3xl
        "
      />

      <EmployerNavbar />

      <main className="relative mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Employer workspace"
          title="Company profile"
          description="Keep your organization details accurate for candidates and future job listings."
        />

        {/* Update error */}
        {error && (
          <ErrorState
            title="Company profile update failed"
            description={error}
            className="mt-5"
          />
        )}

        <form
          onSubmit={save}
          className="mt-6 space-y-5"
        >
          {/* --------------------------------
              Company logo
          --------------------------------- */}

          <Card className="relative overflow-hidden p-5 sm:p-7">
            {/* Top highlight */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-x-6
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-cyan-300/20
                to-transparent
              "
            />

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* Logo glass frame */}
              <div
                className="
                  relative
                  shrink-0
                  rounded-2xl
                  border
                  border-white/[0.10]
                  bg-white/[0.045]
                  p-1
                  backdrop-blur-xl
                  shadow-[0_12px_35px_rgba(0,0,0,0.18)]
                "
              >
                <Avatar
                  name={company.name}
                  src={company.logoUrl}
                  size="xl"
                  className="rounded-2xl"
                />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Company logo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  PNG, JPEG, or WebP. Maximum 3 MB.
                </p>

                <label
                  className="
                    mt-3
                    inline-flex
                    min-h-10
                    cursor-pointer
                    items-center
                    rounded-xl
                    border
                    border-white/[0.10]
                    bg-white/[0.055]
                    px-3.5
                    text-sm
                    font-semibold
                    text-slate-200
                    backdrop-blur-xl
                    transition-all
                    duration-200
                    hover:border-cyan-300/20
                    hover:bg-white/[0.09]
                    hover:text-white
                    focus-within:ring-4
                    focus-within:ring-cyan-400/10
                  "
                >
                  {uploading ? 'Uploading…' : 'Upload logo'}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploading}
                    onChange={uploadLogo}
                    className="sr-only"
                    aria-label="Upload company logo"
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* --------------------------------
              Company details
          --------------------------------- */}

          <Card className="relative overflow-hidden p-5 sm:p-7">
            {/* Top highlight */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-x-6
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-white/15
                to-transparent
              "
            />

            {/* Section heading */}
            <div className="mb-6">
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-cyan-300
                "
              >
                Organization details
              </p>

              <h2 className="mt-2 text-lg font-semibold text-white">
                Tell candidates about your company
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                These details help candidates understand your organization.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Company name"
                required
                maxLength={200}
                value={form.name}
                onChange={(event) =>
                  change('name', event.target.value)
                }
              />

              <Input
                label="Website"
                type="url"
                maxLength={2048}
                placeholder="https://example.com"
                value={form.website}
                onChange={(event) =>
                  change('website', event.target.value)
                }
              />

              <Input
                label="Industry"
                maxLength={120}
                value={form.industry}
                onChange={(event) =>
                  change('industry', event.target.value)
                }
              />

              <Select
                label="Company size"
                value={form.size}
                options={sizes}
                onChange={(event) =>
                  change('size', event.target.value)
                }
              />

              <div className="sm:col-span-2">
                <TextArea
                  label="Description"
                  maxLength={5000}
                  value={form.description}
                  onChange={(event) =>
                    change(
                      'description',
                      event.target.value
                    )
                  }
                />
              </div>

              {/* --------------------------------
                  Headquarters
              --------------------------------- */}

              <div className="sm:col-span-2">
                <div className="mb-1 mt-2">
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-cyan-300/80
                    "
                  >
                    Headquarters
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Where your organization is based.
                  </p>
                </div>
              </div>

              <Input
                label="City"
                autoComplete="address-level2"
                value={form.headquarters.city}
                onChange={(event) =>
                  changeLocation(
                    'city',
                    event.target.value
                  )
                }
              />

              <Input
                label="Region / State"
                autoComplete="address-level1"
                value={form.headquarters.region}
                onChange={(event) =>
                  changeLocation(
                    'region',
                    event.target.value
                  )
                }
              />

              <Input
                label="Country"
                autoComplete="country-name"
                value={form.headquarters.country}
                onChange={(event) =>
                  changeLocation(
                    'country',
                    event.target.value
                  )
                }
              />

              <Input
                label="Country code"
                maxLength={2}
                placeholder="e.g. US"
                value={form.headquarters.countryCode}
                onChange={(event) =>
                  changeLocation(
                    'countryCode',
                    event.target.value.toUpperCase()
                  )
                }
              />
            </div>

            {/* Save action */}
            <div
              className="
                mt-7
                flex
                flex-col
                gap-3
                border-t
                border-white/[0.07]
                pt-5
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p className="text-xs text-slate-500">
                Your changes will be reflected across your employer workspace.
              </p>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={saving}
                >
                  Save company profile
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
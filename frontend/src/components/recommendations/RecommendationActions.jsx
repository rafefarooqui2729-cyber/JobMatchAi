import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../ui/Toast.jsx';
import Button from '../ui/Button.jsx';
import apiClient from '../../api/client.js';

export default function RecommendationActions({
  jobId,
  isSaved,
  hasApplied,
  isExternal = false,
  onChange,
}) {
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  async function toggleSave() {
    setSaving(true);

    try {
      const { data } = isSaved
        ? await apiClient.delete(
            `/candidate/saved-jobs/${jobId}`,
          )
        : await apiClient.put(
            `/candidate/saved-jobs/${jobId}`,
          );

      onChange({
        isSaved: data.saved,
      });

      toast(
        data.saved
          ? 'Job saved to your list.'
          : 'Job removed from your saved list.',
        { tone: 'success' },
      );
    } catch (error) {
      toast(
        error.response?.data?.error?.message ||
          'This job could not be updated. Please try again.',
        { tone: 'error' },
      );
    } finally {
      setSaving(false);
    }
  }

  async function apply() {
    setApplying(true);

    try {
      const { data } = await apiClient.post(
        `/candidate/jobs/${jobId}/applications`,
      );

      const application = data.application;

      if (application?.external) {
        if (!application.externalApplyUrl) {
          throw new Error(
            'The external application link is unavailable.',
          );
        }

        window.open(
          application.externalApplyUrl,
          '_blank',
          'noopener,noreferrer',
        );

        toast(
          'Opening the original job application.',
          { tone: 'success' },
        );

        return;
      }

      onChange({
        hasApplied: true,
      });

      toast(
        'Your application was submitted.',
        { tone: 'success' },
      );
    } catch (error) {
      toast(
        error.response?.data?.error?.message ||
          error.message ||
          'Your application could not be submitted. Please try again.',
        { tone: 'error' },
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* View job */}
      <Link
        to={`/jobs/${jobId}`}
        className={[
          'inline-flex',
          'min-h-11',
          'items-center',
          'justify-center',
          'rounded-xl',
          'border',
          'border-white/[0.11]',
          'bg-white/[0.055]',
          'px-4',
          'text-sm',
          'font-semibold',
          'text-slate-200',
          'shadow-[0_8px_25px_rgba(0,0,0,0.12)]',
          'backdrop-blur-xl',
          'transition-all',
          'duration-200',
          'hover:-translate-y-0.5',
          'hover:border-cyan-300/25',
          'hover:bg-white/[0.09]',
          'hover:text-white',
          'hover:shadow-[0_12px_30px_rgba(34,211,238,0.12)]',
          'focus-visible:outline-none',
          'focus-visible:ring-4',
          'focus-visible:ring-cyan-400/15',
        ].join(' ')}
      >
        View job
      </Link>

      {/* Save / Unsave */}
      <Button
        variant="secondary"
        loading={saving}
        onClick={toggleSave}
        aria-pressed={isSaved}
      >
        {isSaved ? 'Saved' : 'Save'}
      </Button>

      {/* Apply */}
      {hasApplied ? (
        <Button
          variant="subtle"
          disabled
        >
          Applied
        </Button>
      ) : (
        <Button
          loading={applying}
          onClick={apply}
        >
          {isExternal ? 'Apply externally' : 'Apply'}
        </Button>
      )}
    </div>
  );
}
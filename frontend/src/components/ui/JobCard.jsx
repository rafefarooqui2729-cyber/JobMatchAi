import { motion } from 'framer-motion';
import { motionVariants } from '../../design-system/motion.js';
import Avatar from './Avatar.jsx';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import Card from './Card.jsx';
import MatchScore from './MatchScore.jsx';
import SkillChip from './SkillChip.jsx';

export default function JobCard({
  job,
  match,
  matchedSkills = [],
  missingSkills = [],
  onView,
  onApply,
  onSave,
  saved = false,
  className = '',
}) {
  if (!job) return null;

  const companyName = job.company?.name ?? job.companyName ?? '';
  const companyLogo = job.company?.logoUrl ?? job.companyLogo;

  const location = job.location
    ? [
        job.location.city,
        job.location.region,
        job.location.country,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const salary =
    job.salary?.isDisclosed === false
      ? ''
      : [
          job.salary?.currency,
          job.salary?.minimum?.toLocaleString(),
          job.salary?.maximum &&
            `– ${job.salary.maximum.toLocaleString()}`,
          job.salary?.period && `/ ${job.salary.period}`,
        ]
          .filter(Boolean)
          .join(' ');

  return (
    <motion.div
      variants={motionVariants.card}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={className}
    >
      <Card
        className="
          relative
          overflow-hidden
          p-5
          sm:p-6
        "
      >
        {/* Soft card glow */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-16
            -top-20
            h-40
            w-40
            rounded-full
            bg-cyan-400/[0.045]
            blur-3xl
          "
        />

        {/* Top glass highlight */}
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
            via-white/20
            to-transparent
          "
        />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row">
          {/* Company + Job information */}
          <div className="flex min-w-0 flex-1 gap-3.5">
            <Avatar
              name={companyName}
              src={companyLogo}
              size="lg"
              className="
                shrink-0
                rounded-2xl
                border
                border-white/15
                bg-white/[0.08]
              "
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {companyName && (
                  <p
                    className="
                      truncate
                      text-xs
                      font-medium
                      text-slate-400
                    "
                  >
                    {companyName}
                  </p>
                )}

                {job.employmentType && (
                  <Badge tone="neutral">
                    {job.employmentType}
                  </Badge>
                )}
              </div>

              <h3
                className="
                  mt-1
                  text-lg
                  font-semibold
                  leading-6
                  tracking-tight
                  text-white
                "
              >
                {job.title}
              </h3>

              <div
                className="
                  mt-2
                  flex
                  flex-wrap
                  gap-x-4
                  gap-y-1
                  text-xs
                  text-slate-400
                "
              >
                {location && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-3.5 w-3.5 text-slate-500"
                    >
                      <path
                        d="M12 21s7-5.25 7-11a7 7 0 1 0-14 0c0 5.75 7 11 7 11Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="2.2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>

                    {location}
                  </span>
                )}

                {salary && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-3.5 w-3.5 text-slate-500"
                    >
                      <path
                        d="M12 3v18M16 7.5c0-1.4-1.6-2.5-4-2.5S8 6.1 8 7.5s1.6 2.5 4 2.5 4 1.1 4 2.5-1.6 2.5-4 2.5-4-1.1-4-2.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>

                    {salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Match score */}
          {Number.isFinite(match) && (
            <div
              className="
                flex
                items-center
                gap-3
                self-start
                rounded-2xl
                border
                border-white/10
                bg-white/[0.055]
                px-3
                py-2
                backdrop-blur-xl
                sm:flex-col
                sm:gap-1.5
                sm:border-0
                sm:bg-transparent
                sm:px-0
                sm:py-0
              "
            >
              <MatchScore
                score={match}
                size="sm"
              />

              <span
                className="
                  text-xs
                  font-semibold
                  text-slate-400
                "
              >
                match
              </span>
            </div>
          )}
        </div>

        {/* Skills */}
        {(matchedSkills.length > 0 ||
          missingSkills.length > 0) && (
          <div
            className="
              relative
              z-10
              mt-5
              space-y-3
              border-t
              border-white/[0.08]
              pt-4
            "
          >
            {matchedSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="
                    mr-1
                    text-xs
                    font-semibold
                    text-slate-400
                  "
                >
                  Matched
                </span>

                {matchedSkills.map((skill) => (
                  <SkillChip
                    key={skill.id ?? skill}
                  >
                    {skill.name ?? skill}
                  </SkillChip>
                ))}
              </div>
            )}

            {missingSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="
                    mr-1
                    text-xs
                    font-semibold
                    text-slate-400
                  "
                >
                  To build
                </span>

                {missingSkills.map((skill) => (
                  <SkillChip
                    key={skill.id ?? skill}
                    missing
                  >
                    {skill.name ?? skill}
                  </SkillChip>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div
          className="
            relative
            z-10
            mt-5
            flex
            flex-wrap
            items-center
            gap-2
            border-t
            border-white/[0.08]
            pt-4
          "
        >
          <Button
            size="sm"
            onClick={onView}
          >
            View details
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onApply}
          >
            Apply
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={onSave}
            aria-pressed={saved}
          >
            {saved ? 'Saved' : 'Save job'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
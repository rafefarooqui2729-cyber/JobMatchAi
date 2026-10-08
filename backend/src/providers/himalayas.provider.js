import { JobProvider } from './job-provider.js';
import { normalizeExternalJob } from './job-normalizer.js';

const HIMALAYAS_API_URL = 'https://himalayas.app/jobs/api';

const KNOWN_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'React.js',
  'Node.js',
  'Node',
  'Python',
  'Java',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'SQL',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'AWS',
  'Azure',
  'Docker',
  'Kubernetes',
  'Git',
  'CI/CD',
  'HTML',
  'CSS',
  'GLSL',
  'GLSL ES',
  'MSL',
  'Unity',
  'Unreal',
  'Android',
  'iOS',
  'Firebase',
  'Salesforce',
  'HubSpot',
  'SaaS',
  'CRM',
  'WebEx',
  'Zoom',
  'Microsoft Excel',
  'Excel',
  'Power BI',
  'Tableau',
  'Figma',
  'Jira',
  'Agile',
  'Scrum',
  'REST API',
  'GraphQL',
];

/* =========================================================
   HTML CLEANER
========================================================= */

function stripHtml(html = '') {
  return html
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<\/li>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/* =========================================================
   EXTRACT LIST ITEMS FROM A SECTION
========================================================= */

function extractListItems(html, headingPattern) {
  if (!html) {
    return [];
  }

  const headingMatch = html.match(headingPattern);

  if (!headingMatch) {
    return [];
  }

  const startIndex =
    headingMatch.index + headingMatch[0].length;

  const remainingHtml = html.slice(startIndex);

  const nextHeadingIndex = remainingHtml.search(
    /<h[1-6][^>]*>/i,
  );

  const section =
    nextHeadingIndex >= 0
      ? remainingHtml.slice(0, nextHeadingIndex)
      : remainingHtml;

  return [...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripHtml(match[1]))
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =========================================================
   EXTRACT EXPERIENCE
========================================================= */

function extractExperience(description) {
  if (!description) {
    return 0;
  }

  const matches = [
    ...description.matchAll(
      /(\d+)\s*\+\s*years?\s+of\s+(?:relevant\s+)?(?:engineering\s+)?experience/gi,
    ),

    ...description.matchAll(
      /(\d+)\s*\+\s*years?['â€™]?\s+experience/gi,
    ),
  ];

  if (matches.length === 0) {
    return 0;
  }

  return Math.max(
    ...matches.map((match) => Number(match[1])),
  );
}

/* =========================================================
   EXTRACT EDUCATION
========================================================= */

function extractEducation(description) {
  if (!description) {
    return [];
  }

  const education = [];

  if (/bachelor['â€™]?s?\s+degree/i.test(description)) {
    education.push("Bachelor's Degree");
  }

  if (/master['â€™]?s?\s+degree/i.test(description)) {
    education.push("Master's Degree");
  }

  if (/ph\.?d/i.test(description)) {
    education.push('PhD');
  }

  if (/associate['â€™]?s?\s+degree/i.test(description)) {
    education.push("Associate's Degree");
  }

  if (/high\s*school/i.test(description)) {
    education.push('High School');
  }

  return education;
}

/* =========================================================
   FIND KNOWN SKILLS IN TEXT
========================================================= */

function findKnownSkills(text = '') {
  const skills = new Set();

  if (!text) {
    return [];
  }

  for (const skill of KNOWN_SKILLS) {
    const escapedSkill = skill.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );

    const regex = new RegExp(
      `(?<![A-Za-z0-9+#])${escapedSkill}(?![A-Za-z0-9+#])`,
      'i',
    );

    if (regex.test(text)) {
      skills.add(skill);
    }
  }

  return [...skills];
}

/* =========================================================
   EXTRACT SKILLS
========================================================= */

function extractSkills(job) {
  const skills = new Set();

  const description = stripHtml(
    job.description || '',
  );

  const categories = Array.isArray(job.categories)
    ? job.categories
    : [];

  /* -------------------------------------------------------
     1. Check Himalayas categories
  ------------------------------------------------------- */

  for (const category of categories) {
    if (typeof category !== 'string') {
      continue;
    }

    const cleaned = category
      .replace(/-/g, ' ')
      .trim();

    const matchingSkill = KNOWN_SKILLS.find(
      (skill) =>
        skill.toLowerCase() ===
        cleaned.toLowerCase(),
    );

    if (matchingSkill) {
      skills.add(matchingSkill);
    }
  }

  /* -------------------------------------------------------
     2. Check job description
  ------------------------------------------------------- */

  for (const skill of findKnownSkills(description)) {
    skills.add(skill);
  }

  return [...skills];
}

/* =========================================================
   EXTRACT PREFERRED SKILLS
========================================================= */

function extractPreferredSkills(job) {
  const description = stripHtml(
    job.description || '',
  );

  const preferredSectionItems = extractListItems(
    job.description,
    /<h[1-6][^>]*>\s*(?:bonus points|preferred qualifications|nice to have)\s*:?\s*<\/h[1-6]>/i,
  );

  /*
   * IMPORTANT:
   *
   * Never store entire sentences as skills.
   *
   * Instead, search those sentences for skills from
   * our controlled skill list.
   */

  const preferredText = preferredSectionItems.join('\n');

  const sectionSkills = findKnownSkills(
    preferredText,
  );

  /*
   * If Himalayas does not have a preferred section,
   * don't invent preferred skills from the entire
   * description.
   */

  if (sectionSkills.length > 0) {
    return sectionSkills;
  }

  return [];
}

/* =========================================================
   DETECT REMOTE TYPE
========================================================= */

function detectRemoteType(job) {
  const text = [
    job.excerpt || '',
    job.description || '',
    ...(Array.isArray(job.locationRestrictions)
      ? job.locationRestrictions
      : []),
  ]
    .join(' ')
    .toLowerCase();

  if (text.includes('hybrid')) {
    return 'hybrid';
  }

  if (text.includes('remote')) {
    return 'remote';
  }

  return 'onsite';
}

/* =========================================================
   EXTRACT LOCATION
========================================================= */

function extractLocation(job) {
  const restrictions = Array.isArray(
    job.locationRestrictions,
  )
    ? job.locationRestrictions
    : [];

  const excerpt = stripHtml(
    job.excerpt || '',
  );

  const description = stripHtml(
    job.description || '',
  );

  const text = `${excerpt} ${description}`;

  let country = restrictions[0] || null;
  let city = null;
  let region = null;

  const basedInMatch = text.match(
    /\bbased in\s+([^,\n]+),\s*([A-Z]{2})\b/i,
  );

  if (basedInMatch) {
    city = basedInMatch[1].trim();
    region = basedInMatch[2].trim();
  }

  if (!city || !region) {
    const relocateMatch = text.match(
      /\brelocate to\s+([^,\n]+),\s*([A-Z]{2})\b/i,
    );

    if (relocateMatch) {
      city = relocateMatch[1].trim();
      region = relocateMatch[2].trim();
    }
  }

  if (!city || !region) {
    const locationMatch = text.match(
      /\bLocation:\s*([^,\n]+),\s*([A-Z]{2})\b/i,
    );

    if (locationMatch) {
      city = locationMatch[1].trim();
      region = locationMatch[2].trim();
    }
  }

  return {
    city,
    region,
    country,
    countryCode: null,
    remoteType: detectRemoteType(job),
  };
}

/* =========================================================
   HIMALAYAS PROVIDER
========================================================= */

class HimalayasProvider extends JobProvider {
  constructor() {
    super('himalayas');
  }

  /* -------------------------------------------------------
     FETCH JOBS
  ------------------------------------------------------- */

  async fetchJobs({
    limit = 20,
    cursor = null,
  } = {}) {
    const params = new URLSearchParams();

    params.set(
      'limit',
      String(Math.min(Math.max(limit, 1), 20)),
    );

    if (cursor) {
      params.set('cursor', cursor);
    }

    const url = `${HIMALAYAS_API_URL}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Himalayas API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.jobs)) {
      throw new Error(
        'Himalayas API returned an invalid jobs response.',
      );
    }

    const jobs = data.jobs
      .map((job) => this.normalizeJob(job))
      .filter(Boolean);

    return {
      jobs,
      nextCursor: data.nextCursor ?? null,
      totalCount:
        data.totalCount ?? jobs.length,
    };
  }

  /* -------------------------------------------------------
     NORMALIZE ONE JOB
  ------------------------------------------------------- */

  normalizeJob(job) {
    const sourceJobId =
      job.guid ||
      job.id ||
      job.applicationLink ||
      null;

    if (
      !sourceJobId ||
      !job.title ||
      !job.description
    ) {
      return null;
    }

    const requiredSkills =
      extractSkills(job);

    const responsibilities =
      extractListItems(
        job.description,
        /<h[1-6][^>]*>\s*(?:what you['â€™]ll do|responsibilities|your responsibilities)\s*:?\s*<\/h[1-6]>/i,
      );

    const qualifications =
      extractListItems(
        job.description,
        /<h[1-6][^>]*>\s*(?:what we['â€™]re looking for|qualifications|requiredqualifications)\s*:?\s*<\/h[1-6]>/i,
      );

    const preferredSkills =
      extractPreferredSkills(job);

    return normalizeExternalJob(
      {
        sourceJobId: String(sourceJobId),

        title: job.title,

        description: job.description,

        companyName:
          job.companyName || null,

        location:
          extractLocation(job),

        employmentType:
          job.employmentType || null,

        salary: {
          minimum:
            job.minSalary ?? undefined,

          maximum:
            job.maxSalary ?? undefined,

          currency:
            job.currency || null,

          period:
            job.salaryPeriod || 'year',

          isDisclosed:
            job.minSalary != null ||
            job.maxSalary != null,
        },

        requiredSkills,

        preferredSkills,

        minimumExperience:
          extractExperience(
            job.description,
          ),

        educationRequirements:
          extractEducation(
            job.description,
          ),

        responsibilities:
          responsibilities.length > 0
            ? responsibilities
            : qualifications,

        sourceUrl:
          job.guid ||
          job.applicationLink ||
          null,

        externalApplyUrl:
          job.applicationLink ||
          job.guid ||
          null,

        externalExpiresAt:
          job.expiryDate
            ? new Date(
                job.expiryDate * 1000,
              )
            : null,
      },
      this.name,
    );
  }
}

/* =========================================================
   EXPORT PROVIDER
========================================================= */

export const himalayasProvider =
  new HimalayasProvider();
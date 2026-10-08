import { normalizeSkillName } from './job-matching.service.js';
import { SKILL_ALIASES, SKILL_DISPLAY_NAMES } from './matching.config.js';

export const RESUME_PARSER_VERSION = 'rule-based-1.0';
export const FIELD_CONFIDENCE_THRESHOLD = 0.7;

const skillCatalog = new Map();
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  const label = SKILL_DISPLAY_NAMES[canonical] ?? canonical;
  skillCatalog.set(normalizeSkillName(canonical), label);
  for (const alias of aliases) skillCatalog.set(normalizeSkillName(alias), label);
}
for (const name of [
  'Python', 'Java', 'C', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust',
  'HTML', 'CSS', 'Angular', 'Svelte', 'Express', 'Django', 'Flask',
  'FastAPI', 'Laravel', 'Rails', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch',
  'Docker', 'Kubernetes', 'Git', 'Linux', 'Jenkins', 'Terraform',
  'GraphQL', 'SQL', 'NoSQL', 'HTML5', 'CSS3', 'Apache Kafka', 'RabbitMQ',
  'Jest', 'Cypress', 'Playwright', 'Pandas', 'NumPy', 'TensorFlow',
  'PyTorch', 'Scikit-learn', 'Power BI', 'Tableau', 'Figma', 'Agile',
]) {
  skillCatalog.set(normalizeSkillName(name), name);
}

const sectionAliases = new Map([
  ['skills', 'skills'],
  ['technical skills', 'skills'],
  ['core competencies', 'skills'],
  ['technologies', 'skills'],
  ['education', 'education'],
  ['academic background', 'education'],
  ['work experience', 'experience'],
  ['professional experience', 'experience'],
  ['experience', 'experience'],
  ['employment history', 'experience'],
  ['work history', 'experience'],
  ['projects', 'projects'],
  ['personal projects', 'projects'],
  ['certifications', 'certifications'],
  ['certificates', 'certifications'],
  ['licenses and certifications', 'certifications'],
]);

const degreeLevels = [
  { level: 'doctorate', pattern: /\b(ph\.?\s*d\.?|doctor(?:ate)?|dphil)\b/i },
  { level: 'master', pattern: /\b(master(?:'s)?|m\.?s\.?|m\.?sc\.?|mba|m\.?eng\.?)\b/i },
  { level: 'bachelor', pattern: /\b(bachelor(?:'s)?|b\.?s\.?|b\.?sc\.?|b\.?a\.?|b\.?eng\.?)\b/i },
  { level: 'associate', pattern: /\b(associate(?:'s)?|a\.?s\.?|a\.?a\.?)\b/i },
  { level: 'diploma', pattern: /\b(diploma|certificate program)\b/i },
  { level: 'high-school', pattern: /\b(high school|secondary school|ged)\b/i },
];

const monthPattern = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

function cleanLine(value) {
  return value.replace(/^[\s•●▪◦*-]+/, '').replace(/\s+/g, ' ').trim();
}

function normalizedHeading(value) {
  return value.toLocaleLowerCase('en')
    .replace(/[:|]+$/, '')
    .replace(/[^a-z\s&]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSections(text) {
  const sections = { header: [] };
  let current = 'header';
  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (!line) continue;
    const heading = normalizedHeading(line);
    const section = sectionAliases.get(heading);
    if (section) {
      current = section;
      sections[current] ??= [];
      continue;
    }
    sections[current] ??= [];
    sections[current].push(line);
  }
  return sections;
}

function unknownField() {
  return { value: null, confidence: 0, status: 'unknown' };
}

function detectedField(value, confidence) {
  if (!value) return unknownField();
  return { value, confidence, status: confidence >= FIELD_CONFIDENCE_THRESHOLD ? 'detected' : 'review' };
}

function findName(lines) {
  const ignored = /resume|curriculum vitae|portfolio|linkedin|github|@|https?:\/\//i;
  for (const line of lines.slice(0, 8)) {
    const name = line.replace(/[|•].*$/, '').trim();
    const words = name.split(/\s+/);
    if (
      name.length >= 4 &&
      name.length <= 80 &&
      words.length >= 2 &&
      words.length <= 5 &&
      !ignored.test(name) &&
      /^[\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){1,4}$/u.test(name)
    ) return name;
  }
  return null;
}

function findPhone(text) {
  const candidates = text.match(/(?:\+\s?\d{1,3}[\s().-]*)?(?:\(?\d{2,4}\)?[\s.-]*)\d{3,4}[\s.-]*\d{3,4}/g) ?? [];
  return candidates.find((value) => value.replace(/\D/g, '').length >= 9 && value.replace(/\D/g, '').length <= 15)?.trim() ?? null;
}

function skillMatches(text, confidence) {
  const normalizedText = ` ${text.toLocaleLowerCase('en').replace(/[^\p{L}\p{N}+#.]+/gu, ' ')} `;
  const found = new Map();
  const orderedSkills = [...skillCatalog.values()].sort((a, b) => b.length - a.length);
  for (const displayName of orderedSkills) {
    const aliases = [displayName, ...Object.entries(SKILL_ALIASES)
      .filter(([canonical]) => normalizeSkillName(canonical) === normalizeSkillName(displayName))
      .flatMap(([, variants]) => variants)];
    const match = aliases.some((alias) => {
      const normalizedAlias = alias.toLocaleLowerCase('en').replace(/[^\p{L}\p{N}+#.]+/gu, ' ').trim();
      return normalizedAlias && normalizedText.includes(` ${normalizedAlias} `);
    });
    if (match) found.set(normalizeSkillName(displayName), { name: displayName, confidence });
  }
  return [...found.values()];
}

function extractSkills(sections, text) {
  const skillsSection = (sections.skills ?? []).join('\n');
  const sectionSkills = skillMatches(skillsSection, 0.92);
  const allSkills = skillMatches(text, 0.72);
  const merged = new Map(allSkills.map((skill) => [normalizeSkillName(skill.name), skill]));
  for (const skill of sectionSkills) merged.set(normalizeSkillName(skill.name), skill);
  return [...merged.values()];
}

function detectEducation(lines) {
  const institutions = lines.filter((line) => /\b(university|college|institute|school|polytechnic)\b/i.test(line));
  const entries = [];
  for (const line of lines) {
    const degree = degreeLevels.find(({ pattern }) => pattern.test(line));
    if (!degree) continue;
    const institution = institutions.find((value) => value !== line)
      ?? institutions.find((value) => value === line)
      ?? '';
    if (!institution) continue;
    const year = line.match(/\b(?:19|20)\d{2}\b/)?.[0]
      ?? institution.match(/\b(?:19|20)\d{2}\b/)?.[0];
    const field = line.match(/\bin\s+([\p{L}][\p{L}\p{N}& /-]{2,60})/iu)?.[1]?.trim();
    const cleanInstitution = institution.replace(/\s+\b(?:19|20)\d{2}\b.*$/, '').trim();
    if (!cleanInstitution) continue;
    entries.push({
      value: {
        institution: cleanInstitution,
        degree: line.replace(/\b(?:19|20)\d{2}\b/g, '').trim(),
        level: degree.level,
        ...(field ? { fieldOfStudy: field } : {}),
        ...(year ? { endYear: Number(year) } : {}),
      },
      confidence: 0.82,
    });
  }
  return [...new Map(entries.map((entry) => [
    `${entry.value.level}:${entry.value.institution.toLocaleLowerCase('en')}`,
    entry,
  ])).values()];
}

function parseResumeDate(value) {
  if (/present|current|now/i.test(value)) return { date: null, isCurrent: true };
  const year = value.match(/\b(?:19|20)\d{2}\b/)?.[0];
  if (!year) return null;
  const month = value.toLocaleLowerCase('en').match(new RegExp(`\\b(${monthPattern})\\b`))?.[1];
  const monthNumbers = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  const monthNumber = month ? monthNumbers[month.slice(0, 3)] : 1;
  return { date: `${year}-${String(monthNumber).padStart(2, '0')}-01`, isCurrent: false };
}

function extractExperience(lines) {
  const entries = [];
  const range = new RegExp(
    `(${monthPattern}\\s+)?(?:19|20)\\d{2}\\s*(?:-|–|—|to)\\s*(?:(${monthPattern}\\s+)?(?:19|20)\\d{2}|present|current|now)`,
    'i',
  );
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(range);
    if (!match) continue;
    const dates = match[0].split(/\s*(?:-|–|—|to)\s*/i);
    if (dates.length < 2) continue;
    const start = parseResumeDate(dates[0]);
    const end = parseResumeDate(dates[1]);
    if (!start) continue;
    let title = '';
    let employer = '';
    const leading = line.slice(0, match.index).replace(/[|,–—-]+$/, '').trim();
    const roleCompany = leading.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (roleCompany) {
      [, title, employer] = roleCompany;
    } else if (leading) {
      title = leading;
      employer = lines[index + 1] ?? '';
    } else if (index > 0 && index + 1 < lines.length) {
      title = lines[index - 1];
      employer = lines[index + 1];
    }
    title = cleanLine(title);
    employer = cleanLine(employer.replace(range, '').replace(/[|,–—-]+$/, ''));
    if (!title || !employer || title.length > 160 || employer.length > 200) continue;
    entries.push({
      value: {
        title,
        employer,
        startDate: start.date,
        ...(end?.date ? { endDate: end.date } : {}),
        isCurrent: Boolean(end?.isCurrent),
      },
      confidence: roleCompany ? 0.84 : 0.68,
      status: (roleCompany ? 0.84 : 0.68) >= FIELD_CONFIDENCE_THRESHOLD ? 'detected' : 'review',
    });
  }
  return [...new Map(entries.map(({ value, confidence, status }) => [
    `${value.title.toLowerCase()}:${value.employer.toLowerCase()}:${value.startDate}`,
    { value, confidence, status },
  ])).values()];
}

function extractProjects(lines) {
  return lines.flatMap((line) => {
    const match = line.match(/^(?:project\s*:\s*)?([A-Z][^|:]{2,100})\s*(?:\||:)\s*(.+)$/i);
    if (!match) return [];
    const name = cleanLine(match[1]);
    const technologies = skillMatches(match[2], 0.8).map(({ name: skill }) => skill);
    if (!name || !technologies.length) return [];
    return [{
      value: { name, description: match[2].trim(), technologies },
      confidence: 0.78,
    }];
  });
}

function extractCertifications(lines) {
  return lines.flatMap((line) => {
    const match = line.match(/^(?:[-•*]\s*)?(.{3,160}?)\s*(?:[,|–—-]\s*)(.+)$/);
    if (!match || !/\b(certified|certification|certificate|license|licensed)\b/i.test(match[1])) return [];
    return [{
      value: { name: cleanLine(match[1]), issuer: cleanLine(match[2]) },
      confidence: 0.76,
    }];
  });
}

export function parseResumeText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      parserVersion: RESUME_PARSER_VERSION,
      fields: { name: unknownField(), email: unknownField(), phone: unknownField() },
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    };
  }

  const normalizedText = text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');
  const lines = normalizedText.split('\n').map(cleanLine).filter(Boolean);
  const sections = splitSections(normalizedText);
  const name = findName(sections.header ?? lines.slice(0, 8));
  const email = normalizedText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? null;
  const phone = findPhone(normalizedText);
  return {
    parserVersion: RESUME_PARSER_VERSION,
    fields: {
      name: detectedField(name, name ? 0.86 : 0),
      email: detectedField(email, email ? 0.99 : 0),
      phone: detectedField(phone, phone ? 0.86 : 0),
    },
    skills: extractSkills(sections, normalizedText),
    education: detectEducation(sections.education ?? []),
    experience: extractExperience(sections.experience ?? []),
    projects: extractProjects(sections.projects ?? []),
    certifications: extractCertifications(sections.certifications ?? []),
  };
}

import CandidateProfile from '../models/candidate-profile.model.js';
import Skill from '../models/skill.model.js';

const PROFILE_COMPLETION_FIELDS = [
  ['name', (profile) => Boolean(profile.firstName && profile.lastName)],
  ['phone', (profile) => Boolean(profile.phone)],
  ['location', (profile) => Boolean(profile.location?.city || profile.location?.country)],
  ['headline', (profile) => Boolean(profile.headline)],
  ['bio', (profile) => Boolean(profile.summary)],
  ['skills', (profile) => profile.skills.length > 0],
  ['education', (profile) => profile.education.length > 0],
  ['experience', (profile) => profile.experience.length > 0],
  ['projects', (profile) => profile.projects.length > 0],
  ['certifications', (profile) => profile.certifications.length > 0],
  ['preferredRoles', (profile) => profile.preferredRoles.length > 0],
  ['preferredLocations', (profile) => profile.preferredLocations.length > 0],
  ['employmentTypes', (profile) => profile.preferredEmploymentTypes.length > 0],
];

export function normalizeSkillName(name) {
  return name
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[_\-\s]+/g, ' ')
    .replace(/[^\p{L}\p{N}+#. ]/gu, '')
    .replace(/\s+/g, ' ');
}

async function resolveSkill(name) {
  const normalizedName = normalizeSkillName(name);
  let skill = await Skill.findOne({
    $or: [{ normalizedName }, { aliases: normalizedName }],
    isActive: true,
  });
  if (skill) return skill;

  try {
    skill = await Skill.create({
      name: name.trim(),
      normalizedName,
      category: 'other',
    });
    return skill;
  } catch (error) {
    if (error.code !== 11000) throw error;
    skill = await Skill.findOne({ normalizedName, isActive: true });
    if (!skill) throw error;
    return skill;
  }
}

async function resolveSkillList(values) {
  const distinct = new Map();
  for (const value of values) {
    const name = typeof value === 'string' ? value : value.name;
    const normalizedName = normalizeSkillName(name);
    if (!distinct.has(normalizedName)) distinct.set(normalizedName, value);
  }

  const resolved = new Map();
  for (const value of distinct.values()) {
    const skillName = typeof value === 'string' ? value : value.name;
    const skill = await resolveSkill(skillName);
    if (!resolved.has(skill.id)) resolved.set(skill.id, skill);
  }
  return [...resolved.values()];
}

function completionFor(profile) {
  const completed = PROFILE_COMPLETION_FIELDS
    .filter(([, isComplete]) => isComplete(profile))
    .map(([field]) => field);
  return {
    percentage: Math.round((completed.length / PROFILE_COMPLETION_FIELDS.length) * 100),
    completed,
    remaining: PROFILE_COMPLETION_FIELDS
      .map(([field]) => field)
      .filter((field) => !completed.includes(field)),
    total: PROFILE_COMPLETION_FIELDS.length,
  };
}

async function presentProfile(profile) {
  await profile.populate([
    { path: 'skills.skill', select: 'name normalizedName' },
    { path: 'experience.skills', select: 'name normalizedName' },
    { path: 'projects.skills', select: 'name normalizedName' },
  ]);
  const data = profile.toObject({ versionKey: false });
  data.skills = data.skills
    .filter(({ skill }) => skill)
    .map(({ skill, ...entry }) => ({ ...entry, name: skill.name }));
  data.experience = data.experience.map(({ skills, ...entry }) => ({
    ...entry,
    technologies: skills.filter(Boolean).map(({ name }) => name),
  }));
  data.projects = data.projects.map(({ skills, ...entry }) => ({
    ...entry,
    technologies: skills.filter(Boolean).map(({ name }) => name),
  }));
  data.completion = completionFor(data);
  return data;
}

export async function getCandidateProfile(userId) {
  const profile = await CandidateProfile.findOne({ user: userId });
  return profile ? presentProfile(profile) : null;
}

export async function updateCandidateProfile(userId, changes) {
  const profile = await CandidateProfile.findOne({ user: userId });
  if (!profile) return null;

  const scalarFields = [
    'firstName',
    'lastName',
    'phone',
    'location',
    'headline',
    'summary',
    'education',
    'experience',
    'projects',
    'certifications',
    'preferredRoles',
    'preferredLocations',
    'preferredEmploymentTypes',
    'profileVisibility',
  ];

  for (const field of scalarFields) {
    if (Object.hasOwn(changes, field)) profile.set(field, changes[field]);
  }

  if (Object.hasOwn(changes, 'skills')) {
    const skills = await resolveSkillList(changes.skills);
    const requestedBySkill = new Map();
    for (const entry of changes.skills) {
      const name = typeof entry === 'string' ? entry : entry.name;
      const skill = await resolveSkill(name);
      if (!requestedBySkill.has(skill.id)) requestedBySkill.set(skill.id, entry);
    }
    const previous = new Map(
      profile.skills.map((entry) => [entry.skill.toString(), entry]),
    );
    profile.skills = skills.map((skill) => {
      const existing = previous.get(skill.id);
      const requested = requestedBySkill.get(skill.id);
      const proficiency = typeof requested === 'string' ? undefined : requested?.proficiency;
      const yearsExperience = typeof requested === 'string' ? undefined : requested?.yearsExperience;
      return {
        skill: skill._id,
        proficiency: proficiency ?? existing?.proficiency ?? 'intermediate',
        yearsExperience: yearsExperience ?? existing?.yearsExperience ?? 0,
      };
    });
  }

  if (Object.hasOwn(changes, 'experience')) {
    const technologiesByEntry = changes.experience.map((entry) => entry.technologies ?? []);
    for (let index = 0; index < profile.experience.length; index += 1) {
      profile.experience[index].skills = await resolveSkillList(technologiesByEntry[index]);
    }
  }

  if (Object.hasOwn(changes, 'projects')) {
    for (let index = 0; index < profile.projects.length; index += 1) {
      profile.projects[index].skills = await resolveSkillList(changes.projects[index].technologies ?? []);
    }
  }

  await profile.save();
  return presentProfile(profile);
}

export { completionFor };

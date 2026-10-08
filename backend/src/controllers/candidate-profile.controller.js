import {
  getCandidateProfile,
  updateCandidateProfile,
} from '../services/candidate-profile.service.js';
import { emitUpdatedRecommendations } from '../services/recommendation.service.js';

const RECOMMENDATION_FIELDS = [
  'skills',
  'experience',
  'education',
  'projects',
  'preferredRoles',
  'preferredLocations',
  'location',
];

function recommendationSnapshot(profile) {
  return {
    skills: profile.skills.map(({ name, proficiency, yearsExperience }) => ({ name, proficiency, yearsExperience })),
    experience: profile.experience.map(({ employer, title, startDate, endDate, isCurrent, description, technologies }) => ({
      employer, title, startDate, endDate, isCurrent, description, technologies,
    })),
    education: profile.education.map(({ institution, degree, fieldOfStudy, level, startYear, endYear, isCurrent }) => ({
      institution, degree, fieldOfStudy, level, startYear, endYear, isCurrent,
    })),
    projects: profile.projects.map(({ name, description, technologies }) => ({ name, description, technologies })),
    preferredRoles: profile.preferredRoles,
    preferredLocations: profile.preferredLocations,
    location: profile.location,
  };
}

export async function readProfile(req, res, next) {
  try {
    const profile = await getCandidateProfile(req.auth.id);
    if (!profile) {
      res.status(404).json({ error: { message: 'Candidate profile was not found.' } });
      return;
    }
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function editProfile(req, res, next) {
  try {
    const previous = await getCandidateProfile(req.auth.id);
    const profile = await updateCandidateProfile(req.auth.id, req.validatedProfile);
    if (!profile) {
      res.status(404).json({ error: { message: 'Candidate profile was not found.' } });
      return;
    }
    const relevantChange = previous
      && RECOMMENDATION_FIELDS.some((field) => Object.hasOwn(req.validatedProfile, field))
      && JSON.stringify(recommendationSnapshot(previous)) !== JSON.stringify(recommendationSnapshot(profile));
    if (relevantChange) await emitUpdatedRecommendations(req.auth.id, 'profile');
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

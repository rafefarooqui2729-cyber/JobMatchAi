import assert from 'node:assert/strict';
import test from 'node:test';
import { MATCHING_WEIGHTS, MATCHING_WEIGHT_TOTAL } from '../src/services/matching.config.js';
import {
  calculateMatch,
  classifyMatchStrength,
  normalizeSkillName,
} from '../src/services/job-matching.service.js';

const perfectCandidate = {
  skills: ['JS', 'Node.js', 'React'],
  experience: [{ startDate: '2021-01-01', endDate: '2025-01-01' }],
  education: [{ level: 'bachelor', fieldOfStudy: 'Computer Science' }],
  projects: [{ name: 'React Node.js analytics API', technologies: ['React.js', 'Node', 'JavaScript'] }],
  preferredLocations: [{ city: 'Seattle', country: 'United States', countryCode: 'US', remoteType: 'hybrid' }],
};

const perfectJob = {
  title: 'React Node.js Engineer',
  description: 'Build analytics services using JavaScript and Node.js.',
  responsibilities: ['Develop React interfaces'],
  requiredSkills: ['JavaScript', 'Node'],
  preferredSkills: ['React.js'],
  minimumExperience: 2,
  maximumExperience: 6,
  educationRequirements: [{ minimumLevel: 'bachelor', fieldsOfStudy: ['Computer Science'], isRequired: true }],
  location: { city: 'Seattle', country: 'United States', countryCode: 'US', remoteType: 'hybrid' },
};

test('uses one centralized, complete set of weights totaling 100', () => {
  assert.deepEqual(MATCHING_WEIGHTS, {
    skills: 50,
    experience: 20,
    education: 15,
    projects: 10,
    location: 5,
  });
  assert.equal(Object.values(MATCHING_WEIGHTS).reduce((sum, weight) => sum + weight, 0), 100);
  assert.equal(MATCHING_WEIGHT_TOTAL, 100);
});

test('normalizes common skill aliases and spelling variations', () => {
  assert.equal(normalizeSkillName('Javascript'), 'javascript');
  assert.equal(normalizeSkillName('JS'), 'javascript');
  assert.equal(normalizeSkillName('Node'), 'node.js');
  assert.equal(normalizeSkillName('Node JS'), 'node.js');
  assert.equal(normalizeSkillName('React.js'), 'react.js');
  assert.equal(normalizeSkillName('Postgres'), 'postgresql');
});

test('returns a perfect score for a complete match with normalized skills', () => {
  const result = calculateMatch(perfectCandidate, perfectJob);
  assert.equal(result.overallScore, 100);
  assert.equal(result.matchStrength, 'Excellent');
  assert.deepEqual(result.categoryScores, {
    skills: 100,
    experience: 100,
    education: 100,
    projects: 100,
    location: 100,
  });
  assert.deepEqual(result.matchedSkills, ['JavaScript', 'Node', 'React.js']);
  assert.match(result.explanation, /all required skills matched/);
});

test('returns a bounded partial score and identifies missing skills', () => {
  const result = calculateMatch(
    { skills: ['JavaScript'] },
    {
      requiredSkills: ['JavaScript', 'Node.js'],
      preferredSkills: ['React'],
      minimumExperience: 2,
      location: { city: 'Seattle', remoteType: 'onsite' },
    },
  );
  assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
  assert.equal(result.missingRequiredSkills[0], 'Node.js');
  assert.equal(result.missingPreferredSkills[0], 'React');
  assert.ok(result.categoryScores.skills < 60);
  assert.ok(result.explanation.includes('missing required skills: Node.js'));
});

test('scores no candidate skills as zero when the job lists skills', () => {
  const result = calculateMatch({}, { requiredSkills: ['JavaScript'], preferredSkills: ['React'] });
  assert.equal(result.categoryScores.skills, 0);
  assert.deepEqual(result.missingRequiredSkills, ['JavaScript']);
  assert.deepEqual(result.missingPreferredSkills, ['React']);
});

test('does not penalize candidate skills that exceed the job requirements', () => {
  const result = calculateMatch(
    { skills: ['JavaScript', 'Node.js', 'React', 'PostgreSQL', 'Docker'] },
    { requiredSkills: ['JavaScript', 'Node'] },
  );
  assert.equal(result.categoryScores.skills, 100);
});

test('required skills carry four times the importance of preferred skills', () => {
  const onlyPreferred = calculateMatch(
    { skills: ['React'] },
    { requiredSkills: ['JavaScript'], preferredSkills: ['React'] },
  );
  const onlyRequired = calculateMatch(
    { skills: ['JavaScript'] },
    { requiredSkills: ['JavaScript'], preferredSkills: ['React'] },
  );
  assert.equal(onlyPreferred.categoryScores.skills, 20);
  assert.equal(onlyRequired.categoryScores.skills, 80);
  assert.ok(onlyRequired.overallScore > onlyPreferred.overallScore);
});

test('handles missing experience without throwing and reports no evidence', () => {
  const result = calculateMatch({}, { minimumExperience: 3 });
  assert.equal(result.categoryScores.experience, 0);
  assert.match(result.explanation, /could not be verified/);
});

test('handles missing education with an unmet education requirement', () => {
  const result = calculateMatch({}, {
    educationRequirements: [{ minimumLevel: 'bachelor', fieldsOfStudy: ['Computer Science'] }],
  });
  assert.equal(result.categoryScores.education, 0);
});

test('scores project technologies against the job skill set and safely handles no projects', () => {
  const withRelevantProject = calculateMatch(
    { projects: [{ name: 'Web app', technologies: ['JS', 'React'] }] },
    { title: 'Frontend Engineer', requiredSkills: ['JavaScript', 'React'] },
  );
  const withoutProject = calculateMatch(
    {},
    { title: 'Frontend Engineer', requiredSkills: ['JavaScript', 'React'] },
  );
  assert.equal(withRelevantProject.categoryScores.projects, 100);
  assert.equal(withoutProject.categoryScores.projects, 0);
});

test('handles missing location without throwing and scores a remote role safely', () => {
  const onsite = calculateMatch({}, { location: { city: 'Seattle', remoteType: 'onsite' } });
  const remote = calculateMatch({}, { location: { remoteType: 'remote' } });
  assert.equal(onsite.categoryScores.location, 0);
  assert.equal(remote.categoryScores.location, 100);
});

test('does not present an underspecified job as a perfect match', () => {
  const neutral = calculateMatch({}, {});
  assert.equal(neutral.categoryScores.projects, 100, 'projects are neutral when the job offers no relevance signals');
  assert.equal(neutral.overallScore, 0);
  assert.equal(neutral.criteriaCoverage, 0);
  assert.equal(neutral.matchConfidence, 'low');
  assert.match(neutral.explanation, /Criteria coverage is 0%/);
  for (const score of [neutral.overallScore, ...Object.values(neutral.categoryScores)]) {
    assert.ok(score >= 0 && score <= 100);
  }
});

test('optional education requirements do not constrain or lower a match', () => {
  const optional = calculateMatch(
    {},
    { educationRequirements: [{ minimumLevel: 'doctorate', isRequired: false }] },
  );
  const required = calculateMatch(
    {},
    { educationRequirements: [{ minimumLevel: 'doctorate', isRequired: true }] },
  );
  assert.equal(optional.categoryScores.education, 100);
  assert.equal(optional.meaningfulCriteria.education, false);
  assert.equal(optional.criteriaCoverage, 0);
  assert.equal(required.categoryScores.education, 0);
  assert.equal(required.meaningfulCriteria.education, true);
  assert.equal(required.criteriaCoverage, 15);
  assert.equal(required.overallScore, 0);
});

test('classifies match strength using the specified score bands', () => {
  assert.equal(classifyMatchStrength(100), 'Excellent');
  assert.equal(classifyMatchStrength(90), 'Excellent');
  assert.equal(classifyMatchStrength(89), 'Strong');
  assert.equal(classifyMatchStrength(75), 'Strong');
  assert.equal(classifyMatchStrength(74), 'Good');
  assert.equal(classifyMatchStrength(60), 'Good');
  assert.equal(classifyMatchStrength(59), 'Partial');
  assert.equal(classifyMatchStrength(40), 'Partial');
  assert.equal(classifyMatchStrength(39), 'Low');
  assert.equal(classifyMatchStrength(-5), 'Low');
});

test('normalizes and deduplicates aliases on both sides without duplicate credit', () => {
  const result = calculateMatch(
    { skills: [' JS ', { name: 'JavaScript' }, 'React.js'] },
    { requiredSkills: ['JavaScript', 'JS'], preferredSkills: ['React', 'React.js'] },
  );
  assert.equal(result.categoryScores.skills, 100);
  assert.deepEqual(result.matchedSkills, ['JavaScript', 'React']);
  assert.deepEqual(result.missingRequiredSkills, []);
  assert.deepEqual(result.missingPreferredSkills, []);
});

test('scores preferred-only roles from preferred skills and treats unrelated candidate skills as neutral', () => {
  const matched = calculateMatch({ skills: ['React'] }, { preferredSkills: ['React', 'TypeScript'] });
  const unmatched = calculateMatch({ skills: ['Go'] }, { preferredSkills: ['React'] });
  assert.equal(matched.categoryScores.skills, 50);
  assert.deepEqual(matched.missingPreferredSkills, ['TypeScript']);
  assert.equal(unmatched.categoryScores.skills, 0);
  assert.equal(calculateMatch({ skills: ['Go'] }, {}).categoryScores.skills, 100);
});

test('uses the documented 80/20 split for required and preferred skills', () => {
  const requiredOnly = calculateMatch(
    { skills: ['JavaScript'] },
    { requiredSkills: ['JavaScript', 'Node.js'], preferredSkills: ['React'] },
  );
  const preferredOnly = calculateMatch(
    { skills: ['React'] },
    { requiredSkills: ['JavaScript'], preferredSkills: ['React', 'Node.js'] },
  );
  assert.equal(requiredOnly.categoryScores.skills, 40);
  assert.equal(preferredOnly.categoryScores.skills, 10);
});

test('scores experience requirements linearly below the minimum and inclusively within bounds', () => {
  assert.equal(
    calculateMatch({ totalExperienceYears: 2 }, { minimumExperience: 4 }).categoryScores.experience,
    50,
  );
  assert.equal(
    calculateMatch({ totalExperienceYears: 3 }, { minimumExperience: 3, maximumExperience: 5 }).categoryScores.experience,
    100,
  );
  assert.equal(
    calculateMatch({ totalExperienceYears: 5 }, { minimumExperience: 3, maximumExperience: 5 }).categoryScores.experience,
    100,
  );
});

test('applies a bounded, deterministic penalty for experience above the stated maximum', () => {
  const within = calculateMatch({ experienceYears: 4 }, { maximumExperience: 4 });
  const above = calculateMatch({ experienceYears: 7 }, { maximumExperience: 4 });
  const farAbove = calculateMatch({ experienceYears: 100 }, { maximumExperience: 4 });
  assert.equal(within.categoryScores.experience, 100);
  assert.equal(above.categoryScores.experience, 63);
  assert.equal(farAbove.categoryScores.experience, 50);
});

test('unions overlapping experience intervals rather than double-counting time', () => {
  const result = calculateMatch(
    {
      experience: [
        { startDate: '2020-01-01', endDate: '2021-01-01' },
        { startDate: '2020-06-01', endDate: '2022-01-01' },
      ],
    },
    { minimumExperience: 2, maximumExperience: 2 },
  );
  assert.equal(result.categoryScores.experience, 100);
});

test('handles invalid, reversed, and absent experience dates without producing invalid scores', () => {
  const result = calculateMatch(
    { experience: [{ startDate: 'not-a-date', endDate: '2025-01-01' }, { startDate: '2025-01-01', endDate: '2020-01-01' }] },
    { minimumExperience: 1 },
  );
  assert.equal(result.categoryScores.experience, 0);
  assert.ok(Number.isFinite(result.overallScore));
});

test('accepts higher education levels and chooses the best matching education record', () => {
  const result = calculateMatch(
    {
      education: [
        { level: 'associate', fieldOfStudy: 'History' },
        { level: 'master', fieldOfStudy: 'Computer Science' },
      ],
    },
    { educationRequirements: [{ minimumLevel: 'bachelor', fieldsOfStudy: ['Computer Science'] }] },
  );
  assert.equal(result.categoryScores.education, 100);
});

test('scores education level and field-of-study evidence independently', () => {
  const result = calculateMatch(
    { education: [{ level: 'bachelor', fieldOfStudy: 'History' }] },
    { educationRequirements: [{ minimumLevel: 'bachelor', fieldsOfStudy: ['Computer Science'] }] },
  );
  assert.equal(result.categoryScores.education, 70);
});

test('averages separate education requirements and gives no evidence a zero score', () => {
  const missing = calculateMatch(
    {},
    { educationRequirements: [{ minimumLevel: 'bachelor' }, { minimumLevel: 'doctorate' }] },
  );
  const partial = calculateMatch(
    { education: [{ level: 'bachelor', fieldOfStudy: 'Computer Science' }] },
    { educationRequirements: [{ minimumLevel: 'bachelor' }, { minimumLevel: 'doctorate' }] },
  );
  assert.equal(missing.categoryScores.education, 0);
  assert.equal(partial.categoryScores.education, 88);
});

test('matches city, country, region, and remote preferences without allowing remote-only onsite matches', () => {
  const city = calculateMatch(
    { preferredLocations: [{ city: 'Seattle', country: 'US', remoteType: 'hybrid' }] },
    { location: { city: 'Seattle', country: 'United States', remoteType: 'onsite' } },
  );
  const country = calculateMatch(
    { preferredLocations: [{ countryCode: 'US' }] },
    { location: { country: 'United States', countryCode: 'US', remoteType: 'onsite' } },
  );
  const remoteConflict = calculateMatch(
    { preferredLocations: [{ remoteType: 'remote' }] },
    { location: { city: 'Seattle', country: 'United States', remoteType: 'onsite' } },
  );
  assert.equal(city.categoryScores.location, 100);
  assert.equal(country.categoryScores.location, 85);
  assert.equal(remoteConflict.categoryScores.location, 0);
});

test('calculates overall score from configured weights and returns valid values for malformed profile data', () => {
  const result = calculateMatch(
    { skills: 'not-an-array', projects: [null], education: [null], preferredLocations: [null] },
    { requiredSkills: ['JavaScript'], educationRequirements: [null], location: null },
  );
  const weighted = Object.entries(result.categoryScores).reduce(
    (sum, [category, score]) => sum + (result.meaningfulCriteria[category] ? score * MATCHING_WEIGHTS[category] : 0),
    0,
  ) / MATCHING_WEIGHT_TOTAL;
  assert.equal(result.overallScore, Math.round(weighted));
  for (const score of [result.overallScore, ...Object.values(result.categoryScores)]) {
    assert.ok(Number.isInteger(score) && score >= 0 && score <= 100);
  }
  assert.ok(result.explanation.length > 0);
});

test('remains deterministic and bounded over varied skill, experience, and location inputs', () => {
  const skills = ['JavaScript', 'TypeScript', 'Node.js', 'React', 'SQL'];
  for (let index = 0; index < 100; index += 1) {
    const candidate = {
      skills: skills.filter((_, skillIndex) => (index + skillIndex) % 3 === 0),
      totalExperienceYears: index / 3,
      preferredLocations: index % 2 ? [{ city: 'Seattle', remoteType: 'hybrid' }] : [],
    };
    const job = {
      requiredSkills: skills.filter((_, skillIndex) => (index + skillIndex) % 2 === 0),
      preferredSkills: skills.filter((_, skillIndex) => (index + skillIndex) % 4 === 0),
      minimumExperience: index % 7,
      maximumExperience: index % 7 + 4,
      location: { city: 'Seattle', remoteType: index % 2 ? 'hybrid' : 'onsite' },
    };
    const first = calculateMatch(candidate, job);
    const second = calculateMatch(candidate, job);
    assert.deepEqual(first, second);
    assert.ok(first.overallScore >= 0 && first.overallScore <= 100);
    assert.ok(Object.values(first.categoryScores).every((score) => Number.isInteger(score) && score >= 0 && score <= 100));
  }
});

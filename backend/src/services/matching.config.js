export const MATCHING_WEIGHTS = Object.freeze({
  skills: 50,
  experience: 20,
  education: 15,
  projects: 10,
  location: 5,
});

export const MATCHING_WEIGHT_TOTAL = Object.values(MATCHING_WEIGHTS)
  .reduce((total, weight) => total + weight, 0);

export const MATCH_STRENGTHS = Object.freeze([
  { minimum: 90, label: 'Excellent' },
  { minimum: 75, label: 'Strong' },
  { minimum: 60, label: 'Good' },
  { minimum: 40, label: 'Partial' },
  { minimum: 0, label: 'Low' },
]);

export const SKILL_ALIASES = Object.freeze({
  javascript: ['javascript', 'js', 'ecmascript', 'es6', 'es2015'],
  typescript: ['typescript', 'ts'],
  'node.js': ['node.js', 'nodejs', 'node', 'node js'],
  'react.js': ['react.js', 'reactjs', 'react'],
  'vue.js': ['vue.js', 'vuejs', 'vue'],
  'next.js': ['next.js', 'nextjs', 'next'],
  postgresql: ['postgresql', 'postgres', 'psql'],
  mongodb: ['mongodb', 'mongo'],
  'c++': ['c++', 'cplusplus'],
  'c#': ['c#', 'c sharp', 'csharp'],
  '.net': ['.net', 'dotnet', 'dot net'],
  'asp.net': ['asp.net', 'aspnet', 'asp net'],
  'spring boot': ['spring boot', 'springboot'],
  'spring framework': ['spring framework', 'spring'],
  'amazon web services': ['amazon web services', 'aws'],
  'google cloud platform': ['google cloud platform', 'gcp', 'google cloud'],
  'microsoft azure': ['microsoft azure', 'azure'],
  'machine learning': ['machine learning', 'ml'],
  'artificial intelligence': ['artificial intelligence', 'ai'],
  'rest api': ['rest api', 'rest apis', 'restful api', 'restful apis'],
});

export const SKILL_DISPLAY_NAMES = Object.freeze({
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  'node.js': 'Node.js',
  'react.js': 'React.js',
  'vue.js': 'Vue.js',
  'next.js': 'Next.js',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  'c++': 'C++',
  'c#': 'C#',
  '.net': '.NET',
  'asp.net': 'ASP.NET',
  'spring boot': 'Spring Boot',
  'spring framework': 'Spring Framework',
  'amazon web services': 'Amazon Web Services',
  'google cloud platform': 'Google Cloud Platform',
  'microsoft azure': 'Microsoft Azure',
  'machine learning': 'Machine Learning',
  'artificial intelligence': 'Artificial Intelligence',
  'rest api': 'REST API',
});

/**
 * Keyword matching shared by the frontend (job-description match) and the server (checking that
 * tailored skills are backed by the resume). Pure functions, no dependencies.
 */

/** Different spellings of the same skill. Keys are the display names. */
const ALIASES: Record<string, string[]> = {
  JavaScript: ['javascript', 'js', 'es6'],
  TypeScript: ['typescript', 'ts'],
  'Node.js': ['node.js', 'nodejs', 'node'],
  'React.js': ['react.js', 'reactjs', 'react'],
  'Next.js': ['next.js', 'nextjs'],
  'Vue.js': ['vue.js', 'vuejs', 'vue'],
  Angular: ['angular', 'angularjs'],
  'Express.js': ['express.js', 'expressjs', 'express'],
  MongoDB: ['mongodb', 'mongo'],
  PostgreSQL: ['postgresql', 'postgres'],
  MySQL: ['mysql'],
  SQL: ['sql'],
  NoSQL: ['nosql'],
  Redis: ['redis'],
  GraphQL: ['graphql'],
  'REST APIs': ['rest api', 'rest apis', 'restful', 'rest'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3'],
  'Tailwind CSS': ['tailwind css', 'tailwindcss', 'tailwind'],
  Python: ['python'],
  Java: ['java'],
  'C++': ['c++', 'cpp'],
  'C#': ['c#', 'csharp'],
  Go: ['golang'],
  Rust: ['rust'],
  Kotlin: ['kotlin'],
  Swift: ['swift'],
  PHP: ['php'],
  Django: ['django'],
  Flask: ['flask'],
  FastAPI: ['fastapi'],
  'Spring Boot': ['spring boot', 'springboot'],
  '.NET': ['.net', 'dotnet', 'asp.net'],
  AWS: ['aws', 'amazon web services'],
  Azure: ['azure'],
  GCP: ['gcp', 'google cloud'],
  Docker: ['docker'],
  Kubernetes: ['kubernetes', 'k8s'],
  'CI/CD': ['ci/cd', 'continuous integration', 'continuous delivery'],
  Git: ['git'],
  GitHub: ['github'],
  Linux: ['linux'],
  Firebase: ['firebase'],
  Supabase: ['supabase'],
  Redux: ['redux'],
  Jest: ['jest'],
  Vitest: ['vitest'],
  Cypress: ['cypress'],
  Playwright: ['playwright'],
  'Unit Testing': ['unit testing', 'unit tests'],
  Microservices: ['microservices', 'microservice'],
  'System Design': ['system design'],
  'Data Structures': ['data structures'],
  Algorithms: ['algorithms'],
  OOP: ['oop', 'object-oriented', 'object oriented'],
  'Machine Learning': ['machine learning', 'ml'],
  'Deep Learning': ['deep learning'],
  NLP: ['nlp', 'natural language processing'],
  LLMs: ['llm', 'llms', 'large language models'],
  'Prompt Engineering': ['prompt engineering'],
  RAG: ['rag', 'retrieval-augmented generation', 'retrieval augmented generation'],
  'OpenAI API': ['openai api', 'openai'],
  TensorFlow: ['tensorflow'],
  PyTorch: ['pytorch'],
  Pandas: ['pandas'],
  NumPy: ['numpy'],
  'Power BI': ['power bi', 'powerbi'],
  Tableau: ['tableau'],
  Excel: ['excel'],
  Figma: ['figma'],
  Agile: ['agile'],
  Scrum: ['scrum'],
  Jira: ['jira'],
  WebSockets: ['websockets', 'websocket', 'socket.io'],
  'Responsive Design': ['responsive design', 'responsive web design', 'mobile-first'],
  Accessibility: ['accessibility', 'a11y', 'wcag'],
  Communication: ['communication skills', 'communication'],
  Leadership: ['leadership'],
  'Problem Solving': ['problem solving', 'problem-solving'],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * True if `term` appears in `text` as a whole word/phrase. Letters and digits count as word
 * characters, so "java" doesn't match "javascript" but "c++" and "node.js" work.
 */
export function containsTerm(text: string, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return false;
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(t)}(?![a-z0-9])`, 'i');
  return pattern.test(text);
}

function variantsOf(skill: string): string[] {
  const direct = ALIASES[skill];
  if (direct) return direct;
  const lower = skill.trim().toLowerCase();
  for (const [name, variants] of Object.entries(ALIASES)) {
    if (name.toLowerCase() === lower || variants.includes(lower)) return variants;
  }
  return [lower];
}

/** True if the text mentions the skill under any known spelling. */
export function mentionsSkill(text: string, skill: string): boolean {
  return variantsOf(skill).some((v) => containsTerm(text, v));
}

/**
 * Spellings that are also ordinary English words or too short to trust ("express interest",
 * "the rest of the team", "excel in"). They still count when checking a resume for a skill, but
 * are never used to detect skills in a job description.
 */
const AMBIGUOUS = new Set(['express', 'rest', 'node', 'excel', 'swift', 'rust', 'js', 'ts', 'ml', 'go']);

function isReliableVariant(variant: string): boolean {
  if (AMBIGUOUS.has(variant)) return false;
  return variant.length > 2 || /[^a-z]/.test(variant);
}

/** Known skills mentioned in a job description, plus any of the candidate's own skills it mentions. */
export function extractJobKeywords(jobDescription: string, candidateSkills: readonly string[] = []): string[] {
  const found = new Map<string, string>();
  for (const [name, variants] of Object.entries(ALIASES)) {
    if (variants.some((v) => isReliableVariant(v) && containsTerm(jobDescription, v))) {
      found.set(name.toLowerCase(), name);
    }
  }
  for (const skill of candidateSkills) {
    const key = skill.trim().toLowerCase();
    if (key && !found.has(key) && !findAliasName(skill) && containsTerm(jobDescription, skill)) {
      found.set(key, skill.trim());
    }
  }
  return [...found.values()];
}

function findAliasName(skill: string): string | null {
  const lower = skill.trim().toLowerCase();
  for (const [name, variants] of Object.entries(ALIASES)) {
    if (name.toLowerCase() === lower || variants.includes(lower)) return name;
  }
  return null;
}

export interface KeywordMatch {
  matched: string[];
  missing: string[];
  /** Percentage of job keywords found in the resume, or null if the job description had none we recognize. */
  coverage: number | null;
}

/** Deterministic keyword coverage of a job description by a resume's text. */
export function matchKeywords(jobDescription: string, resumeText: string, candidateSkills: readonly string[] = []): KeywordMatch {
  const keywords = extractJobKeywords(jobDescription, candidateSkills);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const keyword of keywords) {
    (mentionsSkill(resumeText, keyword) ? matched : missing).push(keyword);
  }
  const coverage = keywords.length ? Math.round((matched.length / keywords.length) * 100) : null;
  return { matched, missing, coverage };
}

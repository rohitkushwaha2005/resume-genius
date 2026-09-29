import type { ResumeContent } from '@/types/resume';

/**
 * Deterministic resume score. The same resume always gets the same score, and every point comes
 * from a named check the user can act on. AI is used for written feedback only, never the number.
 */

export interface ScoreCheck {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  /** Shown when the check is not at full points. */
  tip: string;
}

export interface ResumeScoreResult {
  score: number;
  checks: ScoreCheck[];
}

export const ACTION_VERBS = new Set([
  'achieved', 'analyzed', 'architected', 'automated', 'boosted', 'built', 'collaborated', 'configured',
  'coordinated', 'created', 'cut', 'debugged', 'decreased', 'delivered', 'deployed', 'designed',
  'developed', 'directed', 'drove', 'enabled', 'engineered', 'enhanced', 'established', 'evaluated',
  'expanded', 'generated', 'grew', 'guided', 'identified', 'implemented', 'improved', 'increased',
  'integrated', 'introduced', 'launched', 'led', 'maintained', 'managed', 'mentored', 'migrated',
  'modernized', 'monitored', 'negotiated', 'optimized', 'organized', 'owned', 'planned', 'presented',
  'produced', 'prototyped', 'published', 'reduced', 'refactored', 'resolved', 'restructured',
  'reviewed', 'saved', 'scaled', 'secured', 'shipped', 'simplified', 'solved', 'spearheaded',
  'standardized', 'streamlined', 'strengthened', 'supported', 'tested', 'trained', 'transformed',
  'wrote',
]);

export const WEAK_PHRASES = [
  'responsible for',
  'duties included',
  'worked on',
  'helped',
  'assisted',
  'was in charge of',
  'participated in',
  'involved in',
];

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);
const cleanBullet = (text: string) => text.replace(/^[\s\-•*·]+/, '').trim();

/** Experience bullets plus project description lines: the text recruiters actually scan. */
export function collectBullets(content: ResumeContent): string[] {
  const experience = content.experience.flatMap((e) => e.description);
  const projects = content.projects.flatMap((p) => p.description.split('\n'));
  return [...experience, ...projects].map(cleanBullet).filter(Boolean);
}

export const startsWithActionVerb = (bullet: string) =>
  ACTION_VERBS.has(words(bullet)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? '');

export const hasMetric = (bullet: string) => /\d/.test(bullet);

export const hasWeakPhrase = (bullet: string) => {
  const lower = bullet.toLowerCase();
  return WEAK_PHRASES.some((p) => lower.includes(p));
};

const fraction = (count: number, total: number) => (total === 0 ? 0 : count / total);

export function scoreResume(content: ResumeContent): ResumeScoreResult {
  const checks: ScoreCheck[] = [];
  const add = (id: string, label: string, ratio: number, maxPoints: number, tip: string) => {
    checks.push({ id, label, points: Math.round(Math.max(0, Math.min(1, ratio)) * maxPoints), maxPoints, tip });
  };

  const info = content.personalInfo;
  const contactFields = [info.fullName, info.email, info.phone, info.linkedin].filter((v) => v?.trim()).length;
  add('contact', 'Contact details', contactFields / 4, 10, 'Add your full name, email, phone and LinkedIn URL.');

  const summaryWords = words(content.summary ?? '').length;
  add(
    'summary',
    'Professional summary',
    summaryWords === 0 ? 0 : summaryWords >= 25 && summaryWords <= 90 ? 1 : 0.5,
    10,
    'Write a 2-4 sentence summary (about 25-90 words).',
  );

  const hasExperience = content.experience.length > 0;
  const projectCount = content.projects.length;
  add(
    'experience',
    'Experience or projects',
    hasExperience ? 1 : projectCount >= 2 ? 0.8 : projectCount === 1 ? 0.5 : 0,
    15,
    'Add work experience, or at least two projects if you are a fresher.',
  );

  const bullets = collectBullets(content);
  const n = bullets.length;
  add('bullets', 'Enough detail', n >= 6 ? 1 : n >= 3 ? 0.6 : n > 0 ? 0.3 : 0, 10, 'Describe your work in at least 6 bullet points across experience and projects.');
  add('verbs', 'Starts with action verbs', fraction(bullets.filter(startsWithActionVerb).length, n), 10, 'Start each bullet with a strong verb such as "Built", "Led" or "Reduced".');
  // Half the bullets containing a number earns full points; more isn't required.
  add('metrics', 'Measurable results', fraction(bullets.filter(hasMetric).length, n) / 0.5, 15, 'Add numbers: users, % improvement, time saved, team size.');
  add(
    'length',
    'Bullet length',
    fraction(bullets.filter((b) => words(b).length >= 8 && words(b).length <= 35).length, n),
    5,
    'Keep each bullet between 8 and 35 words.',
  );
  const weak = bullets.filter(hasWeakPhrase).length;
  add('weak', 'No weak phrases', n === 0 ? 0 : 1 - weak / Math.max(n, 5), 10, 'Replace phrases like "responsible for" or "worked on" with what you achieved.');

  const skillCount = content.skills.length;
  add(
    'skills',
    'Skills section',
    skillCount >= 6 && skillCount <= 25 ? 1 : skillCount > 25 ? 0.6 : skillCount > 0 ? 0.5 : 0,
    10,
    skillCount > 25 ? 'Trim your skills to the 15-25 most relevant.' : 'List 6-25 relevant skills.',
  );

  add('education', 'Education', content.education.length > 0 ? 1 : 0, 5, 'Add your education.');

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  return { score, checks };
}

/** All resume text in one string, for keyword matching. */
export function resumeToText(content: ResumeContent): string {
  return [
    content.summary,
    ...content.skills,
    ...content.experience.flatMap((e) => [e.position, e.company, ...e.description]),
    ...content.projects.flatMap((p) => [p.name, p.description, ...p.technologies]),
    ...content.education.flatMap((e) => [e.degree, e.field]),
  ].join('\n');
}

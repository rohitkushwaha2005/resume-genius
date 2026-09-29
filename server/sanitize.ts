import { mentionsSkill } from '../src/lib/text-match.js';
import type {
  BulletsResult,
  ReviewResult,
  SkillsResult,
  SummaryResult,
  TailorInput,
  TailorResult,
} from './schemas.js';

/**
 * Model output is untrusted input. These functions bound its size, clean formatting and, for
 * tailoring, drop skills the resume gives no evidence for.
 */

const clip = (value: string, max: number) => value.trim().slice(0, max).trim();

function cleanList(items: readonly string[], maxItems: number, maxLength: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of items) {
    const item = clip(raw.replace(/^[\s\-•*·\d.)]+/, ''), maxLength);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length === maxItems) break;
  }
  return result;
}

export function sanitizeSummary(result: SummaryResult): SummaryResult {
  return { summary: clip(result.summary, 1200) };
}

export function sanitizeBullets(result: BulletsResult, expectedCount: number): BulletsResult {
  return { bullets: cleanList(result.bullets, Math.max(expectedCount, 1), 300) };
}

export function sanitizeSkills(result: SkillsResult, existingSkills: readonly string[]): SkillsResult {
  const existing = new Set(existingSkills.map((s) => s.trim().toLowerCase()));
  const fresh = result.skills.filter((s) => !existing.has(s.trim().toLowerCase()));
  return { skills: cleanList(fresh, 8, 50) };
}

export function sanitizeReview(result: ReviewResult): ReviewResult {
  return {
    strengths: cleanList(result.strengths, 4, 300),
    improvements: cleanList(result.improvements, 4, 300),
    suggestions: cleanList(result.suggestions, 4, 300),
  };
}

/** Everything the candidate wrote, used as evidence when checking tailored skills. */
export function resumeEvidenceText(input: Pick<TailorInput, 'summary' | 'experience' | 'projects'>): string {
  return [
    input.summary,
    ...input.experience.flatMap((e) => [e.position, ...e.description]),
    ...input.projects.flatMap((p) => [p.name, p.description, ...p.technologies]),
  ].join('\n');
}

/**
 * Keeps a tailored skill only if the candidate already listed it or the resume text mentions it,
 * so tailoring can never add a skill the candidate hasn't shown.
 */
export function sanitizeTailor(result: TailorResult, input: TailorInput): TailorResult {
  const evidence = resumeEvidenceText(input);
  const listed = new Set(input.skills.map((s) => s.trim().toLowerCase()));
  const backed = result.skills.filter(
    (skill) => listed.has(skill.trim().toLowerCase()) || mentionsSkill(evidence, skill),
  );
  return { summary: clip(result.summary, 1200), skills: cleanList(backed, 40, 60) };
}

import { z } from 'zod';

/**
 * Request schemas. Every string and list is length-capped so a single request can't send
 * megabytes of text to the model (cost control) or oversized payloads to the server.
 */
const text = (max: number) => z.string().trim().max(max);
const skillList = z.array(text(60)).max(60);

const experienceItem = z.object({
  position: text(120).default(''),
  company: text(120).default(''),
  description: z.array(text(500)).max(15).default([]),
});

const projectItem = z.object({
  name: text(120).default(''),
  description: text(1500).default(''),
  technologies: z.array(text(60)).max(20).default([]),
});

const educationItem = z.object({
  institution: text(200).default(''),
  degree: text(120).default(''),
  field: text(120).default(''),
});

export const SummaryRequest = z.object({
  position: text(120).default(''),
  skills: skillList.default([]),
  experience: z.array(experienceItem).max(10).default([]),
});

export const BulletsRequest = z.object({
  position: text(120).default(''),
  company: text(120).default(''),
  bullets: z.array(text(500).min(1)).min(1, 'Add at least one bullet point').max(15),
});

export const SkillsRequest = z.object({
  jobRole: text(120).min(1, 'A job role is required'),
  existingSkills: skillList.default([]),
});

/** Contact details are deliberately not accepted: the model doesn't need them to review content. */
export const ReviewRequest = z.object({
  summary: text(2000).default(''),
  experience: z.array(experienceItem).max(10).default([]),
  projects: z.array(projectItem).max(10).default([]),
  education: z.array(educationItem).max(10).default([]),
  skills: skillList.default([]),
});

export const TailorRequest = z.object({
  jobDescription: text(8000).min(50, 'Paste the full job description (at least 50 characters)'),
  summary: text(2000).default(''),
  skills: skillList.default([]),
  experience: z.array(experienceItem).max(10).default([]),
  projects: z.array(projectItem).max(10).default([]),
});

export type SummaryInput = z.infer<typeof SummaryRequest>;
export type BulletsInput = z.infer<typeof BulletsRequest>;
export type SkillsInput = z.infer<typeof SkillsRequest>;
export type ReviewInput = z.infer<typeof ReviewRequest>;
export type TailorInput = z.infer<typeof TailorRequest>;

/**
 * Model output schemas, used for OpenAI structured outputs. They stay simple (no length
 * constraints) because strict JSON-schema mode supports only a subset of keywords; limits are
 * enforced afterwards in `sanitize.ts`.
 */
export const SummaryOutput = z.object({ summary: z.string() });
export const BulletsOutput = z.object({ bullets: z.array(z.string()) });
export const SkillsOutput = z.object({ skills: z.array(z.string()) });
export const ReviewOutput = z.object({
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  suggestions: z.array(z.string()),
});
export const TailorOutput = z.object({ summary: z.string(), skills: z.array(z.string()) });

export type SummaryResult = z.infer<typeof SummaryOutput>;
export type BulletsResult = z.infer<typeof BulletsOutput>;
export type SkillsResult = z.infer<typeof SkillsOutput>;
export type ReviewResult = z.infer<typeof ReviewOutput>;
export type TailorResult = z.infer<typeof TailorOutput>;

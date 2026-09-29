import { supabase } from '@/integrations/supabase/client';
import type { ResumeContent } from '@/types/resume';

/** An AI request failure whose message is safe and useful to show in a toast. */
export class AIRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AIRequestError';
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AIRequestError('Please sign in again to use AI features.', 401);

  let res: Response;
  try {
    res = await fetch(`/api/ai/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AIRequestError('Network error. Check your connection and try again.', 0);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AIRequestError(json?.error?.message ?? 'Something went wrong. Please try again.', res.status);
  }
  return json as T;
}

/** Only the fields the server needs; contact details are never sent to the AI. */
const experienceForAI = (content: ResumeContent) =>
  content.experience.map((e) => ({
    position: e.position,
    company: e.company,
    description: e.description.filter((d) => d.trim()),
  }));

const projectsForAI = (content: ResumeContent) =>
  content.projects.map((p) => ({ name: p.name, description: p.description, technologies: p.technologies }));

export const aiClient = {
  generateSummary: (content: ResumeContent) =>
    post<{ summary: string }>('summary', {
      position: content.experience[0]?.position ?? '',
      skills: content.skills.slice(0, 30),
      experience: experienceForAI(content),
    }),

  improveBullets: (input: { position: string; company: string; bullets: string[] }) =>
    post<{ bullets: string[] }>('bullets', input),

  suggestSkills: (jobRole: string, existingSkills: string[]) =>
    post<{ skills: string[] }>('skills', { jobRole, existingSkills }),

  reviewResume: (content: ResumeContent) =>
    post<{ strengths: string[]; improvements: string[]; suggestions: string[] }>('review', {
      summary: content.summary,
      experience: experienceForAI(content),
      projects: projectsForAI(content),
      education: content.education.map((e) => ({ institution: e.institution, degree: e.degree, field: e.field })),
      skills: content.skills,
    }),

  tailorToJob: (jobDescription: string, content: ResumeContent) =>
    post<{ summary: string; skills: string[] }>('tailor', {
      jobDescription,
      summary: content.summary,
      skills: content.skills,
      experience: experienceForAI(content),
      projects: projectsForAI(content),
    }),
};

export const errorMessage = (error: unknown) =>
  error instanceof AIRequestError ? error.message : 'Something went wrong. Please try again.';

import { describe, expect, it } from 'vitest';
import type { ResumeContent } from '@/types/resume';
import { collectBullets, hasWeakPhrase, resumeToText, scoreResume, startsWithActionVerb } from './ats-score';

const empty: ResumeContent = {
  personalInfo: { fullName: '', email: '', phone: '', linkedin: '', location: '' },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: [],
};

const strong: ResumeContent = {
  personalInfo: { fullName: 'Asha Rao', email: 'asha@example.com', phone: '+91 90000 00000', linkedin: 'linkedin.com/in/asha', location: 'Pune' },
  summary:
    'Full-stack developer with two years of experience building React and Node.js applications. Shipped features used by 20,000 customers and cut page load time by 40%. Comfortable owning work from database design to deployment and mentoring junior developers.',
  education: [{ id: 'e1', institution: 'College', degree: 'B.Tech', field: 'CSE', startDate: '2018', endDate: '2022' }],
  experience: [
    {
      id: 'x1',
      company: 'Acme',
      position: 'Software Engineer',
      location: 'Pune',
      startDate: '2022',
      endDate: '',
      current: true,
      description: [
        'Built a React checkout flow that increased conversion by 12% across 20,000 monthly users',
        'Reduced API response time by 40% by adding Redis caching to the Node.js order service',
        'Led migration of 3 legacy services to TypeScript, cutting production bugs by a third',
        'Automated deployments with GitHub Actions, saving the team about 5 hours every week',
      ],
    },
  ],
  projects: [
    { id: 'p1', name: 'Chat app', description: 'Designed a real-time chat app with WebSockets supporting 500 concurrent users\nDeployed on Vercel with 99% uptime over 6 months of use', technologies: ['React'] },
  ],
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'Git'],
};

describe('scoreResume', () => {
  it('gives an empty resume zero', () => {
    expect(scoreResume(empty).score).toBe(0);
  });

  it('gives a strong resume full marks', () => {
    const result = scoreResume(strong);
    expect(result.score).toBe(100);
    expect(result.checks.every((c) => c.points === c.maxPoints)).toBe(true);
  });

  it('is deterministic', () => {
    expect(scoreResume(strong)).toEqual(scoreResume(strong));
  });

  it('checks add up to 100 points', () => {
    const total = scoreResume(empty).checks.reduce((s, c) => s + c.maxPoints, 0);
    expect(total).toBe(100);
  });

  it('penalizes weak phrases and missing metrics', () => {
    const weak: ResumeContent = {
      ...strong,
      experience: [{ ...strong.experience[0], description: ['Responsible for the website', 'Worked on bug fixes for the team', 'Helped with testing'] }],
      projects: [],
    };
    const result = scoreResume(weak);
    const byId = Object.fromEntries(result.checks.map((c) => [c.id, c]));
    expect(byId.weak.points).toBeLessThan(byId.weak.maxPoints);
    expect(byId.metrics.points).toBe(0);
    expect(byId.verbs.points).toBe(0);
    expect(result.score).toBeLessThan(80);
  });

  it('gives freshers credit for projects instead of experience', () => {
    const fresher = { ...strong, experience: [], projects: [strong.projects[0], { ...strong.projects[0], id: 'p2' }] };
    const check = scoreResume(fresher).checks.find((c) => c.id === 'experience')!;
    expect(check.points).toBe(12);
  });

  it('flags keyword stuffing in skills', () => {
    const stuffed = { ...strong, skills: Array.from({ length: 30 }, (_, i) => `Skill ${i}`) };
    const check = scoreResume(stuffed).checks.find((c) => c.id === 'skills')!;
    expect(check.points).toBeLessThan(check.maxPoints);
  });
});

describe('helpers', () => {
  it('detects action verbs ignoring bullet characters and case', () => {
    expect(startsWithActionVerb('Built an API')).toBe(true);
    expect(startsWithActionVerb('the API was built')).toBe(false);
    expect(collectBullets({ ...empty, experience: [{ ...strong.experience[0], description: ['• Led a team', '  '] }] })).toEqual(['Led a team']);
  });

  it('detects weak phrases', () => {
    expect(hasWeakPhrase('I was responsible for testing')).toBe(true);
    expect(hasWeakPhrase('Owned testing')).toBe(false);
  });

  it('flattens resume text for keyword matching', () => {
    expect(resumeToText(strong)).toContain('Redis caching');
  });
});

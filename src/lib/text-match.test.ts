import { describe, expect, it } from 'vitest';
import { containsTerm, extractJobKeywords, matchKeywords, mentionsSkill } from './text-match';

describe('containsTerm', () => {
  it('matches whole words only', () => {
    expect(containsTerm('Strong Java skills', 'java')).toBe(true);
    expect(containsTerm('Strong JavaScript skills', 'java')).toBe(false);
  });

  it('handles symbols in skill names', () => {
    expect(containsTerm('Experience with C++ and C#', 'c++')).toBe(true);
    expect(containsTerm('Experience with C++ and C#', 'c#')).toBe(true);
    expect(containsTerm('Built with Node.js', 'node.js')).toBe(true);
  });
});

describe('mentionsSkill', () => {
  it('understands common alternative spellings', () => {
    expect(mentionsSkill('Built APIs in NodeJS', 'Node.js')).toBe(true);
    expect(mentionsSkill('Used Postgres daily', 'PostgreSQL')).toBe(true);
    expect(mentionsSkill('Used Postgres daily', 'MongoDB')).toBe(false);
  });
});

describe('extractJobKeywords', () => {
  it('finds skills in a job description', () => {
    const jd = 'We are hiring a React developer with TypeScript, REST APIs and AWS. Docker is a plus.';
    expect(extractJobKeywords(jd)).toEqual(expect.arrayContaining(['React.js', 'TypeScript', 'REST APIs', 'AWS', 'Docker']));
  });

  it('ignores ordinary English words that are also skill names', () => {
    const jd = 'Candidates who excel at communication and express ideas clearly; the rest of the team is remote.';
    const keywords = extractJobKeywords(jd);
    expect(keywords).not.toContain('Excel');
    expect(keywords).not.toContain('Express.js');
    expect(keywords).not.toContain('REST APIs');
  });

  it('includes the candidate’s own skills when the job mentions them', () => {
    expect(extractJobKeywords('Experience with Zustand is required', ['Zustand'])).toContain('Zustand');
  });
});

describe('matchKeywords', () => {
  it('reports matched, missing and coverage', () => {
    const result = matchKeywords('Looking for React, Node.js and Kubernetes experience', 'Built apps with ReactJS and NodeJS');
    expect(result.matched).toEqual(expect.arrayContaining(['React.js', 'Node.js']));
    expect(result.missing).toEqual(['Kubernetes']);
    expect(result.coverage).toBe(67);
  });

  it('returns null coverage when no keywords are recognized', () => {
    expect(matchKeywords('Friendly team, great snacks', 'anything').coverage).toBeNull();
  });
});

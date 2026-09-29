import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { AIService } from './ai.js';
import { createApp, createAppFromEnv } from './app.js';
import { AIUnavailableError } from './errors.js';

const TOKEN = 'valid-token';

function fakeAI(overrides: Partial<AIService> = {}): AIService {
  return {
    generateSummary: vi.fn(async () => ({ summary: '  Full-stack developer building React apps.  ' })),
    improveBullets: vi.fn(async () => ({ bullets: ['• Built a thing', '- Shipped a thing', 'Extra bullet'] })),
    suggestSkills: vi.fn(async () => ({ skills: ['Docker', 'react', 'Docker', 'GraphQL'] })),
    reviewResume: vi.fn(async () => ({ strengths: ['Clear'], improvements: ['Add metrics'], suggestions: ['Quantify'] })),
    tailorToJob: vi.fn(async () => ({ summary: 'Tailored summary', skills: ['React', 'Kubernetes', 'Node.js'] })),
    ...overrides,
  };
}

function makeApp(ai = fakeAI(), rateLimitPer10Min = 20) {
  return createApp({
    ai,
    verifyUser: async (token) => (token === TOKEN ? { id: 'user-1' } : null),
    rateLimitPer10Min,
  });
}

const auth = { Authorization: `Bearer ${TOKEN}` };

describe('API', () => {
  it('reports health without auth', async () => {
    const res = await request(makeApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('rejects AI requests without a token', async () => {
    const ai = fakeAI();
    const res = await request(makeApp(ai)).post('/api/ai/summary').send({ position: 'Dev' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(ai.generateSummary).not.toHaveBeenCalled();
  });

  it('rejects AI requests with an invalid token', async () => {
    const res = await request(makeApp())
      .post('/api/ai/summary')
      .set('Authorization', 'Bearer stolen')
      .send({ position: 'Dev' });
    expect(res.status).toBe(401);
  });

  it('generates a trimmed summary', async () => {
    const res = await request(makeApp()).post('/api/ai/summary').set(auth).send({ position: 'Developer', skills: ['React'] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ summary: 'Full-stack developer building React apps.' });
  });

  it('returns one cleaned bullet per input bullet', async () => {
    const res = await request(makeApp())
      .post('/api/ai/bullets')
      .set(auth)
      .send({ position: 'Dev', company: 'Acme', bullets: ['made thing', 'did thing'] });
    expect(res.status).toBe(200);
    expect(res.body.bullets).toEqual(['Built a thing', 'Shipped a thing']);
  });

  it('suggests only new, de-duplicated skills', async () => {
    const res = await request(makeApp())
      .post('/api/ai/skills')
      .set(auth)
      .send({ jobRole: 'Frontend Developer', existingSkills: ['React'] });
    expect(res.status).toBe(200);
    expect(res.body.skills).toEqual(['Docker', 'GraphQL']);
  });

  it('drops tailored skills the resume gives no evidence for', async () => {
    const res = await request(makeApp())
      .post('/api/ai/tailor')
      .set(auth)
      .send({
        jobDescription: 'We need a React and Kubernetes engineer to build scalable web applications for our clients.',
        skills: ['React'],
        experience: [{ position: 'Developer', company: 'Acme', description: ['Built REST APIs with Node.js and Express'] }],
      });
    expect(res.status).toBe(200);
    expect(res.body.skills).toEqual(['React', 'Node.js']);
  });

  it('validates input and caps sizes', async () => {
    const ai = fakeAI();
    const res = await request(makeApp(ai))
      .post('/api/ai/bullets')
      .set(auth)
      .send({ bullets: ['x'.repeat(501)] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(ai.improveBullets).not.toHaveBeenCalled();
  });

  it('rejects a job description that is too short', async () => {
    const res = await request(makeApp()).post('/api/ai/tailor').set(auth).send({ jobDescription: 'React dev' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/jobDescription/);
  });

  it('rejects oversized request bodies', async () => {
    const res = await request(makeApp())
      .post('/api/ai/review')
      .set(auth)
      .send({ summary: 'x'.repeat(200_000) });
    expect(res.status).toBe(413);
  });

  it('returns a safe message when the AI provider fails', async () => {
    const ai = fakeAI({
      reviewResume: vi.fn(async () => {
        throw new AIUnavailableError();
      }),
    });
    const res = await request(makeApp(ai)).post('/api/ai/review').set(auth).send({ summary: 'Hi' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_UNAVAILABLE');
  });

  it('never leaks internal error messages', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ai = fakeAI({
      reviewResume: vi.fn(async () => {
        throw new Error('db password is hunter2');
      }),
    });
    const res = await request(makeApp(ai)).post('/api/ai/review').set(auth).send({});
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    spy.mockRestore();
  });

  it('rate-limits each user', async () => {
    const app = makeApp(fakeAI(), 2);
    for (let i = 0; i < 2; i++) {
      const ok = await request(app).post('/api/ai/summary').set(auth).send({});
      expect(ok.status).toBe(200);
    }
    const limited = await request(app).post('/api/ai/summary').set(auth).send({});
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
  });

  it('answers 503 when the server is not configured', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(createAppFromEnv({})).post('/api/ai/summary').send({});
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NOT_CONFIGURED');
    spy.mockRestore();
  });
});

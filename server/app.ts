import cors from 'cors';
import express, { type ErrorRequestHandler, type Request, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import OpenAI from 'openai';
import { ZodError, type z } from 'zod';
import { OpenAIService, type AIService } from './ai.js';
import { createSupabaseVerifier, requireUser, type VerifyUser } from './auth.js';
import { loadConfig, parseOrigins } from './config.js';
import { HttpError } from './errors.js';
import {
  sanitizeBullets,
  sanitizeReview,
  sanitizeSkills,
  sanitizeSummary,
  sanitizeTailor,
} from './sanitize.js';
import { BulletsRequest, ReviewRequest, SkillsRequest, SummaryRequest, TailorRequest } from './schemas.js';

export interface AppDeps {
  ai: AIService;
  verifyUser: VerifyUser;
  /** Extra origins allowed by CORS. Same-origin requests (the deployed site) need no entry. */
  allowedOrigins?: string[];
  /** AI requests allowed per signed-in user per 10 minutes. */
  rateLimitPer10Min?: number;
}

/** Validates the body with a Zod schema, runs the handler and sends its result as JSON. */
function endpoint<S extends z.ZodTypeAny>(
  schema: S,
  handler: (input: z.infer<S>, req: Request) => Promise<unknown>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const input = schema.parse(req.body ?? {});
      res.json(await handler(input, req));
    } catch (error) {
      next(error);
    }
  };
}

export function createApp(deps: AppDeps) {
  const app = express();
  // Vercel sits in front of the app; trust its X-Forwarded-For so client IPs are correct.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: deps.allowedOrigins?.length ? deps.allowedOrigins : false,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const ai = express.Router();
  ai.use(requireUser(deps.verifyUser));
  ai.use(
    rateLimit({
      windowMs: 10 * 60 * 1000,
      limit: deps.rateLimitPer10Min ?? 20,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      // Runs after requireUser, so every request here has a user id.
      keyGenerator: (_req, res) => String(res.locals.userId),
      handler: (_req, res) => {
        res.status(429).json({
          error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Please wait a few minutes and try again.' },
        });
      },
    }),
  );

  ai.post(
    '/summary',
    endpoint(SummaryRequest, async (input) => sanitizeSummary(await deps.ai.generateSummary(input))),
  );
  ai.post(
    '/bullets',
    endpoint(BulletsRequest, async (input) =>
      sanitizeBullets(await deps.ai.improveBullets(input), input.bullets.length),
    ),
  );
  ai.post(
    '/skills',
    endpoint(SkillsRequest, async (input) =>
      sanitizeSkills(await deps.ai.suggestSkills(input), input.existingSkills),
    ),
  );
  ai.post(
    '/review',
    endpoint(ReviewRequest, async (input) => sanitizeReview(await deps.ai.reviewResume(input))),
  );
  ai.post(
    '/tailor',
    endpoint(TailorRequest, async (input) => sanitizeTailor(await deps.ai.tailorToJob(input), input)),
  );

  app.use('/api/ai', ai);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });

  app.use(errorHandler);
  return app;
}

/** Converts every error into `{ error: { code, message } }` without leaking internals. */
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const field = first?.path.join('.') || 'request';
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `Invalid ${field}: ${first?.message ?? 'bad value'}` },
    });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  // Body-parser errors (malformed JSON, payload too large) carry a 4xx status.
  const status = typeof error?.status === 'number' && error.status < 500 ? error.status : 500;
  if (status === 500) console.error('[api] unhandled error:', error);
  res.status(status).json({
    error: {
      code: status === 413 ? 'PAYLOAD_TOO_LARGE' : status === 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
      message: status === 500 ? 'Something went wrong. Please try again.' : 'The request could not be processed.',
    },
  });
};

/**
 * Builds the app from environment variables. If configuration is missing (e.g. no OpenAI key on
 * the deployment yet), the API answers 503 with a clear message instead of crashing on startup.
 */
export function createAppFromEnv(env: NodeJS.ProcessEnv = process.env) {
  try {
    const config = loadConfig(env);
    return createApp({
      ai: new OpenAIService(new OpenAI({ apiKey: config.OPENAI_API_KEY }), config.OPENAI_MODEL),
      verifyUser: createSupabaseVerifier(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY),
      allowedOrigins: parseOrigins(config.ALLOWED_ORIGINS),
      rateLimitPer10Min: config.AI_RATE_LIMIT_PER_10_MIN,
    });
  } catch (error) {
    console.error('[api]', error instanceof Error ? error.message : error);
    const app = express();
    app.use('/api', (_req, res) => {
      res.status(503).json({
        error: { code: 'NOT_CONFIGURED', message: 'AI features are not configured on this server yet.' },
      });
    });
    return app;
  }
}

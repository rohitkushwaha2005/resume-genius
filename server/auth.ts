import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from 'express';
import { HttpError } from './errors.js';

export interface AuthUser {
  id: string;
}

/** Resolves an access token to a user, or null if the token is invalid or expired. */
export type VerifyUser = (accessToken: string) => Promise<AuthUser | null>;

/** Verifies Supabase access tokens by asking Supabase Auth who the token belongs to. */
export function createSupabaseVerifier(url: string, publishableKey: string): VerifyUser {
  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return async (accessToken) => {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      // 4xx = bad/expired token. Anything else means Supabase itself is unreachable.
      if (error.status && error.status < 500) return null;
      throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Could not verify your session. Please try again.');
    }
    return data.user ? { id: data.user.id } : null;
  };
}

/** Rejects requests without a valid `Authorization: Bearer <token>` and stores the user id. */
export function requireUser(verify: VerifyUser): RequestHandler {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization ?? '';
      const match = /^Bearer (.+)$/.exec(header);
      const user = match ? await verify(match[1]) : null;
      if (!user) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Please sign in to use AI features.');
      }
      res.locals.userId = user.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Vercel serverless entry point. vercel.json rewrites every /api/* request here, and the Express
 * app routes on the original path.
 */
import { createAppFromEnv } from '../server/app.js';

export default createAppFromEnv();

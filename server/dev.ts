/** Local development entry point: `npm run dev:api` (Vite proxies /api to this port). */
import { existsSync } from 'node:fs';
import { createAppFromEnv } from './app.js';

// Secrets go in .env.local (git-ignored); .env holds the public Supabase values.
for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const port = Number(process.env.API_PORT ?? 3001);
createAppFromEnv().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

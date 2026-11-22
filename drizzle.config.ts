// Nur für drizzle-kit generate. Eingespielt wird mit npm run db:migrate, nie mit drizzle-kit push.
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema',
  out: './db/migrations',
  strict: true,
  verbose: true,
})

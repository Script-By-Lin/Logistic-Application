# Pipe Inventory, Distribution, and Return Management

A full-stack inventory management system scaffolded with Next.js, TypeScript, and Supabase.

## Features included
- Production recording
- Price management per pipe type
- Distribution logging to villages
- Return handling with repaired/damaged status
- Real-time balance tracking and guardrails against negative stock
- Smart village filtering and auto-populated price fields

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Supabase project and configure these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create your database tables using `supabase/schema.sql` or Supabase SQL editor.

4. Run the development server:
   ```bash
   npm run dev
   ```

## Project structure
- `app/` — Next.js App Router UI
- `app/api/` — backend routes for production, distribution, returns, and pipe-types
- `lib/supabaseClient.ts` — shared Supabase client
- `supabase/schema.sql` — database schema for initial tables

## Notes
- The UI includes fallback sample pipe types if Supabase is not configured yet.
- Update pipe prices by editing the pipe type entries.
- Distribution and return routes validate stock and prevent negative inventory.

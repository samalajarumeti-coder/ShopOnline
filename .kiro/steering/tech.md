# Tech Stack

## Frontend

- Vue 3 with Composition API (`<script setup>` syntax)
- Vite 7 (build tool)
- Pinia (state management)
- Vue Router 4 (routing)
- Tailwind CSS 4 (styling)
- Lucide Vue Next (icons)

## Backend

- Supabase (BaaS)
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS) for data access control

## Environment Variables

```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Key Conventions

- Use `import.meta.env.VITE_*` for environment variables
- Supabase client initialized in `src/lib/supabase.js`
- All Supabase queries use the shared client instance

# Alam Alumni Directory

A modular, production-ready alumni directory web application built with Next.js, TypeScript, Tailwind CSS, and a feature-based folder structure.

## Included modules
- Dashboard
- Wall / Feed
- Hall of Fame
- Alumni Voting
- Alumni Map
- Gallery
- Profile
- Search
- Settings

## Architecture notes
- Feature-based folders live under src/modules
- Shared UI shell is composed from layout components
- PostgreSQL schema is managed with node-pg-migrate (see `migrations/`) and queried via `pg` in `src/lib/db.ts` and `src/services/db/`
- A reusable data layer is available under src/lib

## Run locally
```bash
npm run dev
```

## Database
```bash
npm run migrate:up
npm run migrate:down
```

## Next steps
- Integrate Supabase storage and AI tagging workflows
- Add React Leaflet mapping and real data sources

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
- Prisma schema is scaffolded for future PostgreSQL integration
- A reusable data layer is available under src/lib

## Run locally
```bash
npm run dev
```

## Next steps
- Wire Prisma migrations and PostgreSQL
- Add authentication and role-based access control
- Integrate Supabase storage and AI tagging workflows
- Add React Leaflet mapping and real data sources

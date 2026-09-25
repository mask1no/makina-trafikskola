# Makina Trafikskola

## Getting started

Copy `.env.example` to `.env` and set:

```
DATABASE_URL=postgresql://makina:makina_local_dev@localhost:5433/makina
```

Start Postgres, apply migrations, seed, and run the app:

```
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npm run theory:import
npm run dev
```

The app is at http://localhost:3000.

## Launch flags

- `BOOKING_ENABLED=0` hides the public booking flow and replaces booking
  calls to action with contact links. Set it to `1` when real availability
  is ready.
- `INSTRUCTORS_ENABLED=0` hides public instructor pages, maps, and instructor
  navigation. Set it to `1` when verified instructor profiles are ready.

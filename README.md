# Pitstoppd

**Letterboxd for Formula 1 Grand Prix.**

Rate and review past F1 races, follow other fans, and see what your friends thought of the latest GP.

**Live:** [pitstoppd.vercel.app](https://pitstoppd.vercel.app)

---

## Features

- **GP Ratings & Reviews** — Rate any past Grand Prix from 0.5 to 5 stars and write reviews with optional spoiler tags
- **User Profiles** — Set your favorite team, top 3 drivers, bio, and avatar
- **Friends Activity Feed** — Follow other users and see their latest ratings and reviews on your home page
- **Race Results & Qualifying** — Full finishing order and grid positions for every GP
- **Driver Profiles & Stats** — Career stats, race history, and portraits for every driver since 2020
- **Season Overviews** — Browse seasons from 2020 to present with champions and race grids

## Tech Stack

| Technology | Role |
|---|---|
| React 19 | UI framework |
| Vite 7 | Build tooling (SWC) |
| Tailwind CSS v4 | Styling (CSS-first config) |
| Supabase | Auth, Postgres DB, Storage, Row Level Security |
| React Router DOM | Client-side routing |
| Jolpica-F1 API | F1 data (successor to Ergast) |

## Status

Actively in development. The database covers all F1 seasons from 2020 to present.

## Data

Race data (schedules, results, drivers) comes from the [Jolpica-F1 API](https://api.jolpi.ca/ergast/f1/). Driver photos are sourced from Wikipedia. GP poster images come from [TheSportsDB](https://www.thesportsdb.com/).

The `scripts/` folder contains seed and refresh scripts for populating and updating the database.

---

Built by **Anderson**
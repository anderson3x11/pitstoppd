# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

F1 fans who watch races and want to keep a log of the Grands Prix they've seen: rate them, write a short review, and see what people they follow thought. Secondary audience: recruiters and developers looking at the project as a portfolio piece, browsing without an account.

## Product Purpose

Pitstoppd is Letterboxd for Formula 1 Grands Prix. Every race since 2000 (main races and sprints) has a page with results, qualifying, average rating and reviews. Signed-in users rate races from 0.5 to 5 stars, write reviews with an optional spoiler flag, like reviews, and follow other users to get an activity feed. Success means a visitor understands the concept within seconds and finds browsing races, seasons and drivers pleasant enough to keep clicking.

## Positioning

A diary and rating layer on top of F1 history, modeled on Letterboxd's social mechanics (log, rate, review, follow) rather than a stats or news site. Races are treated like films: a poster, a score, and opinions.

## Operating Context

- Mostly desktop, but every page must stay clean and usable on a phone.
- Public reading without an account; rating, reviewing, liking and following require one. Sign-up is immediate (no email confirmation).
- Solo project, used as a portfolio/CV piece and intended for public release. Real user base is currently the author plus seeded demo users.

## Capabilities and Constraints

- Pages: Home (latest GP hero, next race countdown, friends feed, latest races), Grands Prix (season filter, sorting), Grand Prix (results, qualifying, reviews, my activity), Review, Seasons, Season (standings, top rated races), Drivers, Driver, Profile, Profile reviews, Settings, Login, Register, Search.
- Only past races can be rated. One rating and one review per user per race. Likes on reviews only, no comment threads.
- UI language: English. `display_name` is shown everywhere, `username` only in URLs.
- Data: races, results and drivers from the Jolpica-F1 API; GP posters from TheSportsDB (not every race has one, fallback needed); driver portraits from Wikipedia (some missing).
- Stack: React 19, Vite, Tailwind v4, React Router; own API (Hono + SQLite) served from the same origin.

## Brand Commitments

- Name: Pitstoppd (spelled with the double "p", echoing Letterboxd).
- Keep the Letterboxd-inspired structure and the existing dark F1 identity: near-black surfaces, F1 red accent, condensed display type, race posters as the main visual material. The planned work is a refinement of this identity, not a replacement.

## Evidence on Hand

- `data/races.json`: 552+ races with 180 posters; `data/drivers.json`: 130 drivers with photos.
- Seeded demo users and reviews (`scripts/fakeUsers.js`), clearly fake (`@pitstoppd.test`). No real testimonials, user counts or press exist; none may be invented.

## Product Principles

1. Races first: the poster, the name and the score carry every screen.
2. Readable without an account; asking to sign in only at the moment of an action.
3. Spoilers are opt-in: review content flagged as spoiler stays hidden until requested.
4. Letterboxd familiarity over novelty: users should recognize the log/rate/review/follow loop immediately.

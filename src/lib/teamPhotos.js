// Team logos from official F1 CDN (2026)
// To update: adjust the version timestamp in the base URL if needed

const BASE = 'https://media.formula1.com/image/upload/c_limit,w_400/q_auto/v1740000000/common/f1/2026'

const TEAM_PHOTOS = {
  'Alpine':        `${BASE}/alpine/2026alpinelogowhite.webp`,
  'Aston Martin':  `${BASE}/astonmartin/2026astonmartinlogowhite.webp`,
  'Audi':          `${BASE}/audi/2026audilogowhite.webp`,
  'Cadillac':      `${BASE}/cadillac/2026cadillaclogowhite.webp`,
  'Ferrari':       `${BASE}/ferrari/2026ferrarilogowhite.webp`,
  'Haas':          `${BASE}/haas/2026haaslogowhite.webp`,
  'McLaren':       `${BASE}/mclaren/2026mclarenlogowhite.webp`,
  'Mercedes':      `${BASE}/mercedes/2026mercedeslogowhite.webp`,
  'Racing Bulls':  `${BASE}/racingbulls/2026racingbullslogowhite.webp`,
  'Red Bull':      `${BASE}/redbullracing/2026redbullracinglogowhite.webp`,
  'Williams':      `${BASE}/williams/2026williamslogowhite.webp`,
}

export function getTeamPhoto(teamName) {
  if (!teamName) return null
  const key = Object.keys(TEAM_PHOTOS).find((k) =>
    teamName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(teamName.toLowerCase())
  )
  return key ? TEAM_PHOTOS[key] : null
}

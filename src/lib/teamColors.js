const TEAM_COLORS = {
  'Alpine':        { hex: '#FF87BC', rgb: [255, 135, 188] },
  'Aston Martin':  { hex: '#229971', rgb: [34, 153, 113] },
  'Audi':          { hex: '#BB0000', rgb: [187, 0, 0] },
  'Cadillac':      { hex: '#003087', rgb: [0, 48, 135] },
  'Ferrari':       { hex: '#E8002D', rgb: [232, 0, 45] },
  'Haas':          { hex: '#B6BABD', rgb: [182, 186, 189] },
  'McLaren':       { hex: '#FF8000', rgb: [255, 128, 0] },
  'Mercedes':      { hex: '#27F4D2', rgb: [39, 244, 210] },
  'Racing Bulls':  { hex: '#6692FF', rgb: [102, 146, 255] },
  'Red Bull':      { hex: '#3671C6', rgb: [54, 113, 198] },
  'Williams':      { hex: '#64C4FF', rgb: [100, 196, 255] },
  // Former teams
  'Kick Sauber':   { hex: '#52E252', rgb: [82, 226, 82] },
  'Sauber':        { hex: '#52E252', rgb: [82, 226, 82] },
  'AlphaTauri':    { hex: '#6692FF', rgb: [102, 146, 255] },
  'Alfa Romeo':    { hex: '#900000', rgb: [144, 0, 0] },
  'Renault':       { hex: '#FFF500', rgb: [255, 245, 0] },
}

export function getTeamColor(teamName) {
  if (!teamName) return null
  const key = Object.keys(TEAM_COLORS).find((k) =>
    teamName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(teamName.toLowerCase())
  )
  return key ? TEAM_COLORS[key] : null
}

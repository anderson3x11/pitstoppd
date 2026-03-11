// World Drivers' Championship titles by driver ID (Ergast/Jolpica slugs)
const WDC = {
  max_verstappen:     4,
  hamilton:           7,
  michael_schumacher: 7,
  vettel:             4,
  prost:              4,
  senna:              3,
  piquet:             3,
  lauda:              3,
  stewart:            3,
  alonso:             2,
  hill:               2,
  fittipaldi:         2,
  ascari:             2,
  norris:             1,
  button:             1,
  raikkonen:          1,
  rosberg:            1,
  villeneuve:         1,
  hakkinen:           1,
  mansell:            1,
  fangio:             5,
}

export function getWDC(driverId) {
  return WDC[driverId] ?? 0
}

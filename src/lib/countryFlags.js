// Country name (as returned by Jolpica/Ergast) → flag emoji
const COUNTRY_FLAGS = {
  'Australia': '🇦🇺',
  'Austria': '🇦🇹',
  'Azerbaijan': '🇦🇿',
  'Bahrain': '🇧🇭',
  'Belgium': '🇧🇪',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'China': '🇨🇳',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Hungary': '🇭🇺',
  'Italy': '🇮🇹',
  'Japan': '🇯🇵',
  'Mexico': '🇲🇽',
  'Monaco': '🇲🇨',
  'Netherlands': '🇳🇱',
  'Portugal': '🇵🇹',
  'Qatar': '🇶🇦',
  'Russia': '🇷🇺',
  'Saudi Arabia': '🇸🇦',
  'Singapore': '🇸🇬',
  'Spain': '🇪🇸',
  'Turkey': '🇹🇷',
  'UAE': '🇦🇪',
  'UK': '🇬🇧',
  'USA': '🇺🇸',
  'Vietnam': '🇻🇳',
}

export function getCountryFlag(country) {
  return COUNTRY_FLAGS[country] ?? '🏁'
}

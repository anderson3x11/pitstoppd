// Cache mémoire par page — pattern stale-while-revalidate :
// au retour sur une page, on affiche immédiatement les données en cache
// puis le fetch normal se poursuit en arrière-plan et rafraîchit l'état.
// Volontairement en mémoire (pas sessionStorage) : vidé au refresh,
// pas de sérialisation (Set, Map ok), aucun risque de données périmées persistées.
const cache = new Map()

export function getPageCache(key) {
  return cache.get(key) ?? null
}

export function setPageCache(key, data) {
  cache.set(key, data)
}

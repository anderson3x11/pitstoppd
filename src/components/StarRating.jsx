/**
 * StarRating — affichage d'une note sur 5 étoiles (demi-points compris)
 *
 * Props:
 *  value   : number  — note entre 0 et 5 (ex: 3.5)
 *  size    : 'sm' | 'md' | 'lg'  — taille des étoiles (défaut: 'md')
 *  showValue : boolean — afficher la note numérique à côté (défaut: false)
 */

const STAR_PATH =
  'M12 2l2.582 5.632 6.118.89-4.427 4.313 1.045 6.09L12 15.902l-5.318 2.943 1.045-6.09L3.3 8.522l6.118-.89z'

function StarIcon({ fill, sizeClass }) {
  // fill: 0 (vide), 0.5 (demi), 1 (plein)
  const uid = `star-${Math.random().toString(36).slice(2, 7)}`

  return (
    <span className={`relative inline-block leading-none ${sizeClass}`}>
      {/* Étoile de fond (grise) */}
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <path d={STAR_PATH} fill="#2a2a2a" />
      </svg>

      {/* Étoile colorée clippée selon le remplissage */}
      {fill > 0 && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${fill * 100}%` }}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
            <path d={STAR_PATH} fill="var(--color-star)" />
          </svg>
        </span>
      )}
    </span>
  )
}

export default function StarRating({ value = 0, size = 'md', showValue = false }) {
  const sizeClass = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  }[size] ?? 'w-4 h-4'

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1
    if (value >= starValue) return 1          // étoile pleine
    if (value >= starValue - 0.5) return 0.5  // demi-étoile
    return 0                                   // étoile vide
  })

  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="flex gap-0.5">
        {stars.map((fill, i) => (
          <StarIcon key={i} fill={fill} sizeClass={sizeClass} />
        ))}
      </span>
      {showValue && (
        <span className="ml-1 text-xs text-muted tabular-nums">{value.toFixed(1)}</span>
      )}
    </span>
  )
}

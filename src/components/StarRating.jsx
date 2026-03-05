/**
 * StarRating — affichage et saisie d'une note sur 5 étoiles (demi-points compris)
 *
 * Props:
 *  value       : number   — note entre 0 et 5 (ex: 3.5)
 *  size        : 'sm' | 'md' | 'lg'  — taille des étoiles (défaut: 'md')
 *  showValue   : boolean  — afficher la note numérique à côté (défaut: false)
 *  interactive : boolean  — activer le mode saisie (défaut: false)
 *  onChange    : function — appelée avec la nouvelle valeur lors d'un clic
 */

import { useState } from 'react'

const STAR_PATH =
  'M12 2l2.582 5.632 6.118.89-4.427 4.313 1.045 6.09L12 15.902l-5.318 2.943 1.045-6.09L3.3 8.522l6.118-.89z'

function StarDisplay({ fill, sizeClass }) {
  return (
    <span className={`relative inline-block leading-none shrink-0 ${sizeClass}`}>
      {/* Étoile de fond (grise) */}
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <path d={STAR_PATH} fill="#2a2a2a" />
      </svg>
      {/* Étoile colorée — le SVG garde la taille de l'étoile complète,
          la clip span le masque à droite selon fill */}
      {fill > 0 && (
        <span
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${fill * 100}%`, height: '100%' }}
        >
          <svg
            viewBox="0 0 24 24"
            className="absolute top-0 left-0"
            style={{ width: `${100 / fill}%`, height: '100%' }}
            aria-hidden="true"
          >
            <path d={STAR_PATH} fill="var(--color-star)" />
          </svg>
        </span>
      )}
    </span>
  )
}

function StarInput({ index, displayValue, onHover, onClick, sizeClass }) {
  const starNum = index + 1
  const fill = displayValue >= starNum ? 1 : displayValue >= starNum - 0.5 ? 0.5 : 0

  return (
    <span className={`relative inline-block leading-none shrink-0 ${sizeClass} cursor-pointer`}>
      {/* Moitié gauche → demi-étoile */}
      <span
        className="absolute inset-y-0 left-0 w-1/2 z-10"
        onMouseEnter={() => onHover(starNum - 0.5)}
        onClick={() => onClick(starNum - 0.5)}
      />
      {/* Moitié droite → étoile pleine */}
      <span
        className="absolute inset-y-0 right-0 w-1/2 z-10"
        onMouseEnter={() => onHover(starNum)}
        onClick={() => onClick(starNum)}
      />
      {/* Étoile de fond */}
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <path d={STAR_PATH} fill="#2a2a2a" />
      </svg>
      {/* Étoile colorée clippée */}
      {fill > 0 && (
        <span
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${fill * 100}%`, height: '100%' }}
        >
          <svg
            viewBox="0 0 24 24"
            className="absolute top-0 left-0"
            style={{ width: `${100 / fill}%`, height: '100%' }}
            aria-hidden="true"
          >
            <path d={STAR_PATH} fill="var(--color-star)" />
          </svg>
        </span>
      )}
    </span>
  )
}

export default function StarRating({
  value = 0,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
}) {
  const [hoverValue, setHoverValue] = useState(null)

  const sizeClass = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-6 h-6' }[size] ?? 'w-4 h-4'
  const displayValue = hoverValue ?? value

  if (interactive) {
    return (
      <span
        className="inline-flex items-center gap-0.5 select-none"
        onMouseLeave={() => setHoverValue(null)}
      >
        <span className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <StarInput
              key={i}
              index={i}
              displayValue={displayValue}
              onHover={setHoverValue}
              onClick={(v) => onChange?.(v)}
              sizeClass={sizeClass}
            />
          ))}
        </span>
        {showValue && (
          <span className="ml-1 text-xs text-muted tabular-nums">
            {displayValue > 0 ? displayValue.toFixed(1) : '—'}
          </span>
        )}
      </span>
    )
  }

  const stars = Array.from({ length: 5 }, (_, i) => {
    const v = i + 1
    if (value >= v) return 1
    if (value >= v - 0.5) return 0.5
    return 0
  })

  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="flex gap-0.5">
        {stars.map((fill, i) => (
          <StarDisplay key={i} fill={fill} sizeClass={sizeClass} />
        ))}
      </span>
      {showValue && (
        <span className="ml-1 text-xs text-muted tabular-nums">{value.toFixed(1)}</span>
      )}
    </span>
  )
}

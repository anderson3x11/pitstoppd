/**
 * StarRating — affichage et saisie d'une note sur 5 étoiles (demi-points compris)
 *
 * Props:
 *  value       : number   — note entre 0 et 5 (ex: 3.5)
 *  size        : 'sm' | 'md' | 'lg'  — taille des étoiles (défaut: 'md')
 *  showValue   : boolean  — afficher la note numérique à côté (défaut: false)
 *  interactive : boolean  — activer le mode saisie (souris + flèches clavier)
 *  onChange    : function — appelée avec la nouvelle valeur
 */

import { useState } from 'react'

const STAR_PATH =
  'M12 2l2.582 5.632 6.118.89-4.427 4.313 1.045 6.09L12 15.902l-5.318 2.943 1.045-6.09L3.3 8.522l6.118-.89z'

const SIZES = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-8 h-8' }

function Star({ fill, sizeClass }) {
  return (
    <span className={`relative inline-block leading-none shrink-0 ${sizeClass}`}>
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <path d={STAR_PATH} fill="#333" />
      </svg>
      {fill > 0 && (
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <svg viewBox="0 0 24 24" className="h-full" style={{ width: `${100 / fill}%` }} aria-hidden="true">
            <path d={STAR_PATH} fill="var(--color-star)" />
          </svg>
        </span>
      )}
    </span>
  )
}

const fillFor = (value, i) => (value >= i + 1 ? 1 : value >= i + 0.5 ? 0.5 : 0)

export default function StarRating({ value = 0, size = 'md', showValue = false, interactive = false, onChange }) {
  const [hoverValue, setHoverValue] = useState(null)
  const sizeClass = SIZES[size] ?? SIZES.md

  if (!interactive) {
    return (
      <span className="inline-flex items-center gap-1" role="img" aria-label={`${value} out of 5 stars`}>
        <span className="flex gap-px">
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} fill={fillFor(value, i)} sizeClass={sizeClass} />)}
        </span>
        {showValue && <span className="text-xs font-medium text-muted tabular-nums">{value.toFixed(1)}</span>}
      </span>
    )
  }

  const displayValue = hoverValue ?? value

  const onKeyDown = (e) => {
    const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key]
    if (step === undefined) return
    e.preventDefault()
    onChange?.(Math.min(5, Math.max(0.5, (value || 0) + step)))
  }

  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label="Your rating"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value || undefined}
      aria-valuetext={value ? `${value} out of 5 stars` : 'Not rated'}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHoverValue(null)}
      className="inline-flex items-center gap-1 select-none rounded-md"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="relative cursor-pointer transition-transform duration-100 active:scale-90">
          {/* moitié gauche = demi-étoile, moitié droite = étoile pleine */}
          <span className="absolute inset-y-0 left-0 w-1/2 z-10" onMouseEnter={() => setHoverValue(i + 0.5)} onClick={() => onChange?.(i + 0.5)} />
          <span className="absolute inset-y-0 right-0 w-1/2 z-10" onMouseEnter={() => setHoverValue(i + 1)} onClick={() => onChange?.(i + 1)} />
          <Star fill={fillFor(displayValue, i)} sizeClass={sizeClass} />
        </span>
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-muted tabular-nums w-7">
          {displayValue > 0 ? displayValue.toFixed(1) : ''}
        </span>
      )}
    </span>
  )
}

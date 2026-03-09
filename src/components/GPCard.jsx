import { Link } from 'react-router-dom'
import StarRating from './StarRating'

/**
 * GPCard — carte d'un Grand Prix
 *
 * Props:
 *  gp.id
 *  gp.name        : "Grand Prix du Japon"
 *  gp.season      : 2024
 *  gp.slug        : "japon"
 *  gp.country     : "Japon"
 *  gp.circuit     : "Circuit de Suzuka"
 *  gp.date        : "2024-04-07"
 *  gp.posterUrl   : string | null
 *  gp.avgRating   : number | null
 *  gp.reviewCount : number | null
 */
export default function GPCard({ gp }) {
  const href = `/gps/${gp.season}/${gp.slug}`

  const formattedDate = gp.date
    ? new Date(gp.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <Link to={href} className="group block transition-transform duration-150 hover:scale-[1.02]">
      <div className="rounded-lg overflow-hidden bg-card border border-line transition-colors duration-150 hover:border-subtle">

        {/* Poster */}
        <div className="aspect-[2/3] bg-card-hover relative overflow-hidden">
          {gp.posterUrl ? (
            <img
              src={gp.posterUrl}
              alt={gp.name}
              className="h-full w-full object-cover"
            />
          ) : (
            // Placeholder stylisé quand pas d'image
            <div className="h-full w-full flex flex-col items-center justify-center p-3 bg-gradient-to-b from-card-hover to-card">
              <span className="text-2xl mb-2">🏁</span>
              <span className="text-center text-[11px] font-medium text-subtle uppercase tracking-wide leading-tight">
                {gp.name}
              </span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-2.5 space-y-1">
          <p className="text-[11px] text-subtle">{gp.season}</p>
          <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2">
            {gp.name}
          </h3>
          {formattedDate && (
            <p className="text-[11px] text-subtle">{formattedDate}</p>
          )}
          {gp.avgRating != null ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <StarRating value={gp.avgRating} size="sm" />
              {gp.reviewCount != null && (
                <span className="text-[10px] text-subtle">({gp.reviewCount})</span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-subtle italic">Pas encore noté</p>
          )}
        </div>

      </div>
    </Link>
  )
}

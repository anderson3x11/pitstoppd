import { useState } from 'react'
import { Link } from 'react-router-dom'
import StarRating from './StarRating'

/**
 * ReviewCard used on profile pages (Profil, ProfilReviews).
 * Shows the race name as a link, rating, like count, and spoiler toggle.
 */
export default function ReviewCard({ review }) {
  const [spoilerVisible, setSpoilerVisible] = useState(false)

  return (
    <div className="rounded-lg border border-line bg-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/gps/${review.raceSeason}/${review.raceSlug}`}
          className="text-sm font-semibold text-white hover:text-f1-red transition-colors"
        >
          {review.raceName}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {review.likeCount > 0 && (
            <span className="text-xs text-subtle flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {review.likeCount}
            </span>
          )}
          {review.rating != null && <StarRating value={review.rating} size="sm" showValue />}
          <span className="text-xs text-subtle">{review.raceSeason}</span>
        </div>
      </div>

      {review.spoiler && !spoilerVisible ? (
        <div className="rounded bg-card-hover border border-line px-3 py-2 text-center">
          <p className="text-xs text-subtle mb-1">Contains spoilers</p>
          <button
            onClick={() => setSpoilerVisible(true)}
            className="text-xs font-medium text-muted hover:text-white transition-colors cursor-pointer"
          >
            Show anyway
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted leading-relaxed">{review.content}</p>
      )}
    </div>
  )
}

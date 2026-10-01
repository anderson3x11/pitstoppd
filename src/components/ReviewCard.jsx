import { useState } from 'react'
import { Link } from 'react-router-dom'
import StarRating from './StarRating'
import Icon from './Icon'
import { formatDateShort } from '../lib/dateUtils'

/**
 * Critique, utilisée sur la page GP (en-tête = auteur) et sur les profils (en-tête = course).
 *
 * review: { id, content, spoiler, created_at, rating,
 *           username, displayName            — page GP
 *           raceName, raceSeason, raceSlug    — profils
 *           likes | likeCount }
 * onLike: si fourni, le cœur est un bouton (sinon simple compteur)
 */
export default function ReviewCard({ review, href, isLiked = false, onLike }) {
  const [spoilerVisible, setSpoilerVisible] = useState(false)
  const likes = review.likes ?? review.likeCount ?? 0
  const byRace = review.raceName != null

  return (
    <article className="py-5 border-b border-line last:border-b-0">
      <header className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {byRace ? (
          <Link to={`/gps/${review.raceSeason}/${review.raceSlug}`} className="font-semibold text-white hover:text-f1-red transition-colors">
            {review.raceName} <span className="font-normal text-subtle">{review.raceSeason}</span>
          </Link>
        ) : (
          <span className="text-sm text-muted">
            Review by{' '}
            <Link to={`/${review.username}`} className="font-semibold text-white hover:text-f1-red transition-colors">
              {review.displayName}
            </Link>
          </span>
        )}
        {review.rating != null && <StarRating value={review.rating} size="sm" />}
        <time dateTime={review.created_at} className="text-xs text-subtle ml-auto">{formatDateShort(review.created_at)}</time>
      </header>

      {review.spoiler && !spoilerVisible ? (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-subtle">This review may contain spoilers.</span>
          <button onClick={() => setSpoilerVisible(true)} className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-white transition-colors cursor-pointer">
            <Icon name="eye" className="w-4 h-4" /> Show
          </button>
        </div>
      ) : (
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted max-w-[68ch] whitespace-pre-line">{review.content}</p>
      )}

      <footer className="mt-3 flex items-center gap-4 text-sm">
        {onLike ? (
          <button
            onClick={() => onLike(review.id)}
            aria-pressed={isLiked}
            aria-label={isLiked ? 'Unlike review' : 'Like review'}
            className={`inline-flex items-center gap-1.5 rounded-md -ml-1.5 px-1.5 py-1 transition-colors cursor-pointer ${isLiked ? 'text-f1-red' : 'text-subtle hover:text-white'}`}
          >
            <Icon name="heart" filled={isLiked} className="w-4 h-4 transition-transform duration-150 active:scale-75" />
            <span className="tabular-nums">{likes}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-subtle" aria-label={`${likes} likes`}>
            <Icon name="heart" className="w-4 h-4" />
            <span className="tabular-nums">{likes}</span>
          </span>
        )}
        {href && (
          <Link to={href} className="text-subtle hover:text-white transition-colors">Open</Link>
        )}
      </footer>
    </article>
  )
}

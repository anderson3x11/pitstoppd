import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import Poster from '../components/Poster'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { PageSkeleton, EmptyState } from '../components/PageState'
import { formatDateLong } from '../lib/dateUtils'

export default function Review() {
  const { saison, slug, username } = useParams()
  const { user, profile } = useAuth()

  const [race, setRace] = useState(null)
  const [review, setReview] = useState(null)
  const [reviewer, setReviewer] = useState(null)
  const [reviewerRating, setReviewerRating] = useState(null)
  const [likers, setLikers] = useState([])
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [spoilerVisible, setSpoilerVisible] = useState(false)
  const [likeError, setLikeError] = useState(null)

  useEffect(() => {
    setLoading(true)

    async function load() {
      const data = await api(`/reviews/${saison}/${slug}/${username}`)
      setRace(data.race)
      setReview(data.review)
      if (data.review) {
        setReviewer(data.reviewer)
        setReviewerRating(data.rating)
        setLikers(data.likers)
        setLikeCount(data.likers.length)
        setIsLiked(!!user && data.likers.some((l) => l.id === user.id))
      }
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [saison, slug, username, user?.id])

  const handleLike = async () => {
    if (!user || !review) return
    if (user.id === reviewer?.id) return

    setLikeError(null)
    try {
      await api(`/reviews/${review.id}/like`, { method: isLiked ? 'DELETE' : 'POST' })
    } catch (err) {
      setLikeError(err.status === 401 ? 'Your session expired. Sign in again.' : err.message)
      return
    }
    setIsLiked(!isLiked)
    setLikeCount((n) => n + (isLiked ? -1 : 1))
    // Profil courant déjà en mémoire via useAuth — pas besoin de re-fetch
    setLikers((prev) => (isLiked ? prev.filter((l) => l.id !== user.id) : profile ? [...prev, profile] : prev))
  }

  if (loading) return <PageSkeleton />
  if (!race) return <EmptyState page title="Grand Prix not found" action="Browse Grands Prix" to="/gps">This race doesn't exist or its address changed.</EmptyState>
  if (!review) return <EmptyState page title="Review not found" action={`Back to ${race.name}`} to={`/gps/${saison}/${slug}`}>This member hasn't reviewed this race, or the review was deleted.</EmptyState>

  const canLike = user && user.id !== reviewer.id
  const hidden = review.spoiler && !spoilerVisible

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 sm:gap-10 grid-cols-[auto_1fr]">
        <Link to={`/gps/${saison}/${slug}`} className="block w-24 sm:w-40 rounded-md transition-opacity hover:opacity-85" aria-label={race.name}>
          <Poster race={race} eager className="shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)]" />
        </Link>

        <article className="min-w-0">
          <Link to={`/${reviewer.username}`} className="group inline-flex items-center gap-2.5">
            <Avatar profile={reviewer} className="h-8 w-8 text-xs" />
            <span className="text-sm text-muted">
              Review by <span className="font-semibold text-white group-hover:text-f1-red transition-colors">{reviewer.display_name}</span>
            </span>
          </Link>

          <h1 className="mt-4 font-display font-bold uppercase text-3xl sm:text-5xl leading-[0.95] tracking-tight text-white">
            <Link to={`/gps/${saison}/${slug}`} className="hover:text-f1-red transition-colors">{race.name}</Link>{' '}
            <span className="text-subtle font-bold not-italic text-2xl sm:text-3xl">{race.season}</span>
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
            {reviewerRating != null && <StarRating value={reviewerRating} size="md" />}
            <span>Reviewed {formatDateLong(review.created_at)}</span>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            {hidden ? (
              <div className="rounded-lg border border-dashed border-line-strong px-5 py-6 text-center">
                <p className="text-muted">This review may contain spoilers about the race result.</p>
                <button onClick={() => setSpoilerVisible(true)} className="btn btn-secondary btn-sm mt-4">
                  <Icon name="eye" /> Read anyway
                </button>
              </div>
            ) : (
              <p className="text-base sm:text-lg leading-relaxed text-[#d4d4d4] whitespace-pre-line max-w-[65ch]">{review.content}</p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            {canLike ? (
              <button
                onClick={handleLike}
                aria-pressed={isLiked}
                className={`btn btn-sm ${isLiked ? 'btn-secondary text-f1-red' : 'btn-secondary'}`}
              >
                <Icon name="heart" filled={isLiked} className="w-4 h-4" />
                {isLiked ? 'Liked' : 'Like review'}
              </button>
            ) : !user ? (
              <Link to="/login" className="btn btn-secondary btn-sm"><Icon name="heart" className="w-4 h-4" /> Sign in to like</Link>
            ) : null}
            <span className="text-sm text-subtle tabular-nums">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          </div>
          {likeError && <p role="alert" className="mt-2 text-sm text-red-400">{likeError}</p>}

          {likers.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold text-muted mb-3">Liked by</h2>
              <ul className="flex flex-wrap gap-2">
                {likers.map((liker) => (
                  <li key={liker.id}>
                    <Link to={`/${liker.username}`} className="group inline-flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 hover:border-line-strong transition-colors">
                      <Avatar profile={liker} className="h-6 w-6 text-[11px]" />
                      <span className="text-sm text-muted group-hover:text-white transition-colors">{liker.display_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </div>
  )
}

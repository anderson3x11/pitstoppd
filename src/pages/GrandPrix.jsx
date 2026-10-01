import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import ReviewCard from '../components/ReviewCard'
import Poster from '../components/Poster'
import Icon from '../components/Icon'
import Segmented from '../components/Segmented'
import { PageSkeleton, EmptyState } from '../components/PageState'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { getRaceResults, getSprintResults } from '../lib/f1api'
import { formatDateLong } from '../lib/dateUtils'

function ReviewModal({ race, userReview, reviewForm, setReviewForm, onSubmit, onDelete, onClose, submitting, error }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:px-4 animate-[fade-in_150ms_ease]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="w-full max-w-lg rounded-t-xl sm:rounded-xl border border-line-strong bg-card p-5 sm:p-6 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9)] animate-[modal-in_220ms_var(--ease-out)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="review-modal-title" className="font-display text-2xl font-bold uppercase leading-tight text-white">
              {userReview ? 'Edit your review' : 'Write a review'}
            </h3>
            <p className="mt-0.5 text-sm text-subtle">{race.name} · {race.season}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1.5 -mt-1 p-1.5 rounded-md text-subtle hover:text-white hover:bg-card-hover transition-colors cursor-pointer">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="sr-only" htmlFor="review-content">Your review</label>
          <textarea
            id="review-content"
            value={reviewForm.content}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
            rows={6}
            maxLength={5000}
            placeholder="What made this race worth watching, or not?"
            required
            autoFocus
            className="field resize-none leading-relaxed"
          />
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-muted">
              <input
                type="checkbox"
                checked={reviewForm.spoiler}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, spoiler: e.target.checked }))}
                className="h-4 w-4 accent-f1-red"
              />
              Contains spoilers
            </label>
            <div className="flex items-center gap-2 ml-auto">
              {userReview && (
                <button type="button" onClick={onDelete} className="btn btn-sm text-subtle hover:text-red-400">
                  Delete
                </button>
              )}
              <button type="button" onClick={onClose} className="btn btn-sm btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting || !reviewForm.content.trim()} className="btn btn-sm btn-primary">
                {submitting ? 'Saving…' : userReview ? 'Save' : 'Publish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Ligne de classement : position, pilote, statut
function ResultRow({ pos, entry, note }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 border-b border-line last:border-0">
      <span className={`w-7 text-sm font-semibold tabular-nums text-right shrink-0 ${pos === 1 ? 'text-star' : 'text-subtle'}`}>{pos}</span>
      <Link to={`/pilotes/${entry.driver_id}`} className="flex-1 min-w-0 truncate text-sm text-white hover:text-f1-red transition-colors">
        <span className="text-muted">{entry.drivers?.given_name}</span> <span className="font-semibold">{entry.drivers?.family_name}</span>
      </Link>
      {note && <span className="text-xs text-subtle shrink-0 truncate max-w-28">{note}</span>}
    </li>
  )
}

function ResultList({ title, rows, open, onToggle }) {
  if (rows.length === 0) return null
  return (
    <section>
      <h2 className="section-title mb-4">{title}</h2>
      <ol className="rounded-lg border border-line bg-card/50">
        {(open ? rows : rows.slice(0, 10)).map((r) => <ResultRow key={r.entry.driver_id} {...r} />)}
      </ol>
      {rows.length > 10 && (
        <button onClick={onToggle} className="mt-2 text-sm text-muted hover:text-white transition-colors cursor-pointer">
          {open ? 'Show top 10' : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  )
}

function Breadcrumb({ saison }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-subtle mb-3">
      <Link to="/gps" className="hover:text-white transition-colors">Grands Prix</Link>
      <span aria-hidden="true">/</span>
      <Link to={`/saisons/${saison}`} className="hover:text-white transition-colors">{saison} season</Link>
    </nav>
  )
}

export default function GrandPrix() {
  const { saison, slug } = useParams()
  const { user, profile, loading: authLoading } = useAuth()

  const [race, setRace] = useState(null)
  const [raceDrivers, setRaceDrivers] = useState([])
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [isFuture, setIsFuture] = useState(false)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [reviewSort, setReviewSort] = useState('likes')
  const [showAllFollowing, setShowAllFollowing] = useState(false)

  const [userRating, setUserRating] = useState(null)
  const [userReview, setUserReview] = useState(null)
  const [userLikes, setUserLikes] = useState(new Set())
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ content: '', spoiler: false })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)
  const [showAllQualifs, setShowAllQualifs] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    if (authLoading) return

    setLoading(true)
    setIsFuture(false)
    setFollowingIds(new Set())
    setReviewSort('likes')
    setShowAllFollowing(false)
    setUserRating(null)
    setUserReview(null)
    setUserLikes(new Set())
    setShowReviewModal(false)
    setReviews([])
    setRace(null)
    setActionError(null)

    async function load() {
      const data = await api(`/races/${saison}/${slug}`)
      const raceData = data.race
      if (!raceData) { setLoading(false); return }
      setRace(raceData)

      // Block future GPs
      if (data.isFuture) {
        setIsFuture(true)
        setLoading(false)
        return
      }

      if (data.raceDrivers.length > 0) {
        setRaceDrivers(data.raceDrivers)
      } else {
        // Results not seeded yet — fetch live from Jolpica
        try {
          const fetcher = raceData.race_type === 'sprint' ? getSprintResults : getRaceResults
          const live = await fetcher(raceData.season, raceData.round)
          const entries = (raceData.race_type === 'sprint' ? live?.SprintResults : live?.Results) ?? []
          setRaceDrivers(entries.map((r) => ({
            driver_id: r.Driver.driverId,
            position: /^\d+$/.test(r.positionText) ? parseInt(r.position) : null,
            grid_position: parseInt(r.grid) || null,
            status: r.status,
            drivers: { id: r.Driver.driverId, given_name: r.Driver.givenName, family_name: r.Driver.familyName },
          })))
        } catch {
          setRaceDrivers([])
        }
      }

      setAvgRating(data.avgRating)
      setFollowingIds(new Set(data.followingIds))
      setReviews(data.reviews)
      setReviewCount(data.reviews.length)
      setUserRating(data.myRating)
      setUserReview(data.myReview)
      setUserLikes(new Set(data.myLikes))
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [saison, slug, user?.id, authLoading])

  // Toutes les actions passent par ici : une erreur (session expirée, réseau) s'affiche au lieu d'échouer en silence
  const run = async (fn) => {
    setActionError(null)
    try { await fn() } catch (err) {
      setActionError(err.status === 401 ? 'Your session expired. Sign in again.' : err.message)
      return false
    }
    return true
  }

  const handleRating = (score) => run(async () => {
    if (!user || !race || isFuture) return
    const previous = userRating
    setUserRating(score)
    try {
      const { avgRating } = await api(`/races/${race.id}/rating`, { method: 'PUT', body: { score } })
      setAvgRating(avgRating)
      setReviews((prev) => prev.map((r) => r.user_id === user.id ? { ...r, rating: score } : r))
    } catch (err) {
      setUserRating(previous)
      throw err
    }
  })

  const handleDeleteRating = () => run(async () => {
    if (!user || !race) return
    const { avgRating } = await api(`/races/${race.id}/rating`, { method: 'DELETE' })
    setUserRating(null)
    setAvgRating(avgRating)
    setReviews((prev) => prev.map((r) => r.user_id === user.id ? { ...r, rating: null } : r))
  })

  const handleOpenReviewModal = () => {
    setActionError(null)
    setReviewForm({ content: userReview?.content ?? '', spoiler: userReview?.spoiler ?? false })
    setShowReviewModal(true)
  }

  const closeModal = useCallback(() => setShowReviewModal(false), [])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user || !race || !reviewForm.content.trim() || isFuture) return
    setReviewSubmitting(true)
    const ok = await run(async () => {
      const data = await api(`/races/${race.id}/review`, { method: 'PUT', body: reviewForm })
      if (userReview) {
        setReviews((prev) => prev.map((r) => r.id === data.id ? { ...r, ...data } : r))
      } else {
        setReviews((prev) => [{ ...data, user_id: user.id, username: profile?.username ?? '', displayName: profile?.display_name ?? '', rating: userRating, likes: 0 }, ...prev])
        setReviewCount((n) => n + 1)
      }
      setUserReview(data)
    })
    setReviewSubmitting(false)
    if (ok) setShowReviewModal(false)
  }

  const handleDeleteReview = async () => {
    if (!userReview) return
    const ok = await run(async () => {
      await api(`/races/${race.id}/review`, { method: 'DELETE' })
      setReviews((prev) => prev.filter((r) => r.id !== userReview.id))
      setReviewCount((n) => n - 1)
      setUserReview(null)
    })
    if (ok) setShowReviewModal(false)
  }

  const handleLike = (reviewId) => run(async () => {
    if (!user) return
    const liked = userLikes.has(reviewId)
    await api(`/reviews/${reviewId}/like`, { method: liked ? 'DELETE' : 'POST' })
    setUserLikes((prev) => { const n = new Set(prev); if (liked) n.delete(reviewId); else n.add(reviewId); return n })
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, likes: Math.max(0, (r.likes ?? 0) + (liked ? -1 : 1)) } : r))
  })

  if (loading) return <PageSkeleton />
  if (!race) return <EmptyState page title="Grand Prix not found" action="Browse Grands Prix" to="/gps">This race doesn't exist or its address changed.</EmptyState>

  const isSprint = race.race_type === 'sprint'
  if (isFuture) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex gap-6 sm:gap-8 items-end mb-10">
          <Poster race={race} eager className="w-28 sm:w-44 shrink-0" />
          <div className="min-w-0">
            <Breadcrumb saison={saison} />
            <h1 className="font-display font-bold uppercase text-4xl sm:text-6xl leading-[0.92] tracking-tight text-white">{race.name}</h1>
            <p className="mt-3 text-muted">{formatDateLong(race.date)} · {race.circuit}</p>
          </div>
        </div>
        <EmptyState title={isSprint ? "This sprint hasn't been raced yet" : "This Grand Prix hasn't been raced yet"}>
          Come back after the chequered flag to rate and review it.
        </EmptyState>
      </div>
    )
  }

  // Classés d'abord, puis non classés avec leur statut (DNF, DSQ…)
  const classified = raceDrivers.filter((rd) => rd.position != null).sort((a, b) => a.position - b.position)
  const results = [
    ...classified.map((rd) => ({ pos: rd.position, entry: rd, note: rd.status && rd.status !== 'Finished' && !/^\+/.test(rd.status) ? rd.status : null })),
    ...raceDrivers.filter((rd) => rd.position == null).map((rd) => ({ pos: '–', entry: rd, note: rd.status })),
  ]
  const grid = raceDrivers.filter((rd) => rd.grid_position != null).sort((a, b) => a.grid_position - b.grid_position)
    .map((rd) => ({ pos: rd.grid_position, entry: rd }))
  const followingReviews = user ? reviews.filter((r) => followingIds.has(r.user_id)) : []
  const sortedReviews = [...reviews].sort((a, b) =>
    reviewSort === 'likes' ? (b.likes ?? 0) - (a.likes ?? 0) : new Date(b.created_at) - new Date(a.created_at))
  const reviewProps = (r) => ({
    review: r,
    href: `/gps/${saison}/${slug}/review/${r.username}`,
    isLiked: userLikes.has(r.id),
    onLike: user && user.id !== r.user_id ? handleLike : undefined,
  })

  return (
    <div>
      {showReviewModal && (
        <ReviewModal
          race={race}
          userReview={userReview}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onSubmit={handleReviewSubmit}
          onDelete={handleDeleteReview}
          onClose={closeModal}
          submitting={reviewSubmitting}
          error={actionError}
        />
      )}

      {/* ── En-tête : backdrop flouté + poster + infos + mon activité ── */}
      <section className="relative isolate overflow-hidden border-b border-line">
        {race.poster_url && (
          <img src={race.poster_url} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover scale-110 blur-3xl opacity-25" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-page via-page/70 to-page/40" />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 grid gap-6 sm:gap-8 grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_260px] items-end">
          <Poster race={race} eager className="w-28 sm:w-48 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.9)]" />

          <div className="min-w-0">
            <Breadcrumb saison={saison} />
            <h1 className="font-display font-bold uppercase text-3xl sm:text-5xl lg:text-6xl leading-[0.92] tracking-tight text-white pr-2">
              {race.name}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted">
              {isSprint ? 'Sprint' : `Round ${race.round}`} · {formatDateLong(race.date)}
            </p>
            <p className="text-sm sm:text-base text-muted">{race.circuit} · {race.country}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              {avgRating != null ? (
                <>
                  <StarRating value={avgRating} size="md" />
                  <span className="text-sm text-muted">
                    <span className="font-semibold text-white tabular-nums">{avgRating.toFixed(1)}</span> average · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </>
              ) : (
                <span className="text-sm text-subtle">No ratings yet.</span>
              )}
            </div>
          </div>

          {/* Mon activité : visible partout, y compris sur mobile */}
          <aside aria-label="Your activity" className="col-span-2 lg:col-span-1 rounded-lg border border-line-strong bg-card/80 backdrop-blur p-4">
            {user ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted">{userRating != null ? 'Your rating' : 'Rate this race'}</p>
                <StarRating value={userRating ?? 0} size="lg" interactive showValue onChange={handleRating} />
                {userRating != null && (
                  <button onClick={handleDeleteRating} className="text-xs text-subtle hover:text-red-400 transition-colors cursor-pointer">
                    Remove rating
                  </button>
                )}
                <button onClick={handleOpenReviewModal} className="btn btn-secondary w-full mt-1">
                  <Icon name="pen" />
                  {userReview ? 'Edit your review' : 'Write a review'}
                </button>
                {actionError && !showReviewModal && <p role="alert" className="text-xs text-red-400 text-center">{actionError}</p>}
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted">Sign in to rate and review this race.</p>
                <Link to="/login" className="btn btn-primary w-full">Sign in</Link>
                <p className="text-xs text-subtle">
                  New here? <Link to="/register" className="text-muted underline underline-offset-2 hover:text-white">Create an account</Link>
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ── Critiques | Résultats ── */}
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-12">
          {followingReviews.length > 0 && (
            <section>
              <h2 className="section-title border-b border-line pb-3">From people you follow</h2>
              <div>
                {(showAllFollowing ? followingReviews : followingReviews.slice(0, 3)).map((r) => <ReviewCard key={r.id} {...reviewProps(r)} />)}
              </div>
              {followingReviews.length > 3 && (
                <button onClick={() => setShowAllFollowing((v) => !v)} className="mt-2 text-sm text-muted hover:text-white transition-colors cursor-pointer">
                  {showAllFollowing ? 'Show less' : `Show all ${followingReviews.length}`}
                </button>
              )}
            </section>
          )}

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <h2 className="section-title">
                Reviews <span className="font-sans text-base font-normal normal-case tracking-normal text-subtle tabular-nums">{reviews.length}</span>
              </h2>
              {reviews.length > 1 && (
                <Segmented label="Sort reviews" value={reviewSort} onChange={setReviewSort} options={[{ key: 'likes', label: 'Popular' }, { key: 'date', label: 'Recent' }]} />
              )}
            </div>

            {sortedReviews.length > 0 ? (
              <div>{sortedReviews.map((r) => <ReviewCard key={r.id} {...reviewProps(r)} />)}</div>
            ) : (
              <div className="mt-6">
                <EmptyState title="No reviews yet">
                  {user ? 'Write the first review of this race.' : 'Sign in to write the first review of this race.'}
                </EmptyState>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-10 lg:border-l lg:border-line lg:pl-8">
          <ResultList title={isSprint ? 'Sprint result' : 'Race result'} rows={results} open={showAllResults} onToggle={() => setShowAllResults((v) => !v)} />
          <ResultList title={isSprint ? 'Sprint grid' : 'Starting grid'} rows={grid} open={showAllQualifs} onToggle={() => setShowAllQualifs((v) => !v)} />
          {results.length === 0 && <p className="text-sm text-subtle">Results aren't available for this race yet.</p>}
        </aside>
      </div>
    </div>
  )
}

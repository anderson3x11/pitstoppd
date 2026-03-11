import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getCountryFlag } from '../lib/countryFlags'

function ReviewCard({ review, isLiked, onLike, isOwn }) {
  const [spoilerVisible, setSpoilerVisible] = useState(false)

  const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="rounded-lg border border-line bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to={`/${review.username}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors">
            {review.displayName}
          </Link>
          <span className="text-subtle text-xs">·</span>
          <span className="text-xs text-subtle">{formattedDate}</span>
        </div>
        {review.rating != null && <StarRating value={review.rating} size="sm" />}
      </div>

      {review.spoiler && !spoilerVisible ? (
        <div className="rounded bg-card-hover border border-line px-4 py-3 text-center">
          <p className="text-xs text-subtle mb-2">This review contains spoilers</p>
          <button onClick={() => setSpoilerVisible(true)} className="text-xs font-medium text-muted hover:text-white transition-colors cursor-pointer">
            Show anyway
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted leading-relaxed">{review.content}</p>
      )}

      <div className="flex items-center gap-4 pt-1">
        {!isOwn && (
          <button
            onClick={() => onLike?.(review.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${isLiked ? 'text-f1-red' : 'text-subtle hover:text-white'}`}
          >
            <span>{isLiked ? '♥' : '♡'}</span>
            <span>{review.likes ?? 0}</span>
          </button>
        )}
        {review.spoiler && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-card-hover border border-line text-subtle uppercase tracking-wide">
            Spoiler
          </span>
        )}
      </div>
    </div>
  )
}

function ReviewModal({ race, userReview, reviewForm, setReviewForm, onSubmit, onDelete, onClose, submitting }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-line bg-card p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            {userReview ? 'Edit my review' : 'Write a review'}
          </h3>
          <button onClick={onClose} className="text-subtle hover:text-white transition-colors text-lg leading-none cursor-pointer">
            ✕
          </button>
        </div>

        <p className="text-xs text-subtle">{race.name} · {race.season}</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <textarea
            value={reviewForm.content}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
            rows={5}
            placeholder="Your review…"
            required
            autoFocus
            className="w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-f1-red transition-colors resize-none"
          />
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reviewForm.spoiler}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, spoiler: e.target.checked }))}
                className="accent-f1-red"
              />
              <span className="text-sm text-muted">Contains spoilers</span>
            </label>
            <div className="flex items-center gap-3">
              {userReview && (
                <button type="button" onClick={onDelete} className="text-sm text-subtle hover:text-red-400 transition-colors cursor-pointer">
                  Delete
                </button>
              )}
              <button type="button" onClick={onClose} className="text-sm text-subtle hover:text-white transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-f1-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : userReview ? 'Edit' : 'Publish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GrandPrix() {
  const { saison, slug } = useParams()
  const { user, profile } = useAuth()

  const [race, setRace] = useState(null)
  const [raceDrivers, setRaceDrivers] = useState([])
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [userRating, setUserRating] = useState(null)
  const [userReview, setUserReview] = useState(null)
  const [userLikes, setUserLikes] = useState(new Set())
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ content: '', spoiler: false })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)
  const [showAllQualifs, setShowAllQualifs] = useState(false)

  useEffect(() => {
    setLoading(true)
    setUserRating(null)
    setUserReview(null)
    setUserLikes(new Set())
    setShowReviewModal(false)

    async function load() {
      const { data: raceData } = await supabase
        .from('races').select('*')
        .eq('season', parseInt(saison)).eq('slug', slug).single()

      if (!raceData) { setLoading(false); return }
      setRace(raceData)

      const { data: rdData } = await supabase
        .from('race_drivers')
        .select('position, grid_position, status, driver_id, drivers(id, given_name, family_name)')
        .eq('race_id', raceData.id)
      setRaceDrivers(rdData ?? [])

      const { data: ratingsData } = await supabase.from('ratings').select('score').eq('race_id', raceData.id)
      if (ratingsData?.length) {
        const avg = ratingsData.reduce((s, r) => s + r.score, 0) / ratingsData.length
        setAvgRating(Math.round(avg * 10) / 10)
      }

      const { data: reviewsData } = await supabase
        .from('reviews').select('id, content, spoiler, created_at, user_id')
        .eq('race_id', raceData.id).order('created_at', { ascending: false })
      setReviewCount(reviewsData?.length ?? 0)

      if (reviewsData?.length) {
        const reviewIds = reviewsData.map((r) => r.id)
        const userIds = [...new Set(reviewsData.map((r) => r.user_id))]
        const [{ data: profilesData }, { data: userRatings }, { data: likesData }] = await Promise.all([
          supabase.from('profiles').select('id, username, display_name').in('id', userIds),
          supabase.from('ratings').select('user_id, score').eq('race_id', raceData.id).in('user_id', userIds),
          supabase.from('likes').select('review_id').in('review_id', reviewIds),
        ])
        const profileMap = {}
        for (const p of profilesData ?? []) profileMap[p.id] = p
        const ratingMap = {}
        for (const r of userRatings ?? []) ratingMap[r.user_id] = r.score
        const likesMap = {}
        for (const l of likesData ?? []) likesMap[l.review_id] = (likesMap[l.review_id] ?? 0) + 1

        setReviews(reviewsData.map((r) => ({
          ...r,
          username: profileMap[r.user_id]?.username ?? 'anonymous',
          displayName: profileMap[r.user_id]?.display_name ?? 'Anonymous',
          rating: ratingMap[r.user_id] ?? null,
          likes: likesMap[r.id] ?? 0,
        })))

        if (user) {
          const [{ data: myRating }, { data: myReview }, { data: myLikes }] = await Promise.all([
            supabase.from('ratings').select('score').eq('user_id', user.id).eq('race_id', raceData.id).maybeSingle(),
            supabase.from('reviews').select('id, content, spoiler').eq('user_id', user.id).eq('race_id', raceData.id).maybeSingle(),
            supabase.from('likes').select('review_id').eq('user_id', user.id).in('review_id', reviewIds),
          ])
          setUserRating(myRating?.score ?? null)
          setUserReview(myReview ?? null)
          setUserLikes(new Set((myLikes ?? []).map((l) => l.review_id)))
        }
      } else if (user) {
        const [{ data: myRating }, { data: myReview }] = await Promise.all([
          supabase.from('ratings').select('score').eq('user_id', user.id).eq('race_id', raceData.id).maybeSingle(),
          supabase.from('reviews').select('id, content, spoiler').eq('user_id', user.id).eq('race_id', raceData.id).maybeSingle(),
        ])
        setUserRating(myRating?.score ?? null)
        setUserReview(myReview ?? null)
      }

      setLoading(false)
    }

    load()
  }, [saison, slug, user?.id])

  const handleRating = async (score) => {
    if (!user || !race) return
    setUserRating(score)
    await supabase.from('ratings').upsert(
      { user_id: user.id, race_id: race.id, score },
      { onConflict: 'user_id,race_id' }
    )
    const { data } = await supabase.from('ratings').select('score').eq('race_id', race.id)
    if (data?.length) setAvgRating(Math.round((data.reduce((s, r) => s + r.score, 0) / data.length) * 10) / 10)
  }

  const handleOpenReviewModal = () => {
    setReviewForm({ content: userReview?.content ?? '', spoiler: userReview?.spoiler ?? false })
    setShowReviewModal(true)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user || !race || !reviewForm.content.trim()) return
    setReviewSubmitting(true)
    if (userReview) {
      await supabase.from('reviews').update({ content: reviewForm.content, spoiler: reviewForm.spoiler }).eq('id', userReview.id)
      const updated = { ...userReview, content: reviewForm.content, spoiler: reviewForm.spoiler }
      setUserReview(updated)
      setReviews((prev) => prev.map((r) => r.id === userReview.id ? { ...r, ...updated } : r))
    } else {
      const { data } = await supabase.from('reviews')
        .insert({ user_id: user.id, race_id: race.id, content: reviewForm.content, spoiler: reviewForm.spoiler })
        .select('id, content, spoiler, created_at').single()
      if (data) {
        setUserReview(data)
        setReviews((prev) => [{ ...data, user_id: user.id, username: profile?.username ?? '', displayName: profile?.display_name ?? '', rating: userRating, likes: 0 }, ...prev])
        setReviewCount((n) => n + 1)
      }
    }
    setShowReviewModal(false)
    setReviewSubmitting(false)
  }

  const handleDeleteReview = async () => {
    if (!userReview) return
    await supabase.from('reviews').delete().eq('id', userReview.id)
    setReviews((prev) => prev.filter((r) => r.id !== userReview.id))
    setReviewCount((n) => n - 1)
    setUserReview(null)
    setShowReviewModal(false)
  }

  const handleLike = async (reviewId) => {
    if (!user) return
    const liked = userLikes.has(reviewId)
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('review_id', reviewId)
      setUserLikes((prev) => { const n = new Set(prev); n.delete(reviewId); return n })
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, likes: Math.max(0, (r.likes ?? 1) - 1) } : r))
    } else {
      await supabase.from('likes').insert({ user_id: user.id, review_id: reviewId })
      setUserLikes((prev) => new Set([...prev, reviewId]))
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, likes: (r.likes ?? 0) + 1 } : r))
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10"><p className="text-muted text-sm">Loading…</p></div>
  if (!race) return <div className="mx-auto max-w-4xl px-4 py-10"><p className="text-muted text-sm">Grand Prix not found.</p></div>

  const formattedDate = new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const classement = [...raceDrivers].filter((rd) => rd.position != null).sort((a, b) => a.position - b.position)
  const qualifs = [...raceDrivers].filter((rd) => rd.grid_position != null).sort((a, b) => a.grid_position - b.grid_position)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* ── Review modal ── */}
      {showReviewModal && (
        <ReviewModal
          race={race}
          userReview={userReview}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onSubmit={handleReviewSubmit}
          onDelete={handleDeleteReview}
          onClose={() => setShowReviewModal(false)}
          submitting={reviewSubmitting}
        />
      )}

      {/* ── Header ── */}
      <div className="flex gap-6 mb-10">
        {/* Poster */}
        <div className="hidden sm:block w-48 shrink-0 rounded-lg overflow-hidden border border-line aspect-[2/3] bg-card-hover">
          {race.poster_url ? (
            <img src={race.poster_url} alt={race.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card">
              <span className="text-5xl">{getCountryFlag(race.country)}</span>
              <span className="text-center text-[11px] font-medium text-subtle uppercase tracking-wide leading-tight px-2">{race.name}</span>
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 text-sm text-subtle">
            <Link to="/gps" className="hover:text-white transition-colors">GPs</Link>
            <span>/</span>
            <Link to={`/saisons/${saison}`} className="hover:text-white transition-colors">{saison}</Link>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight">{race.name}</h1>
          <p className="text-lg text-muted capitalize">{formattedDate}</p>
          <p className="text-lg text-muted">{race.circuit} · {race.country}</p>

          <div className="flex items-center gap-3 pt-2">
            {avgRating != null ? (
              <>
                <StarRating value={avgRating} size="lg" showValue />
                <span className="text-sm text-subtle">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <span className="text-sm text-subtle">No ratings yet</span>
            )}
          </div>
        </div>

        {/* ── "My Activity" card ── */}
        <div className="hidden sm:flex flex-col w-52 shrink-0 rounded-lg border border-line bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-subtle mb-4">My Activity</h3>

          {user ? (
            <>
              {/* Rating — centered, large value if rated */}
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <StarRating
                  value={userRating ?? 0}
                  size="lg"
                  interactive
                  onChange={handleRating}
                />
                {userRating != null ? (
                  <span className="text-3xl font-black text-star tabular-nums">
                    {userRating.toFixed(1)}
                  </span>
                ) : (
                  <p className="text-xs text-subtle italic">Not rated yet</p>
                )}
              </div>

              {/* Review indicator + button at bottom */}
              <div className="border-t border-line pt-3 space-y-2">
                {userReview && (
                  <p className="text-xs text-center text-subtle">
                    ✓ Review written
                  </p>
                )}
                <button
                  onClick={handleOpenReviewModal}
                  className="w-full rounded border border-line px-3 py-2 text-xs font-medium text-muted hover:text-white hover:border-subtle transition-colors text-center cursor-pointer"
                >
                  {userReview ? 'Edit my review' : 'Write a review'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                Sign in to rate this GP and write a review.
              </p>
              <Link
                to="/login"
                className="block text-center rounded bg-f1-red px-3 py-2 text-xs font-semibold text-white hover:bg-f1-red-hover transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Race Results + Qualifying | Reviews ── */}
      <div className="grid grid-cols-3 gap-8">

        {/* Left column — Race Results + Qualifying */}
        <div className="space-y-8">

          {/* Race Results */}
          <section>
            <h2 className="text-lg font-bold text-white mb-5">Race Results</h2>
            <div className="rounded-lg border border-line overflow-hidden">
              {(showAllResults ? classement : classement.slice(0, 5)).map((r) => (
                <div key={r.driver_id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-line last:border-0 hover:bg-card-hover transition-colors">
                  <span className="w-4 text-xs font-bold text-muted tabular-nums text-right shrink-0">{r.position}</span>
                  <Link to={`/pilotes/${r.driver_id}`} className="text-sm font-medium text-white hover:text-f1-red transition-colors flex-1 truncate">
                    {r.drivers?.given_name} {r.drivers?.family_name}
                  </Link>
                  {r.status && r.status !== 'Finished' && (
                    <span className="text-[10px] text-subtle shrink-0">{r.status}</span>
                  )}
                </div>
              ))}
            </div>
            {classement.length > 5 && (
              <button onClick={() => setShowAllResults((v) => !v)} className="mt-2 text-xs text-muted hover:text-white transition-colors cursor-pointer underline underline-offset-2">
                {showAllResults ? 'View less' : `View all ${classement.length}`}
              </button>
            )}
          </section>

          {/* Qualifying */}
          <section>
            <h2 className="text-lg font-bold text-white mb-5">Qualifying</h2>
            <div className="rounded-lg border border-line overflow-hidden">
              {(showAllQualifs ? qualifs : qualifs.slice(0, 5)).map((q) => (
                <div key={q.driver_id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-line last:border-0 hover:bg-card-hover transition-colors">
                  <span className="w-4 text-xs font-bold text-muted tabular-nums text-right shrink-0">{q.grid_position}</span>
                  <Link to={`/pilotes/${q.driver_id}`} className="text-sm font-medium text-white hover:text-f1-red transition-colors flex-1 truncate">
                    {q.drivers?.given_name} {q.drivers?.family_name}
                  </Link>
                </div>
              ))}
            </div>
            {qualifs.length > 5 && (
              <button onClick={() => setShowAllQualifs((v) => !v)} className="mt-2 text-xs text-muted hover:text-white transition-colors cursor-pointer underline underline-offset-2">
                {showAllQualifs ? 'View less' : `View all ${qualifs.length}`}
              </button>
            )}
          </section>

        </div>

        {/* Right column — Reviews */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">
              Reviews <span className="text-subtle font-normal text-sm">({reviewCount})</span>
            </h2>
            {/* Mobile-only button ("My Activity" card is hidden on mobile) */}
            {user && (
              <button
                onClick={handleOpenReviewModal}
                className="sm:hidden rounded bg-f1-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors cursor-pointer"
              >
                {userReview ? 'Edit' : 'Write'}
              </button>
            )}
          </div>

          {!user && (
            <div className="mb-5 rounded-lg border border-line bg-card p-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted">Sign in to write a review.</p>
              <Link to="/login" className="text-sm font-medium text-f1-red hover:text-f1-red-hover transition-colors shrink-0">
                Sign in
              </Link>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} isLiked={userLikes.has(r.id)} onLike={user ? handleLike : undefined} isOwn={user?.id === r.user_id} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-subtle">No reviews yet.</p>
          )}
        </div>

      </div>
    </div>
  )
}

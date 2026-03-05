import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { supabase } from '../lib/supabase'

const isLoggedIn = false

function ReviewCard({ review }) {
  const [spoilerVisible, setSpoilerVisible] = useState(false)

  const formattedDate = new Date(review.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="rounded-lg border border-line bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to={`/${review.username}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors">
            {review.username}
          </Link>
          <span className="text-subtle text-xs">·</span>
          <span className="text-xs text-subtle">{formattedDate}</span>
        </div>
        {review.rating != null && <StarRating value={review.rating} size="sm" />}
      </div>

      {review.spoiler && !spoilerVisible ? (
        <div className="rounded bg-card-hover border border-line px-4 py-3 text-center">
          <p className="text-xs text-subtle mb-2">Cette critique contient des spoilers</p>
          <button
            onClick={() => setSpoilerVisible(true)}
            className="text-xs font-medium text-muted hover:text-white transition-colors"
          >
            Afficher quand même
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted leading-relaxed">{review.content}</p>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button className="flex items-center gap-1.5 text-xs text-subtle hover:text-white transition-colors">
          <span>♡</span>
          <span>{review.likes ?? 0}</span>
        </button>
        {review.spoiler && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-card-hover border border-line text-subtle uppercase tracking-wide">
            Spoiler
          </span>
        )}
      </div>
    </div>
  )
}

export default function GrandPrix() {
  const { saison, slug } = useParams()
  const [classementVisible, setClassementVisible] = useState(false)
  const [qualifsVisible, setQualifsVisible] = useState(false)
  const [race, setRace] = useState(null)
  const [raceDrivers, setRaceDrivers] = useState([])
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    async function load() {
      // 1. Fetch race
      const { data: raceData } = await supabase
        .from('races')
        .select('*')
        .eq('season', parseInt(saison))
        .eq('slug', slug)
        .single()

      if (!raceData) {
        setLoading(false)
        return
      }
      setRace(raceData)

      // 2. Fetch race_drivers with driver info
      const { data: rdData } = await supabase
        .from('race_drivers')
        .select('position, grid_position, status, driver_id, drivers(id, given_name, family_name)')
        .eq('race_id', raceData.id)

      setRaceDrivers(rdData ?? [])

      // 3. Fetch ratings to compute average
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('score')
        .eq('race_id', raceData.id)

      if (ratingsData && ratingsData.length > 0) {
        const avg = ratingsData.reduce((sum, r) => sum + r.score, 0) / ratingsData.length
        setAvgRating(Math.round(avg * 10) / 10)
      }

      // 4. Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, content, spoiler, created_at, user_id')
        .eq('race_id', raceData.id)
        .order('created_at', { ascending: false })

      setReviewCount(reviewsData?.length ?? 0)

      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map((r) => r.user_id))]

        const [{ data: profilesData }, { data: userRatings }] = await Promise.all([
          supabase.from('profiles').select('id, username').in('id', userIds),
          supabase.from('ratings').select('user_id, score').eq('race_id', raceData.id).in('user_id', userIds),
        ])

        const profileMap = {}
        for (const p of profilesData ?? []) profileMap[p.id] = p.username

        const ratingMap = {}
        for (const r of userRatings ?? []) ratingMap[r.user_id] = r.score

        setReviews(
          reviewsData.map((r) => ({
            ...r,
            username: profileMap[r.user_id] ?? 'Anonyme',
            rating: ratingMap[r.user_id] ?? null,
          }))
        )
      }

      setLoading(false)
    }

    load()
  }, [saison, slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">Chargement…</p>
      </div>
    )
  }

  if (!race) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">Grand Prix introuvable.</p>
      </div>
    )
  }

  const formattedDate = new Date(race.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const classement = [...raceDrivers]
    .filter((rd) => rd.position != null)
    .sort((a, b) => a.position - b.position)

  const qualifs = [...raceDrivers]
    .filter((rd) => rd.grid_position != null)
    .sort((a, b) => a.grid_position - b.grid_position)

  const pilotes = raceDrivers.map((rd) => rd.drivers).filter(Boolean)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* ── En-tête ── */}
      <div className="flex gap-6 mb-10">
        {/* Poster */}
        <div className="hidden sm:block w-36 shrink-0 rounded-lg overflow-hidden border border-line aspect-[2/3] bg-card-hover">
          {race.poster_url ? (
            <img src={race.poster_url} alt={race.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-3xl">🏁</span>
            </div>
          )}
        </div>

        {/* Infos principales */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link to="/gps" className="hover:text-white transition-colors">GPs</Link>
            <span>/</span>
            <Link to={`/saisons/${saison}`} className="hover:text-white transition-colors">{saison}</Link>
          </div>
          <h1 className="text-3xl font-black text-white">{race.name}</h1>
          <p className="text-sm text-muted capitalize">{formattedDate}</p>
          <p className="text-sm text-muted">{race.circuit} · {race.country}</p>

          {/* Note globale */}
          <div className="flex items-center gap-3 pt-2">
            {avgRating != null ? (
              <>
                <StarRating value={avgRating} size="lg" showValue />
                <span className="text-sm text-subtle">{reviewCount} critique{reviewCount !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <span className="text-sm text-subtle">Aucune note pour l&apos;instant</span>
            )}
          </div>

          {/* Action noter */}
          {!isLoggedIn && (
            <div className="pt-2">
              <Link to="/login" className="text-sm text-muted hover:text-white transition-colors">
                Connectez-vous pour noter ce GP
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Pilotes ayant participé ── */}
      {pilotes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3 text-white">Pilotes</h2>
          <div className="flex flex-wrap gap-2">
            {pilotes.map((p) => (
              <Link
                key={p.id}
                to={`/pilotes/${p.id}`}
                className="rounded border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-white hover:border-subtle transition-colors"
              >
                {p.given_name} {p.family_name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Classement (spoiler) ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Classement</h2>
          <button
            onClick={() => setClassementVisible(!classementVisible)}
            className="text-xs font-medium text-muted hover:text-white transition-colors border border-line rounded px-2.5 py-1"
          >
            {classementVisible ? 'Masquer' : '🔒 Afficher les résultats'}
          </button>
        </div>
        {classementVisible ? (
          <div className="rounded-lg border border-line overflow-hidden">
            {classement.map((r) => (
              <div
                key={r.driver_id}
                className="flex items-center gap-4 px-4 py-2.5 border-b border-line last:border-0 hover:bg-card-hover transition-colors"
              >
                <span className="w-5 text-sm font-bold text-muted tabular-nums text-right">{r.position}</span>
                <Link to={`/pilotes/${r.driver_id}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors flex-1">
                  {r.drivers?.given_name} {r.drivers?.family_name}
                </Link>
                {r.status && r.status !== 'Finished' && (
                  <span className="text-xs text-subtle">{r.status}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-card px-4 py-6 text-center text-sm text-subtle">
            Les résultats sont masqués. Cliquez pour les afficher.
          </div>
        )}
      </section>

      {/* ── Qualifications (spoiler) ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Qualifications</h2>
          <button
            onClick={() => setQualifsVisible(!qualifsVisible)}
            className="text-xs font-medium text-muted hover:text-white transition-colors border border-line rounded px-2.5 py-1"
          >
            {qualifsVisible ? 'Masquer' : '🔒 Afficher les résultats'}
          </button>
        </div>
        {qualifsVisible ? (
          <div className="rounded-lg border border-line overflow-hidden">
            {qualifs.map((q) => (
              <div
                key={q.driver_id}
                className="flex items-center gap-4 px-4 py-2.5 border-b border-line last:border-0 hover:bg-card-hover transition-colors"
              >
                <span className="w-5 text-sm font-bold text-muted tabular-nums text-right">{q.grid_position}</span>
                <Link to={`/pilotes/${q.driver_id}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors flex-1">
                  {q.drivers?.given_name} {q.drivers?.family_name}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-card px-4 py-6 text-center text-sm text-subtle">
            Les qualifications sont masquées. Cliquez pour les afficher.
          </div>
        )}
      </section>

      {/* ── Critiques ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            Critiques <span className="text-subtle font-normal text-sm">({reviewCount})</span>
          </h2>
          {isLoggedIn && (
            <button className="rounded bg-f1-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors">
              Écrire une critique
            </button>
          )}
        </div>

        {!isLoggedIn && (
          <div className="mb-6 rounded-lg border border-line bg-card p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">Connectez-vous pour écrire une critique.</p>
            <Link to="/login" className="text-sm font-medium text-f1-red hover:text-f1-red-hover transition-colors shrink-0">
              Se connecter
            </Link>
          </div>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-subtle">Aucune critique pour l&apos;instant.</p>
        )}
      </section>

    </div>
  )
}

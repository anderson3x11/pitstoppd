import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getTeamColor } from '../lib/teamColors'
import { getTeamPhoto } from '../lib/teamPhotos'
import ReviewCard from '../components/ReviewCard'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { PageSkeleton, EmptyState } from '../components/PageState'

const CURRENT_YEAR = new Date().getFullYear()

export default function Profil() {
  const { username } = useParams()
  const { user, profile: currentUserProfile, loading: authLoading } = useAuth()

  const [profil, setProfil] = useState(null)
  const [stats, setStats] = useState({ notes: 0, currentSeason: 0, critiques: 0, abonnes: 0, abonnements: 0 })
  const [ratingStats, setRatingStats] = useState(null)
  const [dernieresReviews, setDernieresReviews] = useState([])
  const [popularReviews, setPopularReviews] = useState([])
  const [topPilotes, setTopPilotes] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState(null)

  const isOwnProfile = currentUserProfile?.username === username

  useEffect(() => {
    if (authLoading) return

    setLoading(true)
    setProfil(null)
    setTopPilotes([])
    setDernieresReviews([])
    setPopularReviews([])
    setRatingStats(null)
    setIsFollowing(false)

    async function load() {
      const data = await api(`/users/${username}`)
      if (!data.profil) {
        setLoading(false)
        return
      }
      setProfil(data.profil)
      setStats(data.stats)
      setRatingStats(data.ratingStats)
      setDernieresReviews(data.reviews.slice(0, 3))
      setPopularReviews([...data.reviews].sort((a, b) => b.likeCount - a.likeCount).slice(0, 3).filter((r) => r.likeCount > 0))
      setTopPilotes(data.topPilotes)
      setIsFollowing(data.isFollowing)
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [username, user?.id, authLoading])

  const handleFollow = async () => {
    if (!user || !profil) return
    setFollowLoading(true)
    setFollowError(null)
    try {
      await api(`/users/${profil.username}/follow`, { method: isFollowing ? 'DELETE' : 'POST' })
      setStats((prev) => ({ ...prev, abonnes: prev.abonnes + (isFollowing ? -1 : 1) }))
      setIsFollowing(!isFollowing)
    } catch (err) {
      setFollowError(err.message)
    }
    setFollowLoading(false)
  }

  if (loading) return <PageSkeleton />
  if (!profil) return <EmptyState page title="User not found" action="Back to home">No Pitstoppd member uses this username.</EmptyState>

  const teamColor = getTeamColor(profil.favorite_team)
  const teamPhoto = getTeamPhoto(profil.favorite_team)

  const statItems = [
    { label: 'Races rated', value: stats.notes },
    { label: `In ${CURRENT_YEAR}`, value: stats.currentSeason },
    { label: 'Reviews', value: stats.critiques, to: `/${username}/reviews` },
    { label: 'Followers', value: stats.abonnes },
    { label: 'Following', value: stats.abonnements },
  ]

  return (
    <div>
      {/* ── En-tête ── */}
      <section className="relative overflow-hidden border-b border-line bg-card/40">
        <div className="h-1" style={{ background: teamColor?.hex ?? 'var(--color-f1-red)' }} />
        {teamPhoto && (
          <img src={teamPhoto} alt="" aria-hidden="true" className="pointer-events-none select-none absolute right-[max(1rem,calc((100vw-72rem)/2))] top-1/2 -translate-y-1/2 h-40 w-auto object-contain opacity-[0.05]" />
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-10 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
          <Avatar profile={profil} className="w-24 h-24 sm:w-32 sm:h-32 text-4xl ring-2 ring-line-strong" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-none">{profil.display_name}</h1>
              {isOwnProfile ? (
                <Link to="/settings" className="btn btn-secondary btn-sm">Edit profile</Link>
              ) : user ? (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  aria-pressed={isFollowing}
                  className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm">Follow</Link>
              )}
            </div>
            <p className="mt-1.5 text-subtle">@{profil.username}</p>
            {profil.bio && <p className="mt-3 text-muted leading-relaxed max-w-[60ch]">{profil.bio}</p>}
            {followError && <p role="alert" className="mt-2 text-sm text-red-400">{followError}</p>}
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end lg:flex-nowrap lg:divide-x lg:divide-line lg:gap-x-0">
            {statItems.map((s) => {
              const value = <dd className="font-display text-3xl font-bold text-white tabular-nums leading-none">{s.value}</dd>
              return (
                <div key={s.label} className="flex flex-col-reverse items-start lg:items-center lg:px-5 gap-1">
                  <dt className="text-xs text-subtle whitespace-nowrap">{s.label}</dt>
                  {s.to ? <Link to={s.to} className="hover:text-f1-red [&_dd]:hover:text-f1-red [&_dd]:transition-colors">{value}</Link> : value}
                </div>
              )
            })}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-12 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-12">
          {topPilotes.length > 0 && (
            <section>
              <h2 className="section-title border-b border-line pb-3 mb-4">Favorite drivers</h2>
              <ol className="grid grid-cols-3 gap-3 max-w-md">
                {topPilotes.map((driver, i) => {
                  const photo = getDriverPhoto(driver)
                  return (
                    <li key={driver.id}>
                      <Link to={`/pilotes/${driver.id}`} className="group block">
                        <div className="relative aspect-[2/3] rounded-md overflow-hidden ring-1 ring-inset ring-white/10 bg-card-hover">
                          {photo ? (
                            <img src={photo} alt="" loading="lazy" className="w-full h-full object-cover object-top transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="font-display text-3xl font-bold text-subtle">{driver.given_name?.[0]}{driver.family_name?.[0]}</span>
                            </div>
                          )}
                          <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">{i + 1}</span>
                        </div>
                        <p className="mt-2 text-sm text-white truncate group-hover:text-f1-red transition-colors">
                          <span className="text-muted">{driver.given_name}</span> <span className="font-semibold">{driver.family_name}</span>
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          <section>
            <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
              <h2 className="section-title">Recent reviews</h2>
              {stats.critiques > 3 && (
                <Link to={`/${username}/reviews`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-white transition-colors">
                  All {stats.critiques} <Icon name="arrowRight" className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            {dernieresReviews.length > 0 ? (
              <div>{dernieresReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
            ) : (
              <div className="mt-6">
                <EmptyState title="No reviews yet" action={isOwnProfile ? 'Find a race to review' : undefined} to="/gps">
                  {isOwnProfile ? 'Your reviews will show up here.' : `${profil.display_name} hasn't reviewed a race yet.`}
                </EmptyState>
              </div>
            )}
          </section>

          {popularReviews.length > 0 && (
            <section>
              <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
                <h2 className="section-title">Popular reviews</h2>
                <Link to={`/${username}/reviews?sort=likes`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-white transition-colors">
                  Most liked <Icon name="arrowRight" className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div>{popularReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
            </section>
          )}
        </div>

        <aside className="space-y-10">
          {ratingStats && (
            <section>
              <h2 className="section-title border-b border-line pb-3 mb-4">Ratings</h2>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-white tabular-nums">{ratingStats.avg}</span>
                <StarRating value={Math.round(parseFloat(ratingStats.avg) * 2) / 2} />
              </div>
              <p className="text-sm text-subtle">{ratingStats.total} {ratingStats.total === 1 ? 'rating' : 'ratings'}</p>
              {/* Histogramme façon Letterboxd : de 0.5 à 5, barres verticales */}
              <div className="mt-4 flex items-end gap-1 h-20" role="img" aria-label="Rating distribution">
                {[...ratingStats.distribution].reverse().map(({ value, count }) => (
                  <div key={value} className="group relative flex-1 h-full flex items-end" title={`${value}★ · ${count}`}>
                    <div
                      className="w-full rounded-t-sm bg-line-strong group-hover:bg-star transition-colors"
                      style={{ height: `${Math.max(4, (count / ratingStats.maxCount) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-subtle">
                <span>½★</span>
                <span>5★</span>
              </div>
            </section>
          )}

          {profil.favorite_team && (
            <section>
              <h2 className="section-title border-b border-line pb-3 mb-4">Favorite team</h2>
              <div
                className="rounded-lg border px-4 py-3 flex items-center gap-4"
                style={{
                  borderColor: teamColor ? `${teamColor.hex}55` : 'var(--color-line)',
                  background: teamColor ? `linear-gradient(135deg, rgba(${teamColor.rgb.join(',')},0.10), var(--color-card) 70%)` : 'var(--color-card)',
                }}
              >
                {teamPhoto && <img src={teamPhoto} alt="" className="h-7 w-auto object-contain shrink-0" />}
                <p className="font-semibold text-white">{profil.favorite_team}</p>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

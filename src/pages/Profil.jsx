import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getTeamColor } from '../lib/teamColors'
import { getTeamPhoto } from '../lib/teamPhotos'

function ReviewCard({ review }) {
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
          {review.rating != null && <StarRating value={review.rating} size="sm" showValue />}
          <span className="text-xs text-subtle">{review.raceSeason}</span>
        </div>
      </div>

      {review.spoiler && !spoilerVisible ? (
        <div className="rounded bg-card-hover border border-line px-3 py-2 text-center">
          <p className="text-xs text-subtle mb-1">Contains spoilers</p>
          <button onClick={() => setSpoilerVisible(true)} className="text-xs font-medium text-muted hover:text-white transition-colors cursor-pointer">
            Show anyway
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted leading-relaxed">{review.content}</p>
      )}
    </div>
  )
}

export default function Profil() {
  const { username } = useParams()
  const { user, profile: currentUserProfile } = useAuth()

  const [profil, setProfil] = useState(null)
  const [stats, setStats] = useState({ notes: 0, critiques: 0, abonnes: 0, abonnements: 0 })
  const [dernieresReviews, setDernieresReviews] = useState([])
  const [topPilotes, setTopPilotes] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwnProfile = currentUserProfile?.username === username

  useEffect(() => {
    setLoading(true)
    setProfil(null)
    setTopPilotes([])
    setDernieresReviews([])
    setIsFollowing(false)

    async function load() {
      const { data: profilData } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, favorite_team, top_pilots')
        .eq('username', username)
        .maybeSingle()

      if (!profilData) {
        setLoading(false)
        return
      }

      setProfil(profilData)

      const [
        { count: notesCount },
        { count: critiquesCount },
        { count: abonnesCount },
        { count: abonnementsCount },
      ] = await Promise.all([
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', profilData.id),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', profilData.id),
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profilData.id),
        supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profilData.id),
      ])

      setStats({
        notes: notesCount ?? 0,
        critiques: critiquesCount ?? 0,
        abonnes: abonnesCount ?? 0,
        abonnements: abonnementsCount ?? 0,
      })

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, content, spoiler, created_at, race_id, races(id, name, season, slug)')
        .eq('user_id', profilData.id)
        .order('created_at', { ascending: false })
        .limit(4)

      if (reviewsData?.length) {
        const raceIds = reviewsData.map((r) => r.race_id).filter(Boolean)
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('race_id, score')
          .eq('user_id', profilData.id)
          .in('race_id', raceIds)
        const ratingMap = {}
        for (const r of ratingsData ?? []) ratingMap[r.race_id] = r.score

        setDernieresReviews(reviewsData.map((r) => ({
          id: r.id,
          content: r.content,
          spoiler: r.spoiler,
          created_at: r.created_at,
          raceName: r.races?.name,
          raceSeason: r.races?.season,
          raceSlug: r.races?.slug,
          rating: ratingMap[r.race_id] ?? null,
        })))
      }

      if (profilData.top_pilots?.length > 0) {
        const { data: driversData } = await supabase
          .from('drivers')
          .select('id, given_name, family_name')
          .in('id', profilData.top_pilots)
        const driverMap = {}
        for (const d of driversData ?? []) driverMap[d.id] = d
        setTopPilotes(profilData.top_pilots.map((id) => driverMap[id]).filter(Boolean))
      }

      if (user && user.id !== profilData.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profilData.id)
          .maybeSingle()
        setIsFollowing(!!followData)
      }

      setLoading(false)
    }

    load()
  }, [username, user])

  const handleFollow = async () => {
    if (!user || !profil) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id)
        .eq('following_id', profil.id)
      setIsFollowing(false)
      setStats((prev) => ({ ...prev, abonnes: prev.abonnes - 1 }))
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profil.id })
      setIsFollowing(true)
      setStats((prev) => ({ ...prev, abonnes: prev.abonnes + 1 }))
    }
    setFollowLoading(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    )
  }

  if (!profil) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">User not found.</p>
      </div>
    )
  }

  const teamColor = getTeamColor(profil.favorite_team)
  const teamGradient = teamColor
    ? `radial-gradient(ellipse at 15% 60%, rgba(${teamColor.rgb[0]}, ${teamColor.rgb[1]}, ${teamColor.rgb[2]}, 0.12) 0%, transparent 65%)`
    : 'radial-gradient(ellipse at 15% 60%, rgba(232, 0, 45, 0.07) 0%, transparent 65%)'

  const showFavorites = profil.favorite_team || topPilotes.length > 0

  return (
    <div>

      {/* ── Hero header ── */}
      <section className="relative border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-br from-card-hover via-card to-page" />
        <div className="absolute inset-0" style={{ background: teamGradient }} />
        <div className="absolute inset-0 bg-gradient-to-t from-page via-transparent to-transparent" />

        {/* Team logo watermark */}
        {profil.favorite_team && getTeamPhoto(profil.favorite_team) && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="mx-auto max-w-4xl px-4 h-full flex items-center justify-end">
              <img
                src={getTeamPhoto(profil.favorite_team)}
                alt=""
                className="h-48 w-auto object-contain opacity-[0.06]"
              />
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-4xl px-4 py-16 flex items-center gap-8">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-card-hover border-2 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
            {profil.avatar_url ? (
              <img src={profil.avatar_url} alt={profil.display_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-subtle">
                {profil.display_name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 space-y-2 min-w-0">
            <h1 className="text-4xl font-black text-white leading-tight">{profil.display_name}</h1>
            <p className="text-base text-subtle">@{profil.username}</p>
            {profil.bio && (
              <p className="text-base text-muted leading-relaxed max-w-lg pt-1">{profil.bio}</p>
            )}
            <div className="flex items-center gap-6 pt-2">
              {[
                { label: 'Ratings', value: stats.notes },
                { label: 'Reviews', value: stats.critiques },
                { label: 'Followers', value: stats.abonnes },
                { label: 'Following', value: stats.abonnements },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-black text-white">{stat.value}</p>
                  <p className="text-xs text-subtle">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="pt-2">
              {isOwnProfile ? (
                <Link
                  to="/settings"
                  className="inline-block text-sm font-medium border border-line rounded px-4 py-2 text-muted hover:text-white hover:border-subtle transition-colors cursor-pointer"
                >
                  Edit profile
                </Link>
              ) : user ? (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`text-sm font-semibold rounded px-5 py-2 transition-colors disabled:opacity-60 cursor-pointer ${
                    isFollowing
                      ? 'border border-line text-muted hover:text-white hover:border-subtle'
                      : 'bg-f1-red text-white hover:bg-f1-red-hover'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-block text-sm font-semibold bg-f1-red rounded px-5 py-2 text-white hover:bg-f1-red-hover transition-colors"
                >
                  Follow
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">

        {/* ── Favorites ── */}
        {showFavorites && (
          <section>
            <h2 className="text-lg font-bold text-white mb-5">Favorites</h2>
            {/* Top 3 drivers */}
            {topPilotes.length > 0 && (
              <div className="flex gap-4 mb-4">
                {topPilotes.map((driver, i) => {
                  const photo = getDriverPhoto(driver)
                  return (
                    <Link key={driver.id} to={`/pilotes/${driver.id}`} className="flex-1 group">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-line bg-card-hover">
                        {photo ? (
                          <img
                            src={photo}
                            alt={`${driver.given_name} ${driver.family_name}`}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-card-hover to-card">
                            <span className="text-2xl font-black text-subtle">
                              {driver.given_name?.[0]}{driver.family_name?.[0]}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
                          <p className="text-xs font-bold text-white truncate">{driver.family_name}</p>
                          <p className="text-[10px] text-white/60 truncate">{driver.given_name}</p>
                        </div>
                      </div>
                      <p className="text-center text-sm font-black text-f1-red mt-2">{i + 1}</p>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Favorite team */}
            {profil.favorite_team && (() => {
              const teamPhoto = getTeamPhoto(profil.favorite_team)
              return (
                <div
                  className="rounded-lg border px-6 py-4 flex items-center gap-6"
                  style={{
                    borderColor: teamColor ? `${teamColor.hex}50` : '#262626',
                    background: teamColor
                      ? `linear-gradient(135deg, rgba(${teamColor.rgb[0]},${teamColor.rgb[1]},${teamColor.rgb[2]},0.08) 0%, #141414 100%)`
                      : '#141414',
                  }}
                >
                  {teamPhoto && (
                    <img
                      src={teamPhoto}
                      alt={profil.favorite_team}
                      className="h-10 w-auto object-contain shrink-0"
                    />
                  )}
                  <div>
                    <p className="text-xs text-subtle mb-0.5">Favorite Team</p>
                    <p className="text-lg font-black text-white">{profil.favorite_team}</p>
                  </div>
                </div>
              )
            })()}
          </section>
        )}

        {/* ── Latest Reviews ── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-5">Latest Reviews</h2>
          {dernieresReviews.length > 0 ? (
            <div className="space-y-3">
              {dernieresReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-subtle">No reviews yet.</p>
          )}
        </section>

      </div>
    </div>
  )
}

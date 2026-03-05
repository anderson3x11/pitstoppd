import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

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
          <p className="text-xs text-subtle mb-1">Contient des spoilers</p>
          <button onClick={() => setSpoilerVisible(true)} className="text-xs font-medium text-muted hover:text-white transition-colors">
            Afficher quand même
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
        <p className="text-muted text-sm">Chargement…</p>
      </div>
    )
  }

  if (!profil) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">Utilisateur introuvable.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* ── En-tête profil ── */}
      <div className="flex gap-5 mb-10 pb-8 border-b border-line">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-card-hover border border-line flex items-center justify-center overflow-hidden shrink-0">
          {profil.avatar_url ? (
            <img src={profil.avatar_url} alt={profil.display_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-subtle">
              {profil.display_name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white">{profil.display_name}</h1>
              <p className="text-sm text-subtle">@{profil.username}</p>
            </div>
            {isOwnProfile ? (
              <Link
                to="/settings"
                className="text-xs font-medium border border-line rounded px-3 py-1.5 text-muted hover:text-white hover:border-subtle transition-colors"
              >
                Modifier le profil
              </Link>
            ) : user ? (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`text-xs font-semibold rounded px-4 py-1.5 transition-colors disabled:opacity-60 ${
                  isFollowing
                    ? 'border border-line text-muted hover:text-white hover:border-subtle'
                    : 'bg-f1-red text-white hover:bg-f1-red-hover'
                }`}
              >
                {isFollowing ? 'Suivi' : 'Suivre'}
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold bg-f1-red rounded px-4 py-1.5 text-white hover:bg-f1-red-hover transition-colors"
              >
                Suivre
              </Link>
            )}
          </div>

          {profil.bio && (
            <p className="text-sm text-muted mt-2 leading-relaxed max-w-md">{profil.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-5 mt-4">
            {[
              { label: 'Notes', value: stats.notes },
              { label: 'Critiques', value: stats.critiques },
              { label: 'Abonnés', value: stats.abonnes },
              { label: 'Abonnements', value: stats.abonnements },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-sm font-bold text-white">{stat.value}</p>
                <p className="text-xs text-subtle">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Favoris ── */}
      {(profil.favorite_team || topPilotes.length > 0) && (
        <section className="mb-10">
          <div className="grid sm:grid-cols-2 gap-6">
            {profil.favorite_team && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-subtle mb-3">
                  Écurie favorite
                </h3>
                <div className="rounded-lg border border-line bg-card px-4 py-3">
                  <p className="text-sm font-semibold text-white">{profil.favorite_team}</p>
                </div>
              </div>
            )}
            {topPilotes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-subtle mb-3">
                  Top 3 pilotes
                </h3>
                <div className="space-y-2">
                  {topPilotes.map((p, i) => (
                    <Link
                      key={p.id}
                      to={`/pilotes/${p.id}`}
                      className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-2.5 hover:border-subtle hover:bg-card-hover transition-colors"
                    >
                      <span className="text-xs font-black text-f1-red w-4">{i + 1}</span>
                      <span className="text-sm font-medium text-white">
                        {p.given_name} {p.family_name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Dernières critiques ── */}
      <section>
        <h2 className="text-base font-bold text-white mb-4">Dernières critiques</h2>
        {dernieresReviews.length > 0 ? (
          <div className="space-y-3">
            {dernieresReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-subtle">Aucune critique pour l&apos;instant.</p>
        )}
      </section>

    </div>
  )
}

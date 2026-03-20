import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import ReviewCard from '../components/ReviewCard'
import { supabase } from '../lib/supabase'

export default function ProfilReviews() {
  const { username } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = searchParams.get('sort') === 'likes' ? 'likes' : 'date'

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setReviews([])
    setNotFound(false)

    async function load() {
      const { data: profilData } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .maybeSingle()

      if (!profilData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, content, spoiler, created_at, race_id, races(id, name, season, slug), likes(count)')
        .eq('user_id', profilData.id)
        .order('created_at', { ascending: false })

      if (!reviewsData?.length) {
        setLoading(false)
        return
      }

      const raceIds = reviewsData.map((r) => r.race_id).filter(Boolean)
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('race_id, score')
        .eq('user_id', profilData.id)
        .in('race_id', raceIds)
      const ratingMap = {}
      for (const r of ratingsData ?? []) ratingMap[r.race_id] = r.score

      const mapped = reviewsData.map((r) => ({
        id: r.id,
        content: r.content,
        spoiler: r.spoiler,
        created_at: r.created_at,
        raceName: r.races?.name,
        raceSeason: r.races?.season,
        raceSlug: r.races?.slug,
        rating: ratingMap[r.race_id] ?? null,
        likeCount: r.likes?.[0]?.count ?? 0,
      }))

      setReviews(mapped)
      setLoading(false)
    }

    load()
  }, [username])

  const sorted = sort === 'likes'
    ? [...reviews].sort((a, b) => b.likeCount - a.likeCount)
    : reviews

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">User not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-subtle">
        <Link to={`/${username}`} className="hover:text-white transition-colors">@{username}</Link>
        <span>/</span>
        <span className="text-muted">Reviews</span>
      </div>

      {/* Header + sort toggle */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-white">
          Reviews <span className="text-subtle font-normal text-lg">({reviews.length})</span>
        </h1>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1">
          <button
            onClick={() => setSearchParams({})}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
              sort === 'date' ? 'bg-card-hover text-white' : 'text-subtle hover:text-muted'
            }`}
          >
            Latest
          </button>
          <button
            onClick={() => setSearchParams({ sort: 'likes' })}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
              sort === 'likes' ? 'bg-card-hover text-white' : 'text-subtle hover:text-muted'
            }`}
          >
            Most liked
          </button>
        </div>
      </div>

      {/* Reviews list */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-subtle">No reviews yet.</p>
      )}

    </div>
  )
}

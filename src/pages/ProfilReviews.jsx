import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import ReviewCard from '../components/ReviewCard'
import Segmented from '../components/Segmented'
import { PageSkeleton, EmptyState } from '../components/PageState'
import { api } from '../lib/api'

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
      const { profil, reviews: list } = await api(`/users/${username}`)
      if (!profil) setNotFound(true)
      else setReviews(list)
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [username])

  const sorted = sort === 'likes'
    ? [...reviews].sort((a, b) => b.likeCount - a.likeCount)
    : reviews

  if (loading) return <PageSkeleton />
  if (notFound) return <EmptyState page title="User not found" action="Back to home">No Pitstoppd member uses this username.</EmptyState>

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-subtle mb-3">
        <Link to={`/${username}`} className="hover:text-white transition-colors">@{username}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-muted">Reviews</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <h1 className="page-title">
          Reviews <span className="font-sans text-xl font-normal not-italic normal-case text-subtle tabular-nums">{reviews.length}</span>
        </h1>
        {reviews.length > 1 && (
          <Segmented
            label="Sort reviews"
            value={sort}
            onChange={(key) => setSearchParams(key === 'likes' ? { sort: 'likes' } : {})}
            options={[{ key: 'date', label: 'Recent' }, { key: 'likes', label: 'Most liked' }]}
          />
        )}
      </div>

      {sorted.length > 0 ? (
        <div>{sorted.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
      ) : (
        <div className="mt-6">
          <EmptyState title="No reviews yet">@{username} hasn't reviewed a race yet.</EmptyState>
        </div>
      )}
    </div>
  )
}

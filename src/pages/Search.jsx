import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/PageState'

export default function Search() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      setResults(await api(`/users?q=${encodeURIComponent(q.trim())}`).catch(() => []))
      setLoading(false)
    }

    fetchResults()
  }, [q])

  const submit = (e) => {
    e.preventDefault()
    const term = new FormData(e.currentTarget).get('q').trim()
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="page-title">Find fans</h1>
      <form onSubmit={submit} role="search" className="mt-5 relative">
        <Icon name="search" className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          name="q"
          key={q}
          defaultValue={q}
          placeholder="Name or username…"
          aria-label="Search users"
          className="field pl-9"
        />
      </form>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] rounded-lg" />)}
          </div>
        ) : !q.trim() ? (
          <p className="text-sm text-subtle">Search by display name or @username, then follow people to see their ratings on your home page.</p>
        ) : results.length === 0 ? (
          <EmptyState title={`No one matches “${q}”`}>Check the spelling, or try part of a name.</EmptyState>
        ) : (
          <>
            <p className="text-sm text-subtle mb-3">{results.length} {results.length === 1 ? 'member' : 'members'} matching “{q}”</p>
            <ul className="rounded-lg border border-line bg-card/50">
              {results.map((user) => (
                <li key={user.username} className="border-b border-line last:border-0">
                  <Link to={`/${user.username}`} className="group flex items-center gap-4 p-4 hover:bg-card-hover transition-colors">
                    <Avatar profile={user} className="h-11 w-11 text-base" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate group-hover:text-f1-red transition-colors">{user.display_name}</p>
                      <p className="text-sm text-subtle truncate">@{user.username}</p>
                      {user.bio && <p className="text-sm text-muted mt-1 line-clamp-1">{user.bio}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

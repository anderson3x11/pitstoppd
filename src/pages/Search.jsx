import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Search() {
  const [searchParams] = useSearchParams()
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
      const term = q.trim().toLowerCase()
      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, bio')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(20)
      setResults(data || [])
      setLoading(false)
    }

    fetchResults()
  }, [q])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">Recherche</h1>
      {q && (
        <p className="text-sm text-muted mb-8">
          Résultats pour « <span className="text-white">{q}</span> »
        </p>
      )}

      {loading ? (
        <div className="text-sm text-subtle">Chargement…</div>
      ) : !q.trim() ? (
        <p className="text-sm text-subtle">Recherchez un utilisateur depuis la barre de navigation.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-subtle">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="space-y-2">
          {results.map((user) => (
            <Link
              key={user.username}
              to={`/${user.username}`}
              className="flex items-center gap-4 rounded-lg border border-line bg-card p-4 hover:bg-card-hover transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-card-hover border border-line overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-lg text-subtle">
                    {user.display_name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {user.display_name}
                </div>
                <div className="text-xs text-muted truncate">
                  @{user.username}
                </div>
                {user.bio && (
                  <div className="text-xs text-subtle mt-1 line-clamp-1">
                    {user.bio}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

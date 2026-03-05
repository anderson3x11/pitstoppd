import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import { supabase } from '../lib/supabase'

const TODAY = new Date().toISOString().split('T')[0]

export default function Saison() {
  const { annee } = useParams()
  const [gps, setGps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('races')
      .select('id, season, round, name, slug, circuit, country, date, poster_url')
      .eq('season', parseInt(annee))
      .lt('date', TODAY)
      .order('date', { ascending: true })
      .then(({ data }) => {
        setGps(data ?? [])
        setLoading(false)
      })
  }, [annee])

  const gpCards = gps.map((gp) => ({
    ...gp,
    posterUrl: gp.poster_url,
    avgRating: null,
    reviewCount: null,
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted mb-2">
          <Link to="/saisons" className="hover:text-white transition-colors">
            Saisons
          </Link>
          <span>/</span>
          <span>{annee}</span>
        </div>
        <h1 className="text-2xl font-black text-white">Saison {annee}</h1>
        <p className="text-sm text-muted mt-1">
          {loading ? 'Chargement…' : `${gps.length} Grands Prix`}
        </p>
      </div>

      {/* Grille GPs */}
      {loading ? (
        <p className="text-muted text-sm">Chargement…</p>
      ) : gpCards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gpCards.map((gp) => (
            <GPCard key={gp.id} gp={gp} />
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm">Aucun Grand Prix pour cette saison.</p>
      )}
    </div>
  )
}

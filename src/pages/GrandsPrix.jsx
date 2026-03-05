import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import { supabase } from '../lib/supabase'

const SAISONS = [2025, 2024, 2023, 2022, 2021, 2020]
const TODAY = new Date().toISOString().split('T')[0]

export default function GrandsPrix() {
  const [saisonActive, setSaisonActive] = useState(2025)
  const [gps, setGps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    supabase
      .from('races')
      .select('id, season, round, name, slug, circuit, country, date, poster_url')
      .eq('season', saisonActive)
      .lt('date', TODAY)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setGps(data ?? [])
        setLoading(false)
      })
  }, [saisonActive])

  // Adapter les noms de colonnes Supabase → props GPCard
  const gpCards = gps.map((gp) => ({
    ...gp,
    posterUrl: gp.poster_url,
    avgRating: null,
    reviewCount: null,
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Grands Prix</h1>
        <p className="text-sm text-muted mt-1">
          {loading ? 'Chargement…' : `${gps.length} courses · saison ${saisonActive}`}
        </p>
      </div>

      {/* Filtre par saison */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {SAISONS.map((s) => (
          <button
            key={s}
            onClick={() => setSaisonActive(s)}
            className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              saisonActive === s
                ? 'bg-f1-red text-white'
                : 'bg-card border border-line text-muted hover:text-white hover:border-subtle'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Lien vers la page saison */}
      <div className="mb-6">
        <Link
          to={`/saisons/${saisonActive}`}
          className="text-sm text-muted hover:text-white transition-colors"
        >
          Voir le bilan de la saison {saisonActive} →
        </Link>
      </div>

      {/* Contenu */}
      {error ? (
        <div className="text-center py-20 text-muted">
          <p>Erreur : {error}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-muted">
          <p>Chargement…</p>
        </div>
      ) : gpCards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gpCards.map((gp) => (
            <GPCard key={gp.id} gp={gp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted">
          <p>Aucun Grand Prix trouvé pour la saison {saisonActive}.</p>
        </div>
      )}

    </div>
  )
}

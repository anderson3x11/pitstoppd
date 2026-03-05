import { useState } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'

// Saisons disponibles (2020 → aujourd'hui)
const SAISONS = [2024, 2023, 2022, 2021, 2020]

// Données de démo
const GPS_DEMO = [
  { id: 1, name: 'Grand Prix d\'Abu Dhabi', season: 2024, slug: 'abu-dhabi', country: 'Émirats Arabes Unis', circuit: 'Yas Marina', date: '2024-12-08', posterUrl: null, avgRating: 3.5, reviewCount: 412 },
  { id: 2, name: 'Grand Prix de Las Vegas', season: 2024, slug: 'las-vegas', country: 'États-Unis', circuit: 'Las Vegas Strip Circuit', date: '2024-11-23', posterUrl: null, avgRating: 4.0, reviewCount: 638 },
  { id: 3, name: 'Grand Prix du Brésil', season: 2024, slug: 'bresil', country: 'Brésil', circuit: 'Interlagos', date: '2024-11-03', posterUrl: null, avgRating: 4.5, reviewCount: 891 },
  { id: 4, name: 'Grand Prix du Mexique', season: 2024, slug: 'mexique', country: 'Mexique', circuit: 'Autodromo Hermanos Rodriguez', date: '2024-10-27', posterUrl: null, avgRating: 3.0, reviewCount: 327 },
  { id: 5, name: 'Grand Prix des États-Unis', season: 2024, slug: 'etats-unis', country: 'États-Unis', circuit: 'Circuit of the Americas', date: '2024-10-20', posterUrl: null, avgRating: 4.2, reviewCount: 556 },
  { id: 6, name: 'Grand Prix de Singapour', season: 2024, slug: 'singapour', country: 'Singapour', circuit: 'Marina Bay Street Circuit', date: '2024-09-22', posterUrl: null, avgRating: 4.8, reviewCount: 1024 },
]

export default function GrandsPrix() {
  const [saisonActive, setSaisonActive] = useState(2024)

  const gpsFiltres = GPS_DEMO.filter((gp) => gp.season === saisonActive)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Grands Prix</h1>
        <p className="text-sm text-muted mt-1">
          {GPS_DEMO.length} courses · saisons 2020 à 2024
        </p>
      </div>

      {/* Filtre par saison */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {SAISONS.map((s) => (
          <button
            key={s}
            onClick={() => setSaisonActive(s)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
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

      {/* Grille de GPs */}
      {gpsFiltres.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gpsFiltres.map((gp) => (
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

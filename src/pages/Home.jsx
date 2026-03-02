import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import StarRating from '../components/StarRating'

// Données de démo — seront remplacées par l'API en Phase 4
const DERNIERS_GPS = [
  {
    id: 1,
    name: 'Grand Prix d\'Abu Dhabi',
    season: 2024,
    slug: 'abu-dhabi',
    country: 'Émirats Arabes Unis',
    circuit: 'Circuit de Yas Marina',
    date: '2024-12-08',
    posterUrl: null,
    avgRating: 3.5,
    reviewCount: 412,
  },
  {
    id: 2,
    name: 'Grand Prix de Las Vegas',
    season: 2024,
    slug: 'las-vegas',
    country: 'États-Unis',
    circuit: 'Las Vegas Strip Circuit',
    date: '2024-11-23',
    posterUrl: null,
    avgRating: 4.0,
    reviewCount: 638,
  },
  {
    id: 3,
    name: 'Grand Prix du Brésil',
    season: 2024,
    slug: 'bresil',
    country: 'Brésil',
    circuit: 'Circuit d\'Interlagos',
    date: '2024-11-03',
    posterUrl: null,
    avgRating: 4.5,
    reviewCount: 891,
  },
  {
    id: 4,
    name: 'Grand Prix du Mexique',
    season: 2024,
    slug: 'mexique',
    country: 'Mexique',
    circuit: 'Autodromo Hermanos Rodriguez',
    date: '2024-10-27',
    posterUrl: null,
    avgRating: 3.0,
    reviewCount: 327,
  },
]

const isLoggedIn = false

export default function Home() {
  const latestGP = DERNIERS_GPS[0]

  return (
    <div>

      {/* ── Hero : dernier GP en vedette ── */}
      <section className="relative border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-card-hover/60 to-page" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 flex items-end gap-8">

          {/* Poster placeholder */}
          <div className="hidden sm:block w-28 shrink-0 rounded-lg overflow-hidden border border-line aspect-[2/3] bg-card-hover">
            <div className="h-full w-full flex flex-col items-center justify-center p-2">
              <span className="text-3xl mb-1">🏁</span>
            </div>
          </div>

          {/* Infos */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-f1-red">
              Dernier Grand Prix
            </p>
            <h1 className="text-3xl font-black text-white leading-tight">
              {latestGP.name}
            </h1>
            <p className="text-sm text-muted">
              {latestGP.season} · {latestGP.circuit}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <StarRating value={latestGP.avgRating} size="md" showValue />
              <span className="text-xs text-subtle">{latestGP.reviewCount} critiques</span>
            </div>
            <div className="pt-2">
              <Link
                to={`/gps/${latestGP.season}/${latestGP.slug}`}
                className="inline-flex items-center gap-1.5 rounded bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors"
              >
                Voir le Grand Prix →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-14">

        {/* ── Critiques de vos amis ── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Critiques de vos amis</h2>
          {isLoggedIn ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sera rempli Phase 6 */}
              <p className="text-muted text-sm col-span-full">Aucune critique récente.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-card p-8 text-center space-y-3">
              <p className="text-white font-semibold">Rejoignez la communauté</p>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Connectez-vous pour voir les notes et critiques des utilisateurs que vous suivez.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="rounded bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors"
                >
                  Créer un compte
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted hover:text-white transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── Derniers Grands Prix ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Derniers Grands Prix</h2>
            <Link
              to="/gps"
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DERNIERS_GPS.map((gp) => (
              <GPCard key={gp.id} gp={gp} />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

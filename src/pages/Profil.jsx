import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'

const PROFIL_DEMO = {
  username: 'f1addict',
  displayName: 'Maxime R.',
  bio: 'Fan de F1 depuis les années Schumacher. McLaren forever.',
  avatarUrl: null,
  favoriteTeam: 'McLaren',
  topPilotes: [
    { id: 'norris', name: 'Lando Norris' },
    { id: 'senna', name: 'Ayrton Senna' },
    { id: 'hamilton', name: 'Lewis Hamilton' },
  ],
  stats: {
    notes: 42,
    critiques: 28,
    abonnes: 156,
    abonnements: 73,
  },
  derniersGPs: [
    { id: 1, name: 'GP de Singapour', season: 2024, slug: 'singapour', rating: 5.0 },
    { id: 2, name: 'GP d\'Abu Dhabi', season: 2024, slug: 'abu-dhabi', rating: 3.5 },
    { id: 3, name: 'GP de Las Vegas', season: 2024, slug: 'las-vegas', rating: 4.0 },
    { id: 4, name: 'GP du Brésil', season: 2024, slug: 'bresil', rating: 4.5 },
  ],
}

const isOwnProfile = false

export default function Profil() {
  const { username } = useParams()
  const profil = PROFIL_DEMO // TODO: charger depuis Supabase

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* ── En-tête profil ── */}
      <div className="flex gap-5 mb-10 pb-8 border-b border-line">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-card-hover border border-line flex items-center justify-center overflow-hidden shrink-0">
          {profil.avatarUrl ? (
            <img src={profil.avatarUrl} alt={profil.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-subtle">
              {profil.displayName[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white">{profil.displayName}</h1>
              <p className="text-sm text-subtle">@{profil.username}</p>
            </div>
            {isOwnProfile ? (
              <Link
                to="/settings"
                className="text-xs font-medium border border-line rounded px-3 py-1.5 text-muted hover:text-white hover:border-subtle transition-colors"
              >
                Modifier le profil
              </Link>
            ) : (
              <button className="text-xs font-semibold bg-f1-red rounded px-4 py-1.5 text-white hover:bg-f1-red-hover transition-colors">
                Suivre
              </button>
            )}
          </div>

          {profil.bio && (
            <p className="text-sm text-muted mt-2 leading-relaxed max-w-md">{profil.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-5 mt-4">
            {[
              { label: 'Notes', value: profil.stats.notes },
              { label: 'Critiques', value: profil.stats.critiques },
              { label: 'Abonnés', value: profil.stats.abonnes },
              { label: 'Abonnements', value: profil.stats.abonnements },
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
      <section className="mb-10">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Écurie favorite */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-subtle mb-3">
              Écurie favorite
            </h3>
            <div className="rounded-lg border border-line bg-card px-4 py-3">
              <p className="text-sm font-semibold text-white">{profil.favoriteTeam}</p>
            </div>
          </div>

          {/* Top 3 pilotes */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-subtle mb-3">
              Top 3 pilotes
            </h3>
            <div className="space-y-2">
              {profil.topPilotes.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/pilotes/${p.id}`}
                  className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-2.5 hover:border-subtle hover:bg-card-hover transition-colors"
                >
                  <span className="text-xs font-black text-f1-red w-4">{i + 1}</span>
                  <span className="text-sm font-medium text-white">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Derniers GPs notés ── */}
      <section>
        <h2 className="text-base font-bold text-white mb-4">Derniers Grands Prix notés</h2>
        <div className="space-y-2">
          {profil.derniersGPs.map((gp) => (
            <Link
              key={gp.id}
              to={`/gps/${gp.season}/${gp.slug}`}
              className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 hover:border-subtle hover:bg-card-hover transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{gp.name}</p>
                <p className="text-xs text-subtle">{gp.season}</p>
              </div>
              <StarRating value={gp.rating} size="sm" showValue />
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}

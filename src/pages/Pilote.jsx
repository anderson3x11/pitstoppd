import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'

// Données de démo
const PILOTE_DEMO = {
  id: 'norris',
  name: 'Lando Norris',
  number: 4,
  nationality: 'Britannique',
  dateNaissance: '1999-11-13',
  teamActuelle: 'McLaren',
  bio: 'Lando Norris est un pilote de Formule 1 britannique évoluant chez McLaren depuis 2019. Reconnu pour sa vitesse brute et sa personnalité attachante, il a décroché sa première victoire en F1 lors du Grand Prix de Miami 2024.',
  photoUrl: null,
  stats: {
    victoires: 3,
    poles: 5,
    podiums: 23,
    pointsTotal: 1198,
    nbCourses: 120,
    championnat: 2,
  },
  teams: [
    { annee: '2019–2024', team: 'McLaren' },
    { annee: '2018', team: 'McLaren (Test)' },
  ],
  derniersGPs: [
    { id: 1, name: 'GP de Singapour', season: 2024, slug: 'singapour', date: '2024-09-22', position: 1 },
    { id: 2, name: 'GP d\'Abu Dhabi', season: 2024, slug: 'abu-dhabi', date: '2024-12-08', position: 2 },
  ],
}

export default function Pilote() {
  const { id } = useParams()
  const pilote = PILOTE_DEMO // TODO: charger depuis DB

  const age = Math.floor(
    (new Date() - new Date(pilote.dateNaissance)) / (365.25 * 24 * 60 * 60 * 1000)
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* ── En-tête pilote ── */}
      <div className="flex gap-6 mb-10">
        {/* Photo */}
        <div className="hidden sm:flex w-32 h-40 shrink-0 rounded-lg border border-line bg-card-hover items-center justify-center overflow-hidden">
          {pilote.photoUrl ? (
            <img src={pilote.photoUrl} alt={pilote.name} className="w-full h-full object-cover object-top" />
          ) : (
            <span className="text-4xl text-subtle font-black">
              {pilote.name.split(' ').map(n => n[0]).join('')}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Link to="/pilotes" className="hover:text-white transition-colors">Pilotes</Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white">{pilote.name}</h1>
            <span className="text-2xl font-black text-f1-red">#{pilote.number}</span>
          </div>
          <p className="text-sm text-muted">
            {pilote.nationality} · {age} ans · {pilote.teamActuelle}
          </p>
          <p className="text-sm text-muted leading-relaxed max-w-lg">{pilote.bio}</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-white mb-4">Statistiques</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Victoires', value: pilote.stats.victoires },
            { label: 'Poles', value: pilote.stats.poles },
            { label: 'Podiums', value: pilote.stats.podiums },
            { label: 'Points', value: pilote.stats.pointsTotal },
            { label: 'Courses', value: pilote.stats.nbCourses },
            { label: 'Titres', value: pilote.stats.championnat },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-line bg-card px-3 py-3 text-center">
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-subtle mt-0.5 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Équipes ── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-white mb-4">Carrière</h2>
        <div className="space-y-2">
          {pilote.teams.map((t, i) => (
            <div key={i} className="flex items-center gap-4 text-sm">
              <span className="text-subtle font-mono w-20">{t.annee}</span>
              <span className="text-white font-medium">{t.team}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Derniers GPs ── */}
      <section>
        <h2 className="text-base font-bold text-white mb-4">Dernières courses</h2>
        <div className="space-y-2">
          {pilote.derniersGPs.map((gp) => (
            <Link
              key={gp.id}
              to={`/gps/${gp.season}/${gp.slug}`}
              className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 hover:border-subtle hover:bg-card-hover transition-colors"
            >
              <span className="text-sm font-medium text-white">{gp.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-subtle">{gp.season}</span>
                <span className={`text-sm font-bold ${gp.position === 1 ? 'text-f1-red' : 'text-muted'}`}>
                  P{gp.position}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}

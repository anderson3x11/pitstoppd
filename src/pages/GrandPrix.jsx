import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'

// Données de démo — seront remplacées par l'API Phase 3/4
const GP_DEMO = {
  name: 'Grand Prix de Singapour',
  season: 2024,
  date: '2024-09-22',
  circuit: 'Marina Bay Street Circuit',
  country: 'Singapour',
  posterUrl: null,
  avgRating: 4.8,
  reviewCount: 1024,
  classement: [
    { position: 1, driver: 'Lando Norris', team: 'McLaren', id: 'norris' },
    { position: 2, driver: 'Max Verstappen', team: 'Red Bull Racing', id: 'verstappen' },
    { position: 3, driver: 'Oscar Piastri', team: 'McLaren', id: 'piastri' },
    { position: 4, driver: 'Carlos Sainz', team: 'Ferrari', id: 'sainz' },
    { position: 5, driver: 'Charles Leclerc', team: 'Ferrari', id: 'leclerc' },
  ],
  qualifs: [
    { position: 1, driver: 'Lando Norris', team: 'McLaren', id: 'norris', time: '1:29.525' },
    { position: 2, driver: 'Max Verstappen', team: 'Red Bull Racing', id: 'verstappen', time: '+0.121' },
    { position: 3, driver: 'Oscar Piastri', team: 'McLaren', id: 'piastri', time: '+0.543' },
  ],
  pilotes: [
    { id: 'norris', name: 'Lando Norris', team: 'McLaren' },
    { id: 'verstappen', name: 'Max Verstappen', team: 'Red Bull Racing' },
    { id: 'piastri', name: 'Oscar Piastri', team: 'McLaren' },
    { id: 'sainz', name: 'Carlos Sainz', team: 'Ferrari' },
    { id: 'leclerc', name: 'Charles Leclerc', team: 'Ferrari' },
  ],
}

const REVIEWS_DEMO = [
  { id: 1, author: 'maxfan44', rating: 5.0, content: 'Course incroyable, Norris a parfaitement géré la pression. Le circuit de Marina Bay offre toujours du spectacle.', spoiler: false, likes: 87, createdAt: '2024-09-23' },
  { id: 2, author: 'scuderiafan', rating: 4.0, content: 'Bonne course dans l\'ensemble mais Ferrari a encore raté la stratégie...', spoiler: true, likes: 42, createdAt: '2024-09-23' },
]

const isLoggedIn = false

function ReviewCard({ review }) {
  const [spoilerVisible, setSpoilerVisible] = useState(false)

  const formattedDate = new Date(review.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="rounded-lg border border-line bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to={`/${review.author}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors">
            {review.author}
          </Link>
          <span className="text-subtle text-xs">·</span>
          <span className="text-xs text-subtle">{formattedDate}</span>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>

      {review.spoiler && !spoilerVisible ? (
        <div className="rounded bg-card-hover border border-line px-4 py-3 text-center">
          <p className="text-xs text-subtle mb-2">Cette critique contient des spoilers</p>
          <button
            onClick={() => setSpoilerVisible(true)}
            className="text-xs font-medium text-muted hover:text-white transition-colors"
          >
            Afficher quand même
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted leading-relaxed">{review.content}</p>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button className="flex items-center gap-1.5 text-xs text-subtle hover:text-white transition-colors">
          <span>♡</span>
          <span>{review.likes}</span>
        </button>
        {review.spoiler && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-card-hover border border-line text-subtle uppercase tracking-wide">
            Spoiler
          </span>
        )}
      </div>
    </div>
  )
}

export default function GrandPrix() {
  const { saison, slug } = useParams()
  const [classementVisible, setClassementVisible] = useState(false)
  const [qualifsVisible, setQualifsVisible] = useState(false)

  const gp = GP_DEMO // TODO: charger depuis l'API

  const formattedDate = new Date(gp.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* ── En-tête ── */}
      <div className="flex gap-6 mb-10">
        {/* Poster */}
        <div className="hidden sm:block w-36 shrink-0 rounded-lg overflow-hidden border border-line aspect-[2/3] bg-card-hover">
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-3xl">🏁</span>
          </div>
        </div>

        {/* Infos principales */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link to="/gps" className="hover:text-white transition-colors">GPs</Link>
            <span>/</span>
            <Link to={`/saisons/${saison}`} className="hover:text-white transition-colors">{saison}</Link>
          </div>
          <h1 className="text-3xl font-black text-white">{gp.name}</h1>
          <p className="text-sm text-muted capitalize">{formattedDate}</p>
          <p className="text-sm text-muted">{gp.circuit} · {gp.country}</p>

          {/* Note globale */}
          <div className="flex items-center gap-3 pt-2">
            <StarRating value={gp.avgRating} size="lg" showValue />
            <span className="text-sm text-subtle">{gp.reviewCount} critiques</span>
          </div>

          {/* Action noter */}
          {isLoggedIn ? (
            <div className="pt-2">
              <p className="text-xs text-subtle mb-1">Votre note :</p>
              <StarRating value={0} size="lg" />
            </div>
          ) : (
            <div className="pt-2">
              <Link to="/login" className="text-sm text-muted hover:text-white transition-colors">
                Connectez-vous pour noter ce GP
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Pilotes ayant participé ── */}
      <section className="mb-8">
        <h2 className="text-base font-bold mb-3 text-white">Pilotes</h2>
        <div className="flex flex-wrap gap-2">
          {gp.pilotes.map((p) => (
            <Link
              key={p.id}
              to={`/pilotes/${p.id}`}
              className="rounded border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-white hover:border-subtle transition-colors"
            >
              {p.name}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Classement (spoiler) ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Classement</h2>
          <button
            onClick={() => setClassementVisible(!classementVisible)}
            className="text-xs font-medium text-muted hover:text-white transition-colors border border-line rounded px-2.5 py-1"
          >
            {classementVisible ? 'Masquer' : '🔒 Afficher les résultats'}
          </button>
        </div>
        {classementVisible ? (
          <div className="rounded-lg border border-line overflow-hidden">
            {gp.classement.map((r) => (
              <div
                key={r.position}
                className="flex items-center gap-4 px-4 py-2.5 border-b border-line last:border-0 hover:bg-card-hover transition-colors"
              >
                <span className="w-5 text-sm font-bold text-muted tabular-nums text-right">{r.position}</span>
                <Link to={`/pilotes/${r.id}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors flex-1">
                  {r.driver}
                </Link>
                <span className="text-xs text-subtle">{r.team}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-card px-4 py-6 text-center text-sm text-subtle">
            Les résultats sont masqués. Cliquez pour les afficher.
          </div>
        )}
      </section>

      {/* ── Qualifications (spoiler) ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Qualifications</h2>
          <button
            onClick={() => setQualifsVisible(!qualifsVisible)}
            className="text-xs font-medium text-muted hover:text-white transition-colors border border-line rounded px-2.5 py-1"
          >
            {qualifsVisible ? 'Masquer' : '🔒 Afficher les résultats'}
          </button>
        </div>
        {qualifsVisible ? (
          <div className="rounded-lg border border-line overflow-hidden">
            {gp.qualifs.map((q) => (
              <div
                key={q.position}
                className="flex items-center gap-4 px-4 py-2.5 border-b border-line last:border-0 hover:bg-card-hover transition-colors"
              >
                <span className="w-5 text-sm font-bold text-muted tabular-nums text-right">{q.position}</span>
                <Link to={`/pilotes/${q.id}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors flex-1">
                  {q.driver}
                </Link>
                <span className="text-xs text-subtle">{q.team}</span>
                <span className="text-xs text-muted font-mono">{q.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-card px-4 py-6 text-center text-sm text-subtle">
            Les qualifications sont masquées. Cliquez pour les afficher.
          </div>
        )}
      </section>

      {/* ── Critiques ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            Critiques <span className="text-subtle font-normal text-sm">({gp.reviewCount})</span>
          </h2>
          {isLoggedIn && (
            <button className="rounded bg-f1-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors">
              Écrire une critique
            </button>
          )}
        </div>

        {!isLoggedIn && (
          <div className="mb-6 rounded-lg border border-line bg-card p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">Connectez-vous pour écrire une critique.</p>
            <Link to="/login" className="text-sm font-medium text-f1-red hover:text-f1-red-hover transition-colors shrink-0">
              Se connecter
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {REVIEWS_DEMO.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </section>

    </div>
  )
}

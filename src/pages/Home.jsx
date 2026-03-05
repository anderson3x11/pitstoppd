import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const TODAY = new Date().toISOString().split('T')[0]

export default function Home() {
  const { user } = useAuth()
  const [gps, setGps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('races')
      .select('id, season, round, name, slug, circuit, country, date, poster_url')
      .lt('date', TODAY)
      .order('date', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        setGps(data ?? [])
        setLoading(false)
      })
  }, [])

  const gpCards = gps.map((gp) => ({
    ...gp,
    posterUrl: gp.poster_url,
    avgRating: null,
    reviewCount: null,
  }))

  const latestGP = gpCards[0] ?? null

  return (
    <div>
      {/* ── Hero : dernier GP en vedette ── */}
      <section className="relative border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-card-hover/60 to-page" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 flex items-end gap-8">
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
            {loading ? (
              <p className="text-muted text-sm">Chargement…</p>
            ) : latestGP ? (
              <>
                <h1 className="text-3xl font-black text-white leading-tight">
                  {latestGP.name}
                </h1>
                <p className="text-sm text-muted">
                  {latestGP.season} · {latestGP.circuit}
                </p>
                <div className="pt-2">
                  <Link
                    to={`/gps/${latestGP.season}/${latestGP.slug}`}
                    className="inline-flex items-center gap-1.5 rounded bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors"
                  >
                    Voir le Grand Prix →
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-muted text-sm">Aucun Grand Prix disponible.</p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 space-y-14">
        {/* ── Critiques de vos amis ── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Critiques de vos amis</h2>
          {user ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <p className="text-muted text-sm col-span-full">
                Aucune critique récente.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-card p-8 text-center space-y-3">
              <p className="text-white font-semibold">Rejoignez la communauté</p>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Connectez-vous pour voir les notes et critiques des utilisateurs
                que vous suivez.
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
            <Link to="/gps" className="text-sm text-muted hover:text-white transition-colors">
              Voir tout →
            </Link>
          </div>
          {loading ? (
            <p className="text-muted text-sm">Chargement…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {gpCards.map((gp) => (
                <GPCard key={gp.id} gp={gp} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

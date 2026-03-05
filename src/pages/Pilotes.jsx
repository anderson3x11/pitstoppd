import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function PiloteCard({ pilote, wins }) {
  const initiales = [pilote.given_name, pilote.family_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')

  return (
    <Link to={`/pilotes/${pilote.id}`} className="group block">
      <div className="rounded-lg overflow-hidden bg-card border border-line transition-colors duration-150 hover:border-subtle">

        {/* Visuel */}
        <div className="aspect-[2/3] bg-card-hover relative overflow-hidden">
          {pilote.photo_url ? (
            <img
              src={pilote.photo_url}
              alt={`${pilote.given_name} ${pilote.family_name}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card p-3">
              {pilote.number != null && (
                <span className="text-3xl font-black text-subtle leading-none">
                  {pilote.number}
                </span>
              )}
              <span className="text-lg font-bold text-subtle">{initiales}</span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-2.5 space-y-0.5">
          <p className="text-xs font-semibold text-white leading-snug line-clamp-2">
            {pilote.given_name} {pilote.family_name}
          </p>
          <p className="text-[11px] text-subtle">{pilote.nationality}</p>
          <p className="text-[11px] text-muted">
            {wins} victoire{wins > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function Pilotes() {
  const [drivers, setDrivers] = useState([])
  const [currentIds, setCurrentIds] = useState(new Set())
  const [winsMap, setWinsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const [
        { data: driversData },
        { data: currentData },
        { data: winsData },
      ] = await Promise.all([
        supabase
          .from('drivers')
          .select('id, given_name, family_name, nationality, photo_url, number'),

        // Pilotes ayant participé à la saison 2025 (la dernière avec résultats)
        supabase
          .from('race_drivers')
          .select('driver_id, races!inner(season)')
          .eq('races.season', 2025),

        // Toutes les victoires
        supabase
          .from('race_drivers')
          .select('driver_id')
          .eq('position', 1),
      ])

      const ids = new Set(currentData?.map((r) => r.driver_id) ?? [])
      setCurrentIds(ids)

      const wins = {}
      for (const row of winsData ?? []) {
        wins[row.driver_id] = (wins[row.driver_id] ?? 0) + 1
      }
      setWinsMap(wins)

      setDrivers(driversData ?? [])
      setLoading(false)
    }

    load()
  }, [])

  const query = search.toLowerCase().trim()

  const filtered = useMemo(
    () =>
      drivers.filter((d) => {
        if (!query) return true
        const full = `${d.given_name} ${d.family_name}`.toLowerCase()
        return full.includes(query) || d.nationality?.toLowerCase().includes(query)
      }),
    [drivers, query],
  )

  const current = useMemo(
    () =>
      filtered
        .filter((d) => currentIds.has(d.id))
        .sort((a, b) => (a.number ?? 999) - (b.number ?? 999)),
    [filtered, currentIds],
  )

  const retired = useMemo(
    () =>
      filtered
        .filter((d) => !currentIds.has(d.id))
        .sort((a, b) => (winsMap[b.id] ?? 0) - (winsMap[a.id] ?? 0)),
    [filtered, winsMap, currentIds],
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* En-tête + recherche */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">Pilotes</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? 'Chargement…' : `${drivers.length} pilotes · saisons 2020–2025`}
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un pilote…"
          className="w-full sm:w-64 rounded bg-card border border-line px-3 py-2 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-subtle"
        />
      </div>

      {loading ? (
        <p className="text-muted text-sm">Chargement…</p>
      ) : (
        <div className="space-y-10">

          {/* Grille 2025 */}
          {current.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                Grille 2025
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {current.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} />
                ))}
              </div>
            </section>
          )}

          {/* Pilotes retirés */}
          {retired.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                Anciens pilotes
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {retired.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <p className="text-center py-20 text-muted text-sm">
              Aucun pilote trouvé pour « {search} ».
            </p>
          )}

        </div>
      )}
    </div>
  )
}

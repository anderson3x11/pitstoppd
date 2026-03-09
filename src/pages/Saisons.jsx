import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TODAY = new Date().toISOString().split('T')[0]

const SEASONS = [2025, 2024, 2023, 2022, 2021, 2020]

const CHAMPIONS = {
  2025: { driver: 'Lando Norris', team: 'McLaren' },
  2024: { driver: 'Max Verstappen', team: 'Red Bull Racing' },
  2023: { driver: 'Max Verstappen', team: 'Red Bull Racing' },
  2022: { driver: 'Max Verstappen', team: 'Red Bull Racing' },
  2021: { driver: 'Max Verstappen', team: 'Red Bull Racing' },
  2020: { driver: 'Lewis Hamilton', team: 'Mercedes' },
}

export default function Saisons() {
  const [raceCounts, setRaceCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('races')
      .select('season')
      .lt('date', TODAY)
      .then(({ data }) => {
        const counts = {}
        for (const row of data ?? []) {
          counts[row.season] = (counts[row.season] ?? 0) + 1
        }
        setRaceCounts(counts)
        setLoading(false)
      })
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Seasons</h1>
        <p className="text-sm text-muted mt-1">F1 from 2020 to present</p>
      </div>

      <div className="space-y-3">
        {SEASONS.map((annee) => {
          const champion = CHAMPIONS[annee]
          const nbCourses = raceCounts[annee] ?? 0

          return (
            <Link
              key={annee}
              to={`/saisons/${annee}`}
              className="flex items-center justify-between rounded-lg border border-line bg-card px-5 py-4 hover:border-subtle hover:bg-card-hover transition-colors group"
            >
              <div className="flex items-center gap-5">
                <span className="text-2xl font-black text-white group-hover:text-f1-red transition-colors">
                  {annee}
                </span>
                <div>
                  {champion ? (
                    <>
                      <p className="text-sm font-semibold text-white">{champion.driver}</p>
                      <p className="text-xs text-muted">{champion.team}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted italic">In progress</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-subtle">
                  {loading ? '…' : nbCourses > 0 ? `${nbCourses} races` : 'No races'}
                </span>
                <span className="text-muted">→</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

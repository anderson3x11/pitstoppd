import { Link } from 'react-router-dom'

const SAISONS = [
  { annee: 2024, champion: 'Max Verstappen', ecurie: 'Red Bull Racing', nbCourses: 24 },
  { annee: 2023, champion: 'Max Verstappen', ecurie: 'Red Bull Racing', nbCourses: 22 },
  { annee: 2022, champion: 'Max Verstappen', ecurie: 'Red Bull Racing', nbCourses: 22 },
  { annee: 2021, champion: 'Max Verstappen', ecurie: 'Red Bull Racing', nbCourses: 22 },
  { annee: 2020, champion: 'Lewis Hamilton', ecurie: 'Mercedes', nbCourses: 17 },
]

export default function Saisons() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Saisons</h1>
        <p className="text-sm text-muted mt-1">F1 de 2020 à aujourd&apos;hui</p>
      </div>

      <div className="space-y-3">
        {SAISONS.map((s) => (
          <Link
            key={s.annee}
            to={`/saisons/${s.annee}`}
            className="flex items-center justify-between rounded-lg border border-line bg-card px-5 py-4 hover:border-subtle hover:bg-card-hover transition-colors group"
          >
            <div className="flex items-center gap-5">
              <span className="text-2xl font-black text-white group-hover:text-f1-red transition-colors">
                {s.annee}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{s.champion}</p>
                <p className="text-xs text-muted">{s.ecurie}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-subtle">{s.nbCourses} courses</span>
              <span className="text-muted">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

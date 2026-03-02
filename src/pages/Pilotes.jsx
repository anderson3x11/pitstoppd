import { Link } from 'react-router-dom'

const PILOTES_DEMO = [
  { id: 'verstappen', name: 'Max Verstappen', number: 1, team: 'Red Bull Racing', nationality: 'Néerlandais', photoUrl: null },
  { id: 'norris', name: 'Lando Norris', number: 4, team: 'McLaren', nationality: 'Britannique', photoUrl: null },
  { id: 'leclerc', name: 'Charles Leclerc', number: 16, team: 'Ferrari', nationality: 'Monégasque', photoUrl: null },
  { id: 'piastri', name: 'Oscar Piastri', number: 81, team: 'McLaren', nationality: 'Australien', photoUrl: null },
  { id: 'sainz', name: 'Carlos Sainz', number: 55, team: 'Ferrari', nationality: 'Espagnol', photoUrl: null },
  { id: 'hamilton', name: 'Lewis Hamilton', number: 44, team: 'Ferrari', nationality: 'Britannique', photoUrl: null },
  { id: 'russell', name: 'George Russell', number: 63, team: 'Mercedes', nationality: 'Britannique', photoUrl: null },
  { id: 'alonso', name: 'Fernando Alonso', number: 14, team: 'Aston Martin', nationality: 'Espagnol', photoUrl: null },
]

function PiloteCard({ pilote }) {
  return (
    <Link
      to={`/pilotes/${pilote.id}`}
      className="group flex items-center gap-4 rounded-lg border border-line bg-card px-4 py-3 hover:border-subtle hover:bg-card-hover transition-colors"
    >
      {/* Photo / Avatar */}
      <div className="w-10 h-10 rounded-full bg-card-hover border border-line flex items-center justify-center shrink-0 overflow-hidden">
        {pilote.photoUrl ? (
          <img src={pilote.photoUrl} alt={pilote.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-subtle text-xs font-bold">
            {pilote.name.split(' ').map(n => n[0]).join('')}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-subtle w-5">#{pilote.number}</span>
          <p className="text-sm font-semibold text-white group-hover:text-f1-red transition-colors truncate">
            {pilote.name}
          </p>
        </div>
        <p className="text-xs text-muted truncate">{pilote.team}</p>
      </div>

      <span className="text-xs text-subtle shrink-0">{pilote.nationality}</span>
    </Link>
  )
}

export default function Pilotes() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Pilotes</h1>
        <p className="text-sm text-muted mt-1">Grille 2025 et saisons précédentes</p>
      </div>

      <div className="space-y-2">
        {PILOTES_DEMO.map((p) => (
          <PiloteCard key={p.id} pilote={p} />
        ))}
      </div>
    </div>
  )
}

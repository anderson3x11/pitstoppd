import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function PiloteCard({ pilote }) {
  const initiales = [pilote.given_name, pilote.family_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')

  return (
    <Link
      to={`/pilotes/${pilote.id}`}
      className="group flex items-center gap-4 rounded-lg border border-line bg-card px-4 py-3 hover:border-subtle hover:bg-card-hover transition-colors"
    >
      {/* Photo / Avatar */}
      <div className="w-10 h-10 rounded-full bg-card-hover border border-line flex items-center justify-center shrink-0 overflow-hidden">
        {pilote.photo_url ? (
          <img
            src={pilote.photo_url}
            alt={`${pilote.given_name} ${pilote.family_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-subtle text-xs font-bold">{initiales}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-f1-red transition-colors truncate">
          {pilote.given_name} {pilote.family_name}
        </p>
        <p className="text-xs text-muted truncate">{pilote.nationality}</p>
      </div>
    </Link>
  )
}

export default function Pilotes() {
  const [pilotes, setPilotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('drivers')
      .select('id, given_name, family_name, nationality, photo_url')
      .order('family_name', { ascending: true })
      .then(({ data }) => {
        setPilotes(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Pilotes</h1>
        <p className="text-sm text-muted mt-1">
          {loading ? 'Chargement…' : `${pilotes.length} pilotes · saisons 2020–2025`}
        </p>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Chargement…</p>
      ) : (
        <div className="space-y-2">
          {pilotes.map((p) => (
            <PiloteCard key={p.id} pilote={p} />
          ))}
        </div>
      )}
    </div>
  )
}

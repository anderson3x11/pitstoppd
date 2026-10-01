import { Link } from 'react-router-dom'
import { Skeleton } from './Skeleton'

// Chargement générique d'une page : titre + bloc de contenu, à la place d'un "Loading…" nu
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-64 mb-3" />
      <Skeleton className="h-4 w-40 mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[2/3]" />)}
      </div>
    </div>
  )
}

// Page introuvable, liste vide ou erreur : un titre, une explication, une sortie
export function EmptyState({ title, children, action, to = '/', page = false }) {
  const body = (
    <div className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="font-semibold text-white">{title}</p>
      {children && <p className="mt-1.5 text-sm text-muted max-w-sm mx-auto">{children}</p>}
      {action && <Link to={to} className="btn btn-secondary btn-sm mt-5">{action}</Link>}
    </div>
  )
  return page ? <div className="mx-auto max-w-2xl px-4 py-16">{body}</div> : body
}

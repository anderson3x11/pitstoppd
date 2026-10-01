import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-line mt-20">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Link to="/" className="font-display text-xl font-bold tracking-[-0.03em] text-f1-red">
            pitstoppd
          </Link>
          <p className="text-sm text-subtle max-w-sm">
            Rate, review and log every Formula 1 Grand Prix since 2000.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <Link to="/gps" className="hover:text-white transition-colors">Grands Prix</Link>
          <Link to="/pilotes" className="hover:text-white transition-colors">Drivers</Link>
          <Link to="/saisons" className="hover:text-white transition-colors">Seasons</Link>
        </nav>
        <p className="text-xs text-subtle sm:col-span-2 border-t border-line pt-6">
          Race data from the{' '}
          <a href="https://api.jolpi.ca" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-line-strong hover:text-muted transition-colors">Jolpica-F1 API</a>
          , posters from{' '}
          <a href="https://www.thesportsdb.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-line-strong hover:text-muted transition-colors">TheSportsDB</a>
          . Not affiliated with Formula 1.
        </p>
      </div>
    </footer>
  )
}

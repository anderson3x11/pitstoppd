import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="text-sm font-black tracking-widest text-f1-red uppercase">
          PITSTOPPD
        </Link>
        <p className="text-xs text-subtle text-center">
          F1 data via{' '}
          <a
            href="https://api.jolpi.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted transition-colors"
          >
            Jolpica-F1 API
          </a>
          {' '}· 2026
        </p>
        <nav className="flex gap-4 text-xs text-subtle">
          <Link to="/gps" className="hover:text-muted transition-colors">GPs</Link>
          <Link to="/pilotes" className="hover:text-muted transition-colors">Drivers</Link>
          <Link to="/saisons" className="hover:text-muted transition-colors">Seasons</Link>
        </nav>
      </div>
    </footer>
  )
}

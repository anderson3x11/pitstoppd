import { Link, NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors duration-150 ${
    isActive ? 'text-white' : 'text-muted hover:text-white'
  }`

// TODO Phase 5 : remplacer isLoggedIn par le vrai contexte auth
const isLoggedIn = false
const currentUser = null

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-card/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center px-4">

        {/* Logo — occupe 1/3 gauche */}
        <div className="flex-1">
          <Link
            to="/"
            className="text-lg font-black tracking-widest text-f1-red uppercase select-none"
          >
            PITSTOPPD
          </Link>
        </div>

        {/* Liens de navigation — centrés */}
        <div className="flex items-center gap-6">
          <NavLink to="/gps" className={navLinkClass}>GPs</NavLink>
          <NavLink to="/pilotes" className={navLinkClass}>Pilotes</NavLink>
          <NavLink to="/saisons" className={navLinkClass}>Saisons</NavLink>
        </div>

        {/* Auth — occupe 1/3 droit */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {isLoggedIn && currentUser ? (
            <Link
              to={`/${currentUser.username}`}
              className="flex items-center gap-2 text-sm font-medium text-muted hover:text-white transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-card-hover border border-line overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-subtle">
                    {currentUser.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span>{currentUser.username}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted hover:text-white transition-colors duration-150"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="rounded bg-f1-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors duration-150"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>

      </nav>
    </header>
  )
}

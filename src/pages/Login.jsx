import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // TODO Phase 5 : appel Supabase auth.signInWithPassword
    setTimeout(() => {
      setLoading(false)
      setError('Connexion Supabase non encore implémentée.')
    }, 500)
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="text-xl font-black tracking-widest text-f1-red uppercase">
            PITSTOPPD
          </Link>
          <p className="mt-2 text-sm text-muted">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-medium text-muted">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="vous@example.com"
              className="w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-f1-red transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-medium text-muted">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-f1-red transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-f1-red py-2.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-white hover:text-f1-red transition-colors">
            S&apos;inscrire
          </Link>
        </p>

      </div>
    </div>
  )
}

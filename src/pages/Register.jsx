import { useState } from 'react'
import { Link } from 'react-router-dom'

// Regex username : 3-20 caractères, minuscules, chiffres, tiret, underscore
const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    passwordConfirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email) newErrors.email = 'L\'e-mail est requis.'
    if (!USERNAME_REGEX.test(form.username))
      newErrors.username = '3 à 20 caractères : lettres minuscules, chiffres, - ou _'
    if (!form.displayName.trim()) newErrors.displayName = 'Le nom d\'affichage est requis.'
    if (form.password.length < 8) newErrors.password = '8 caractères minimum.'
    if (form.password !== form.passwordConfirm)
      newErrors.passwordConfirm = 'Les mots de passe ne correspondent pas.'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    // TODO Phase 5 : appel Supabase auth.signUp + création profil
    setTimeout(() => {
      setLoading(false)
      setErrors({ global: 'Inscription Supabase non encore implémentée.' })
    }, 500)
  }

  const inputClass = (field) =>
    `w-full rounded-lg border ${
      errors[field] ? 'border-red-700' : 'border-line'
    } bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-f1-red transition-colors`

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <Link to="/" className="text-xl font-black tracking-widest text-f1-red uppercase">
            PITSTOPPD
          </Link>
          <p className="mt-2 text-sm text-muted">Créez votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.global && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
              <p className="text-sm text-red-400">{errors.global}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-medium text-muted">
              Adresse e-mail
            </label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={form.email} onChange={handleChange}
              placeholder="vous@example.com"
              className={inputClass('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="username" className="block text-xs font-medium text-muted">
              Nom d&apos;utilisateur
              <span className="ml-1 text-subtle font-normal">(unique, utilisé dans l&apos;URL)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-sm">@</span>
              <input
                id="username" name="username" type="text" autoComplete="username" required
                value={form.username} onChange={handleChange}
                placeholder="max_verstappen"
                className={`${inputClass('username')} pl-7`}
              />
            </div>
            {errors.username && <p className="text-xs text-red-400">{errors.username}</p>}
          </div>

          {/* Nom d'affichage */}
          <div className="space-y-1">
            <label htmlFor="displayName" className="block text-xs font-medium text-muted">
              Nom d&apos;affichage
              <span className="ml-1 text-subtle font-normal">(non unique)</span>
            </label>
            <input
              id="displayName" name="displayName" type="text" required
              value={form.displayName} onChange={handleChange}
              placeholder="Max"
              className={inputClass('displayName')}
            />
            {errors.displayName && <p className="text-xs text-red-400">{errors.displayName}</p>}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-medium text-muted">
              Mot de passe
            </label>
            <input
              id="password" name="password" type="password" autoComplete="new-password" required
              value={form.password} onChange={handleChange}
              placeholder="8 caractères minimum"
              className={inputClass('password')}
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Confirmation */}
          <div className="space-y-1">
            <label htmlFor="passwordConfirm" className="block text-xs font-medium text-muted">
              Confirmer le mot de passe
            </label>
            <input
              id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required
              value={form.passwordConfirm} onChange={handleChange}
              placeholder="••••••••"
              className={inputClass('passwordConfirm')}
            />
            {errors.passwordConfirm && <p className="text-xs text-red-400">{errors.passwordConfirm}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-f1-red py-2.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Création du compte…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-f1-red transition-colors">
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  )
}

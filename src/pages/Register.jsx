import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

// Username regex: 3-20 chars, lowercase, digits, hyphen, underscore
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
  const navigate = useNavigate()
  const { setProfile } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email) newErrors.email = "Email is required."
    if (!USERNAME_REGEX.test(form.username))
      newErrors.username = '3 to 20 characters: lowercase letters, digits, - or _'
    if (!form.displayName.trim()) newErrors.displayName = "Display name is required."
    if (form.password.length < 8) newErrors.password = '8 characters minimum.'
    if (form.password !== form.passwordConfirm)
      newErrors.passwordConfirm = 'Passwords do not match.'
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
    setErrors({})

    try {
      setProfile(await api('/auth/register', {
        method: 'POST',
        body: { email: form.email, username: form.username, display_name: form.displayName, password: form.password },
      }))
      navigate('/')
    } catch (err) {
      setErrors({ [err.field ?? 'global']: err.message })
      setLoading(false)
    }
  }

  // aria-invalid colore le champ en rouge (classe .field) et l'annonce aux lecteurs d'écran
  const fieldProps = (field) => ({
    className: 'field',
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  })

  return (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">

        <div>
          <Link to="/" className="font-display text-xl font-bold tracking-[-0.03em] text-f1-red">
            pitstoppd
          </Link>
          <h1 className="page-title mt-4">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.global && (
            <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errors.global}</p>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-muted">
              Email address
            </label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              {...fieldProps('email')}
            />
            {errors.email && <p id="email-error" className="text-sm text-red-400">{errors.email}</p>}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-medium text-muted">
              Username
              <span className="ml-1 text-subtle font-normal">· your profile address</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-sm">@</span>
              <input
                id="username" name="username" type="text" autoComplete="username" required
                value={form.username} onChange={handleChange}
                placeholder="max_verstappen"
                {...fieldProps('username')} className="field pl-7"
              />
            </div>
            {errors.username && <p id="username-error" className="text-sm text-red-400">{errors.username}</p>}
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="block text-sm font-medium text-muted">
              Display name
              <span className="ml-1 text-subtle font-normal">· shown on your reviews</span>
            </label>
            <input
              id="displayName" name="displayName" type="text" required
              value={form.displayName} onChange={handleChange}
              placeholder="Max"
              {...fieldProps('displayName')}
            />
            {errors.displayName && <p id="displayName-error" className="text-sm text-red-400">{errors.displayName}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-muted">
              Password
            </label>
            <input
              id="password" name="password" type="password" autoComplete="new-password" required
              value={form.password} onChange={handleChange}
              placeholder="8 characters minimum"
              {...fieldProps('password')}
            />
            {errors.password && <p id="password-error" className="text-sm text-red-400">{errors.password}</p>}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-muted">
              Confirm password
            </label>
            <input
              id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required
              value={form.passwordConfirm} onChange={handleChange}
                            {...fieldProps('passwordConfirm')}
            />
            {errors.passwordConfirm && <p id="passwordConfirm-error" className="text-sm text-red-400">{errors.passwordConfirm}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2.5"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-f1-red transition-colors">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/Icon'
import { PageSkeleton, EmptyState } from '../components/PageState'

const F1_TEAMS = [
  'Alpine',
  'Aston Martin',
  'Audi',
  'Cadillac',
  'Ferrari',
  'Haas',
  'McLaren',
  'Mercedes',
  'Racing Bulls',
  'Red Bull Racing',
  'Williams',
]

const inputClass = 'field'
const selectClass = 'field appearance-none cursor-pointer pr-9'
const labelClass = 'block text-sm font-medium text-muted mb-1.5'
const sectionTitle = 'font-display text-xl font-bold uppercase tracking-wide text-white border-b border-line pb-2'

function Notice({ kind, children }) {
  const tone = kind === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm ${tone}`}>{children}</p>
}

function DriverSearchInput({ id, value, onChange, exclude, drivers }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = drivers.find((d) => d.id === value) ?? null

  const filtered = drivers
    .filter((d) => !exclude.includes(d.id))
    .filter((d) => {
      if (!query) return true
      return `${d.given_name} ${d.family_name}`.toLowerCase().includes(query.toLowerCase())
    })
    .slice(0, 8)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-line-strong bg-card px-3 py-2.5">
        <span id={id} className="text-sm text-white flex-1">{selected.given_name} {selected.family_name}</span>
        <button
          type="button"
          onClick={() => { onChange(''); setQuery('') }}
          aria-label={`Remove ${selected.family_name}`}
          className="text-subtle hover:text-white transition-colors cursor-pointer"
        >
          <Icon name="x" className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search a driver…"
        className={inputClass}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-md border border-line-strong bg-card p-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)]">
          {filtered.map((d) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(d.id); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 rounded text-sm text-muted hover:bg-card-hover hover:text-white transition-colors cursor-pointer"
            >
              {d.given_name} {d.family_name}
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2.5">
          <p className="text-sm text-subtle">No driver named “{query}”</p>
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Profile form
  const [form, setForm] = useState({ displayName: '', bio: '', favoriteTeam: '', pilot1: '', pilot2: '', pilot3: '' })
  const [drivers, setDrivers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  // Password form
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Delete account
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    api('/drivers')
      .then(({ drivers: list }) => setDrivers(list.sort((a, b) => a.family_name.localeCompare(b.family_name))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.display_name ?? '',
        bio: profile.bio ?? '',
        favoriteTeam: profile.favorite_team ?? '',
        pilot1: profile.top_pilots?.[0] ?? '',
        pilot2: profile.top_pilots?.[1] ?? '',
        pilot3: profile.top_pilots?.[2] ?? '',
      })
    }
  }, [profile])

  if (authLoading) return <PageSkeleton />

  if (!user) return <EmptyState page title="Sign in to edit your profile" action="Sign in" to="/login">Settings are only available to signed-in members.</EmptyState>

  // ── Profile form handlers ──

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.')
      return
    }
    setError(null)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      if (avatarFile) {
        const body = new FormData()
        body.append('file', avatarFile)
        await api('/me/avatar', { method: 'POST', body })
      }
      await api('/me', {
        method: 'PATCH',
        body: {
          display_name: form.displayName,
          bio: form.bio,
          favorite_team: form.favoriteTeam,
          top_pilots: [form.pilot1, form.pilot2, form.pilot3].filter(Boolean),
        },
      })
      setSuccess(true)
      setAvatarFile(null)
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  // ── Password handler ──

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (pwForm.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Passwords don't match.")
      return
    }

    setPwSaving(true)
    try {
      await api('/me/password', { method: 'PUT', body: { password: pwForm.newPassword } })
      setPwSuccess(true)
      setPwForm({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err.message)
    }
    setPwSaving(false)
  }

  // ── Delete account handler ──

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      await api('/me', { method: 'DELETE' })
      await refreshProfile()
      navigate('/')
    } catch {
      setDeleteError('An error occurred. Please try again.')
      setDeleteLoading(false)
    }
  }

  // ── Exclude already-selected pilots ──
  const excludeFor = (key) =>
    ['pilot1', 'pilot2', 'pilot3'].filter((k) => k !== key).map((k) => form[k]).filter(Boolean)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-14">
      <h1 className="page-title">Settings</h1>

      {/* ── Section: Profile ── */}
      <form onSubmit={handleSubmit} className="space-y-8">

        {error && <Notice kind="error">{error}</Notice>}
        {success && <Notice>Profile saved.</Notice>}

        <section className="space-y-4">
          <h2 className={sectionTitle}>Profile</h2>

          <div>
            <p className={labelClass}>Profile picture</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 rounded-full bg-raised ring-1 ring-line-strong flex items-center justify-center overflow-hidden">
                {avatarPreview || profile?.avatar_url ? (
                  <img src={avatarPreview || profile?.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-subtle">
                    {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
              >
                Change photo
              </button>
              <span className="text-xs text-subtle">PNG, JPEG, WebP or GIF, 2 MB max</span>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="displayName" className={labelClass}>Display name</label>
            <input id="displayName" name="displayName" type="text" required maxLength={50} value={form.displayName} onChange={handleChange} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label htmlFor="bio" className={labelClass}>Bio</label>
            <textarea
              id="bio"
              maxLength={500}
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="A few words about you…"
              className={`${inputClass} resize-none`}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={sectionTitle}>Favorites</h2>

          <div className="space-y-1">
            <label htmlFor="favoriteTeam" className={labelClass}>Favorite team</label>
            <div className="relative">
              <select id="favoriteTeam" name="favoriteTeam" value={form.favoriteTeam} onChange={handleChange} className={selectClass}>
                <option value="">No favorite team</option>
                {F1_TEAMS.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
            </div>
          </div>

          <div>
            <p className={labelClass}>Top 3 drivers</p>
            <div className="space-y-2">
              {(['pilot1', 'pilot2', 'pilot3']).map((key, i) => (
                <div key={key} className="flex items-center gap-3">
                  <label htmlFor={`driver-${key}`} className="font-display text-lg font-bold text-f1-red w-4">{i + 1}<span className="sr-only">. favorite driver</span></label>
                  <div className="flex-1">
                    <DriverSearchInput
                      id={`driver-${key}`}
                      value={form[key]}
                      onChange={(val) => { setForm((prev) => ({ ...prev, [key]: val })); setSuccess(false) }}
                      exclude={excludeFor(key)}
                      drivers={drivers}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {profile && (
            <Link to={`/${profile.username}`} className="btn btn-secondary">
              View profile
            </Link>
          )}
        </div>
      </form>

      {/* ── Section: Security ── */}
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h2 className={sectionTitle}>Password</h2>

        {pwError && <Notice kind="error">{pwError}</Notice>}
        {pwSuccess && <Notice>Password updated.</Notice>}

        <div className="space-y-1">
          <label htmlFor="newPassword" className={labelClass}>New password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={pwForm.newPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwSuccess(false) }}
            placeholder="8 characters minimum"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className={labelClass}>Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={pwForm.confirmPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwSuccess(false) }}
            placeholder="Repeat new password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pwSaving || !pwForm.newPassword}
          className="btn btn-secondary"
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {/* ── Section: Danger Zone ── */}
      <section className="space-y-4">
        <h2 className={`${sectionTitle} text-red-400! border-red-500/30!`}>Delete account</h2>

        {!showDelete ? (
          <div className="rounded-lg border border-line bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Delete account</p>
              <p className="text-sm text-subtle mt-0.5">Removes your profile, ratings, reviews, likes and follows. This cannot be undone.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="btn btn-sm shrink-0 border border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              Delete account
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-5 space-y-4">
            <p className="text-sm text-white font-semibold">Are you sure?</p>
            <p className="text-sm text-muted leading-relaxed">
              This will permanently delete your reviews, ratings, follows and your account. Type <span className="font-mono text-red-400">DELETE</span> to confirm.
            </p>

            {deleteError && <Notice kind="error">{deleteError}</Notice>}

            <input
              type="text"
              aria-label="Type DELETE to confirm"
              autoComplete="off"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="field font-mono focus:border-red-500!"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleteLoading}
                className="btn bg-red-600 text-white hover:bg-red-500"
              >
                {deleteLoading ? 'Deleting…' : 'Delete my account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError(null) }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}

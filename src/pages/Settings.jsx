import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

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

const inputClass =
  'w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-f1-red transition-colors'

const selectClass =
  'w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white focus:outline-none focus:border-f1-red transition-colors appearance-none cursor-pointer'

function DriverSearchInput({ value, onChange, exclude, drivers }) {
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
      <div className="flex items-center gap-2 rounded-lg border border-line bg-card-hover px-3 py-2.5">
        <span className="text-sm text-white flex-1">{selected.given_name} {selected.family_name}</span>
        <button
          type="button"
          onClick={() => { onChange(''); setQuery('') }}
          className="text-subtle hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search a driver…"
        className={inputClass}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-line bg-card shadow-xl overflow-hidden">
          {filtered.map((d) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(d.id); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-muted hover:bg-card-hover hover:text-white transition-colors cursor-pointer"
            >
              {d.given_name} {d.family_name}
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5">
          <p className="text-sm text-subtle">No results for "{query}"</p>
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
    supabase
      .from('drivers')
      .select('id, given_name, family_name')
      .order('family_name')
      .then(({ data }) => setDrivers(data ?? []))
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

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-white font-semibold">Restricted Access</p>
          <p className="text-sm text-muted">You must be signed in to access settings.</p>
          <Link
            to="/login"
            className="inline-block mt-2 rounded bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Profile form handlers ──

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    let avatarUrl = profile?.avatar_url ?? null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) {
        setError('Error uploading avatar.')
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = urlData.publicUrl
    }

    const topPilots = [form.pilot1, form.pilot2, form.pilot3].filter(Boolean)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: form.displayName,
        bio: form.bio || null,
        favorite_team: form.favoriteTeam || null,
        top_pilots: topPilots.length > 0 ? topPilots : null,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Error updating profile.')
    } else {
      setSuccess(true)
      setAvatarFile(null)
      await refreshProfile()
    }
    setSaving(false)
  }

  // ── Password handler ──

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Passwords don't match.")
      return
    }

    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword })
    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setPwForm({ newPassword: '', confirmPassword: '' })
    }
    setPwSaving(false)
  }

  // ── Delete account handler ──

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      await Promise.all([
        supabase.from('likes').delete().eq('user_id', user.id),
        supabase.from('ratings').delete().eq('user_id', user.id),
        supabase.from('follows').delete().eq('follower_id', user.id),
        supabase.from('follows').delete().eq('following_id', user.id),
      ])
      await supabase.from('reviews').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('id', user.id)

      // Requires a Supabase SQL function: CREATE OR REPLACE FUNCTION delete_user()
      // RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
      //   DELETE FROM auth.users WHERE id = auth.uid();
      // END; $$;
      await supabase.rpc('delete_user')

      await supabase.auth.signOut()
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
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-12">
      <h1 className="text-2xl font-black text-white">Profile Settings</h1>

      {/* ── Section: Profile ── */}
      <form onSubmit={handleSubmit} className="space-y-8">

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-900/50 bg-green-950/30 px-4 py-3">
            <p className="text-sm text-green-400">Changes saved.</p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle border-b border-line pb-2">
            General Information
          </h2>

          <div>
            <label className="block text-xs font-medium text-muted mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-card-hover border border-line flex items-center justify-center overflow-hidden">
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
                className="text-sm font-medium text-muted border border-line rounded px-3 py-1.5 hover:text-white hover:border-subtle transition-colors cursor-pointer"
              >
                Change photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Display Name</label>
            <input name="displayName" type="text" value={form.displayName} onChange={handleChange} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Bio</label>
            <textarea
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
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle border-b border-line pb-2">
            F1 Favorites
          </h2>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Favorite Team</label>
            <div className="relative">
              <select name="favoriteTeam" value={form.favoriteTeam} onChange={handleChange} className={selectClass}>
                <option value="">— Select a team —</option>
                {F1_TEAMS.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-2">Top 3 Drivers</label>
            <div className="space-y-2">
              {(['pilot1', 'pilot2', 'pilot3']).map((key, i) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-black text-f1-red w-4">{i + 1}</span>
                  <div className="flex-1">
                    <DriverSearchInput
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
            className="rounded-lg bg-f1-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {profile && (
            <Link to={`/${profile.username}`} className="text-sm text-muted hover:text-white transition-colors">
              Cancel
            </Link>
          )}
        </div>
      </form>

      {/* ── Section: Security ── */}
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle border-b border-line pb-2">
          Security
        </h2>

        {pwError && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
            <p className="text-sm text-red-400">{pwError}</p>
          </div>
        )}
        {pwSuccess && (
          <div className="rounded-lg border border-green-900/50 bg-green-950/30 px-4 py-3">
            <p className="text-sm text-green-400">Password updated.</p>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted">New Password</label>
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwSuccess(false) }}
            placeholder="Min. 6 characters"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted">Confirm Password</label>
          <input
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwSuccess(false) }}
            placeholder="Repeat new password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pwSaving || !pwForm.newPassword}
          className="rounded-lg bg-card-hover border border-line px-5 py-2.5 text-sm font-semibold text-white hover:border-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {/* ── Section: Danger Zone ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-500 border-b border-red-900/40 pb-2">
          Danger Zone
        </h2>

        {!showDelete ? (
          <div className="rounded-lg border border-line bg-card p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Delete account</p>
              <p className="text-xs text-subtle mt-0.5">Permanently delete your account and all your data. This cannot be undone.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="shrink-0 rounded-lg border border-red-900/60 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              Delete account
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-red-900/60 bg-red-950/10 p-5 space-y-4">
            <p className="text-sm text-white font-semibold">Are you sure?</p>
            <p className="text-xs text-subtle leading-relaxed">
              This will permanently delete your reviews, ratings, follows and your account. Type <span className="font-mono text-red-400">DELETE</span> to confirm.
            </p>

            {deleteError && (
              <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2">
                <p className="text-xs text-red-400">{deleteError}</p>
              </div>
            )}

            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full rounded-lg border border-red-900/40 bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-red-600 transition-colors font-mono"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleteLoading}
                className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleteLoading ? 'Deleting…' : 'Delete my account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError(null) }}
                className="text-sm text-muted hover:text-white transition-colors cursor-pointer"
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

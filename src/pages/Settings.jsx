import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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

export default function Settings() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    favoriteTeam: '',
    pilot1: '',
    pilot2: '',
    pilot3: '',
  })
  const [drivers, setDrivers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

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
        setError("Error uploading avatar.")
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

  const inputClass =
    'w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-f1-red transition-colors'

  const selectClass =
    'w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white focus:outline-none focus:border-f1-red transition-colors appearance-none cursor-pointer'

  // Available drivers for slot i (exclude the other two slots)
  const availableDrivers = (currentKey) => {
    const otherKeys = ['pilot1', 'pilot2', 'pilot3'].filter((k) => k !== currentKey)
    const taken = new Set(otherKeys.map((k) => form[k]).filter(Boolean))
    return drivers.filter((d) => !taken.has(d.id) || d.id === form[currentKey])
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">Profile Settings</h1>

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

        {/* Section: General info */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle border-b border-line pb-2">
            General Information
          </h2>

          {/* Avatar */}
          <div>
            <label className="block text-xs font-medium text-muted mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-card-hover border border-line flex items-center justify-center overflow-hidden">
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview || profile?.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-subtle">
                    {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-muted border border-line rounded px-3 py-1.5 hover:text-white hover:border-subtle transition-colors"
              >
                Change photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Display Name</label>
            <input
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={handleChange}
              className={inputClass}
            />
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

        {/* Section: F1 Favorites */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle border-b border-line pb-2">
            F1 Favorites
          </h2>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Favorite Team</label>
            <div className="relative">
              <select
                name="favoriteTeam"
                value={form.favoriteTeam}
                onChange={handleChange}
                className={selectClass}
              >
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
                  <div className="relative flex-1">
                    <select
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">— Select a driver —</option>
                      {availableDrivers(key).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.given_name} {d.family_name}
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-f1-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {profile && (
            <Link
              to={`/${profile.username}`}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Cancel
            </Link>
          )}
        </div>

      </form>
    </div>
  )
}

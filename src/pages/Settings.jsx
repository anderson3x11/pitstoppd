import { useState } from 'react'
import { Link } from 'react-router-dom'

const isLoggedIn = false

export default function Settings() {
  const [form, setForm] = useState({
    displayName: 'Maxime R.',
    bio: 'Fan de F1 depuis les années Schumacher.',
    favoriteTeam: 'McLaren',
    pilot1: 'Lando Norris',
    pilot2: 'Ayrton Senna',
    pilot3: 'Lewis Hamilton',
  })

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-white font-semibold">Accès restreint</p>
          <p className="text-sm text-muted">Vous devez être connecté pour accéder aux paramètres.</p>
          <Link
            to="/login"
            className="inline-block mt-2 rounded bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const inputClass =
    'w-full rounded-lg border border-line bg-card-hover px-3 py-2.5 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-f1-red transition-colors'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">Paramètres du profil</h1>

      <form className="space-y-8">

        {/* Section : Infos de base */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle border-b border-line pb-2">
            Informations générales
          </h2>

          {/* Avatar */}
          <div>
            <label className="block text-xs font-medium text-muted mb-2">Photo de profil</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-card-hover border border-line flex items-center justify-center">
                <span className="text-xl font-black text-subtle">M</span>
              </div>
              <button type="button" className="text-sm font-medium text-muted border border-line rounded px-3 py-1.5 hover:text-white hover:border-subtle transition-colors">
                Changer la photo
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Nom d&apos;affichage</label>
            <input name="displayName" type="text" value={form.displayName} onChange={handleChange} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Quelques mots sur vous…"
              className={`${inputClass} resize-none`}
            />
          </div>
        </section>

        {/* Section : Favoris F1 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle border-b border-line pb-2">
            Favoris F1
          </h2>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted">Écurie favorite</label>
            <input name="favoriteTeam" type="text" value={form.favoriteTeam} onChange={handleChange} placeholder="ex : Ferrari" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-2">Top 3 pilotes</label>
            <div className="space-y-2">
              {['pilot1', 'pilot2', 'pilot3'].map((key, i) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-black text-f1-red w-4">{i + 1}</span>
                  <input
                    name={key}
                    type="text"
                    value={form[key]}
                    onChange={handleChange}
                    placeholder={`Pilote ${i + 1}`}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-f1-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors"
          >
            Enregistrer les modifications
          </button>
          <Link to="/f1addict" className="text-sm text-muted hover:text-white transition-colors">
            Annuler
          </Link>
        </div>

      </form>
    </div>
  )
}

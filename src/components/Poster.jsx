import { useState } from 'react'

/**
 * Poster d'un GP au ratio 2:3. Image TheSportsDB si disponible,
 * sinon un poster typographique (aussi utilisé si l'image ne charge pas).
 * La taille vient du parent (className).
 */
export default function Poster({ race, className = '', eager = false }) {
  const src = race?.poster_url ?? race?.posterUrl
  const [failed, setFailed] = useState(false)
  const isSprint = (race?.race_type ?? race?.raceType) === 'sprint'
  const name = race?.name?.replace(/ Sprint$/, '').replace(/ Grand Prix$/, '') ?? ''

  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-md bg-card-hover ring-1 ring-inset ring-white/10 ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={race.name}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between p-[8%] bg-[radial-gradient(120%_80%_at_0%_0%,#2a0a10_0%,transparent_60%),linear-gradient(180deg,#1c1c1c,#101010)] [container-type:inline-size]" role="img" aria-label={race?.name}>
          <span className="block h-[3%] w-1/3 rounded-full bg-f1-red" />
          <div>
            <p className="font-display font-bold text-[30cqi] leading-[0.85] text-white/10 -ml-[2%]">{race?.season}</p>
            <p className="mt-[6%] font-display font-bold uppercase text-[12cqi] leading-[0.95] text-white break-words">{name}</p>
            <p className="mt-[4%] font-display font-semibold uppercase tracking-wider text-[7cqi] text-f1-red">
              {isSprint ? 'Sprint' : 'Grand Prix'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

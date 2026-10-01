// Photo de profil ronde, ou l'initiale du nom si pas d'avatar
export default function Avatar({ profile, className = 'h-8 w-8 text-xs' }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-raised font-semibold text-muted ${className}`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt='' className='h-full w-full object-cover' />
      ) : (
        profile?.display_name?.[0]?.toUpperCase()
      )}
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-md bg-card-hover ${className}`} />
  )
}

export function SkeletonGPCard() {
  return (
    <div>
      <Skeleton className="aspect-[2/3]" />
      <div className="pt-2.5 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="space-y-4 pb-1">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-14 w-full max-w-md" />
      <Skeleton className="h-9 w-36" />
    </div>
  )
}

export function SkeletonFeedCard() {
  return (
    <div className="rounded-lg border border-line bg-card flex overflow-hidden">
      <Skeleton className="w-16 shrink-0 aspect-[2/3] rounded-none" />
      <div className="flex-1 px-3 py-3 space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16 mt-3" />
      </div>
    </div>
  )
}

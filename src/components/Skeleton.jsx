export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded bg-card-hover ${className}`} />
  )
}

export function SkeletonGPCard() {
  return (
    <div className="rounded-lg overflow-hidden bg-card border border-line">
      <Skeleton className="aspect-[2/3] rounded-none" />
      <div className="p-2.5 space-y-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="space-y-3 pb-1">
      <div className="flex items-center gap-2">
        <span className="block w-6 h-px bg-f1-red" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-9 w-36 rounded" />
    </div>
  )
}

export function SkeletonFeedCard() {
  return (
    <div className="rounded-lg border border-line bg-card flex overflow-hidden">
      <Skeleton className="w-20 shrink-0 h-20 rounded-none" />
      <div className="flex-1 px-3 py-3 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16 mt-2" />
      </div>
    </div>
  )
}

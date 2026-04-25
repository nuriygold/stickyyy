export function ResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="aspect-[4/5] shimmer" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-1/3 shimmer rounded" />
            <div className="h-5 w-2/3 shimmer rounded" />
            <div className="h-3 w-full shimmer rounded" />
            <div className="h-3 w-4/5 shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

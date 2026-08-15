/** Placeholder de carga de las tarjetas de colaborador (Estaciones 3 y 4). */
export function CollabCardSkeleton({ withPills = false }) {
  return (
    <div className="bg-card rounded-2xl border p-4 animate-pulse space-y-3">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded-full w-44" />
          <div className="h-3 bg-muted rounded-full w-32" />
          <div className="h-3 bg-muted rounded-full w-36" />
          <div className="h-3 bg-muted rounded-full w-28" />
          <div className="h-3 bg-muted rounded-full w-20" />
        </div>
        <div
          className={`bg-muted shrink-0 ${
            withPills ? 'h-7 w-28 rounded-xl' : 'h-6 w-14 rounded-lg'
          }`}
        />
      </div>
      {withPills && (
        <div className="flex gap-1.5">
          <div className="h-7 w-20 bg-muted rounded-xl" />
          <div className="h-7 w-24 bg-muted rounded-xl" />
          <div className="h-7 w-24 bg-muted rounded-xl" />
        </div>
      )}
      <div className="space-y-1.5">
        <div className="h-11 bg-muted rounded-xl" />
        <div className="h-11 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

/** Lista de skeletons. */
export function CollabCardSkeletonList({ count = 4, withPills = false }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <CollabCardSkeleton key={i} withPills={withPills} />
      ))}
    </div>
  );
}

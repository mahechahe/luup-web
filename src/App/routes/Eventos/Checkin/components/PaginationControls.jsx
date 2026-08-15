import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Construye la ventana de páginas visibles, con elipsis cuando hay muchas. */
function pageItems(totalPages, safePage) {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (p) =>
        totalPages <= 7 ||
        p === 1 ||
        p === totalPages ||
        Math.abs(p - safePage) <= 1
    )
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);
}

/**
 * Barra de paginación de las estaciones. `page` es el objeto que devuelve `useStationList`.
 * Con `pageSizeOptions` además muestra el selector de filas por página.
 */
export function PaginationControls({ page, pageSizeOptions }) {
  const {
    current: safePage,
    total: totalPages,
    size: pageSize,
    setSize,
    go,
    totalItems,
    startIdx,
  } = page;

  return (
    <div className="bg-card rounded-xl border border-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        {pageSizeOptions?.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium shrink-0">
              Filas:
            </span>
            <div className="flex border border-border rounded-md overflow-hidden">
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => setSize(size)}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    pageSize === size
                      ? 'bg-[#DD7419] text-white'
                      : 'bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {totalItems === 0
              ? 0
              : `${startIdx + 1}–${Math.min(startIdx + pageSize, totalItems)}`}
          </span>{' '}
          de <span className="font-semibold text-foreground">{totalItems}</span>
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => go(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageItems(totalPages, safePage).map((item, idx) =>
          item === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => go(item)}
              className={`h-8 min-w-8 px-2 rounded-md text-xs font-semibold transition ${
                safePage === item
                  ? 'bg-[#DD7419] text-white'
                  : 'border border-border text-foreground hover:bg-muted'
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          onClick={() => go(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

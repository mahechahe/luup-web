export function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      <td className="w-1 p-0"><div className="w-1 h-full bg-muted" /></td>
      <td className="px-4 py-3.5 min-w-[200px]">
        <div className="h-3.5 bg-muted rounded-full w-32 mb-1.5" />
        <div className="h-3 bg-muted rounded-full w-20" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-24" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-32 mb-1.5" />
        <div className="h-3 bg-muted rounded-full w-24" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-16" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-8 bg-muted rounded-md w-20" />
      </td>
    </tr>
  );
}

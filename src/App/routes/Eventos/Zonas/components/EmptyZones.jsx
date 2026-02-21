import { Inbox } from 'lucide-react';

export function EmptyZones({ message }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-white py-16 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Inbox className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Las zonas se configuran desde el módulo Canvas del evento.
      </p>
    </div>
  );
}

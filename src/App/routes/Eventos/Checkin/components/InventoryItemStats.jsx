import { getItemQuantities } from '../utils/collaborators';

/**
 * Rejilla Asignado / Devuelto / Usado / Dañado / Pendiente de un ítem asignado.
 * Usada en Estación 3 (lista y modal "ver todos") y en Estación 4.
 */
export function InventoryItemStats({ item }) {
  const { assigned, returned, used, damaged, pending, complete } =
    getItemQuantities(item);

  const cells = [
    { label: 'Asignado', value: assigned, color: 'text-foreground' },
    { label: 'Devuelto', value: returned, color: 'text-emerald-600' },
    {
      label: 'Usado',
      value: used,
      color: 'text-[#234465] dark:text-[#7493B2]',
    },
    {
      label: 'Dañado',
      value: damaged,
      color: damaged > 0 ? 'text-destructive' : 'text-muted-foreground',
    },
    {
      label: 'Pendiente',
      value: pending,
      color: complete ? 'text-emerald-600' : 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {cells.map(({ label, value, color }) => (
        <div key={label} className="bg-background rounded-lg py-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-1">
            {label}
          </p>
          <p className={`text-base font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

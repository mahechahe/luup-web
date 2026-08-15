import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY_FILTERS = {
  zoneId: '',
  shiftId: '',
};

const shiftLabel = (shift) => {
  if (!shift) return '';
  const hours =
    shift.startTime && shift.endTime
      ? ` · ${shift.startTime}–${shift.endTime}`
      : '';
  return `${shift.name}${hours}`;
};

export function AssignmentFilterSheet({
  open,
  onClose,
  onApply,
  activeFilters,
  zones,
  shifts,
}) {
  const [local, setLocal] = useState(activeFilters);

  useEffect(() => {
    if (open) setLocal(activeFilters);
  }, [activeFilters, open]);

  const update = (key) => (value) =>
    setLocal((current) => ({
      ...current,
      [key]: value === '__all__' ? '' : value,
    }));

  const hasFilters = Object.values(local).some(Boolean);

  const handleApply = () => {
    onApply({ ...local });
    onClose();
  };

  const handleClear = () => {
    setLocal(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">
                Filtrar asignaciones
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                Combina zona y turno para encontrar una asignación.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
          <div className="space-y-1.5">
            <Label htmlFor="assignment-filter-zone">Zona</Label>
            <Select
              value={local.zoneId || '__all__'}
              onValueChange={update('zoneId')}
            >
              <SelectTrigger id="assignment-filter-zone" className="w-full">
                <SelectValue placeholder="Todas las zonas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las zonas</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.zoneId} value={String(zone.zoneId)}>
                    {zone.name}
                    {String(zone.category).toLowerCase() === 'acopio'
                      ? ' · Centro de acopio'
                      : ' · Zona'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-filter-shift">
              Turno predeterminado
            </Label>
            <Select
              value={local.shiftId || '__all__'}
              onValueChange={update('shiftId')}
            >
              <SelectTrigger id="assignment-filter-shift" className="w-full">
                <SelectValue placeholder="Todos los turnos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los turnos</SelectItem>
                {shifts.map((shift) => (
                  <SelectItem key={shift.shiftId} value={String(shift.shiftId)}>
                    {shiftLabel(shift)}
                    {!shift.isActive ? ' · Inactivo' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 border-t border-border pt-4 sm:flex-col">
          <Button className="w-full" onClick={handleApply}>
            Aplicar filtros
          </Button>
          <SheetClose asChild>
            <Button
              variant="outline"
              className="w-full gap-1.5"
              disabled={!hasFilters}
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

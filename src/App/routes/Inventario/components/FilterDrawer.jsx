import { Filter, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const EMPTY_FILTERS = { nombre: '', descripcion: '' };

export function FilterDrawer({ open, onClose, onApply, activeFilters }) {
  const [local, setLocal] = useState(activeFilters);

  const handleOpenChange = (isOpen) => {
    if (isOpen) setLocal(activeFilters);
    else onClose();
  };

  function handleApply() {
    onApply({ ...local });
    onClose();
  }

  function handleClear() {
    setLocal(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
    onClose();
  }

  const hasChanges = Object.values(local).some((v) => v !== '');

  function set(key) {
    return (e) => setLocal((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Filter className="w-4 h-4 text-brand" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">
                Filtrar inventario
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Ningún campo es obligatorio.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="filter-nombre" className="text-sm font-medium">
              Nombre
            </Label>
            <Input
              id="filter-nombre"
              placeholder="ej. Casco de seguridad"
              value={local.nombre}
              onChange={set('nombre')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-descripcion" className="text-sm font-medium">
              Descripción
            </Label>
            <Input
              id="filter-descripcion"
              placeholder="ej. Para trabajos de altura"
              value={local.descripcion}
              onChange={set('descripcion')}
            />
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 pt-4 border-t border-border sm:flex-col">
          <Button
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={handleApply}
          >
            Aplicar filtros
          </Button>
          <SheetClose asChild>
            <Button
              variant="outline"
              className="w-full gap-1.5"
              disabled={!hasChanges}
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

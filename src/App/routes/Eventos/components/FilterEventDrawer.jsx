import { SlidersHorizontal } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const EMPTY = { name: '', location: '', dateFrom: '', dateTo: '' };

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function FilterEventDrawer({ open, onClose, onApply, activeFilters }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset({ ...EMPTY, ...activeFilters });
  }, [open, activeFilters, reset]);

  function handleOpenChange(isOpen) {
    if (!isOpen) onClose();
  }

  const onSubmit = handleSubmit((values) => {
    onApply(values);
    onClose();
  });

  function handleClear() {
    reset(EMPTY);
    onApply(EMPTY);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-brand" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">Filtrar eventos</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Todos los campos son opcionales.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          id="filter-event-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-5"
        >
          <Field label="Nombre">
            <Input placeholder="ej. Festival" {...register('name')} />
          </Field>

          <Field label="Ubicación">
            <Input placeholder="ej. Bogotá" {...register('location')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha desde">
              <Input type="date" {...register('dateFrom')} />
            </Field>
            <Field label="Fecha hasta">
              <Input type="date" {...register('dateTo')} />
            </Field>
          </div>
        </form>

        <SheetFooter className="flex-col gap-2 pt-4 border-t border-border sm:flex-col">
          <Button
            type="submit"
            form="filter-event-form"
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
          >
            Aplicar filtros
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleClear}
          >
            Limpiar filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

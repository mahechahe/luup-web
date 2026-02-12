import { yupResolver } from '@hookform/resolvers/yup';
import { CalendarPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as yup from 'yup';
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
import { createEventoService } from '../services/eventServices';

const schema = yup.object({
  name: yup
    .string()
    .required('El nombre es requerido.')
    .max(255, 'Máximo 255 caracteres.'),
  date: yup
    .string()
    .required('La fecha es requerida.')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.'),
  location: yup
    .string()
    .required('La ubicación es requerida.')
    .max(255, 'Máximo 255 caracteres.'),
});

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

export function CreateEventDrawer({ open, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', date: '', location: '' },
  });

  function handleOpenChange(isOpen) {
    if (!isOpen) {
      reset();
      onClose();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const res = await createEventoService(values);
    if (res.status) {
      toast.success('Evento creado exitosamente.');
      reset();
      onClose();
      onSuccess();
    } else {
      toast.error(res.errors ?? 'No se pudo crear el evento.');
    }
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4 text-brand" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">Nuevo evento</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Nombre, fecha y ubicación son obligatorios.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          id="create-event-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-5"
        >
          <Field label="Nombre del evento" error={errors.name?.message}>
            <Input placeholder="ej. Festival LUUP 2026" {...register('name')} />
          </Field>

          <Field label="Fecha" error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>

          <Field label="Ubicación" error={errors.location?.message}>
            <Input placeholder="ej. Parque Simón Bolívar, Bogotá" {...register('location')} />
          </Field>
        </form>

        <SheetFooter className="flex-col gap-2 pt-4 border-t border-border sm:flex-col">
          <Button
            type="submit"
            form="create-event-form"
            disabled={isSubmitting}
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4" />
                Crear evento
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import { yupResolver } from '@hookform/resolvers/yup';
import { Pencil } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { updateEventoService } from '../services/eventServices';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const schema = yup.object({
  name: yup
    .string()
    .required('El nombre es requerido.')
    .max(255, 'Máximo 255 caracteres.'),
  dateType: yup
    .string()
    .required('El tipo de fecha es requerido.')
    .oneOf(['single_date', 'stages']),
  date: yup.string().when('dateType', {
    is: 'single_date',
    then: (s) =>
      s.required('La fecha es requerida.').matches(DATE_REGEX, 'Formato YYYY-MM-DD.'),
    otherwise: (s) => s.optional(),
  }),
  startDate: yup.string().when('dateType', {
    is: 'stages',
    then: (s) =>
      s.required('La fecha de inicio es requerida.').matches(DATE_REGEX, 'Formato YYYY-MM-DD.'),
    otherwise: (s) => s.optional(),
  }),
  endDate: yup.string().when('dateType', {
    is: 'stages',
    then: (s) =>
      s.required('La fecha de fin es requerida.').matches(DATE_REGEX, 'Formato YYYY-MM-DD.'),
    otherwise: (s) => s.optional(),
  }),
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

export function EditEventDrawer({ open, onClose, onSuccess, event }) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      dateType: 'single_date',
      date: '',
      startDate: '',
      endDate: '',
      location: '',
    },
  });

  const dateType = watch('dateType');

  useEffect(() => {
    if (open && event) {
      reset({
        name: event.name ?? '',
        dateType: event.dateType ?? 'single_date',
        date: event.date ?? '',
        startDate: event.startDate ?? '',
        endDate: event.endDate ?? '',
        location: event.location ?? '',
      });
    }
  }, [open, event, reset]);

  function handleOpenChange(isOpen) {
    if (!isOpen) {
      reset();
      onClose();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      eventId: event.eventId,
      name: values.name,
      dateType: values.dateType,
      location: values.location,
      ...(values.dateType === 'single_date'
        ? { date: values.date }
        : { startDate: values.startDate, endDate: values.endDate }),
    };

    const res = await updateEventoService(body);
    if (res.status) {
      toast.success('Evento actualizado exitosamente.');
      reset();
      onClose();
      onSuccess();
    } else {
      toast.error(res.errors ?? 'No se pudo actualizar el evento.');
    }
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-brand" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">Editar evento</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Modifica los datos del evento.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          id="edit-event-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-5"
        >
          <Field label="Nombre del evento" error={errors.name?.message}>
            <Input placeholder="ej. Festival LUUP 2026" {...register('name')} />
          </Field>

          <Field label="Tipo de fecha" error={errors.dateType?.message}>
            <Controller
              name="dateType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_date">Fecha única</SelectItem>
                    <SelectItem value="stages">Etapas (rango de fechas)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {dateType === 'single_date' && (
            <Field label="Fecha" error={errors.date?.message}>
              <Input type="date" {...register('date')} />
            </Field>
          )}

          {dateType === 'stages' && (
            <>
              <Field label="Fecha de inicio" error={errors.startDate?.message}>
                <Input type="date" {...register('startDate')} />
              </Field>
              <Field label="Fecha de fin" error={errors.endDate?.message}>
                <Input type="date" {...register('endDate')} />
              </Field>
            </>
          )}

          <Field label="Ubicación" error={errors.location?.message}>
            <Input placeholder="ej. Parque Simón Bolívar, Bogotá" {...register('location')} />
          </Field>
        </form>

        <SheetFooter className="flex-col gap-2 pt-4 border-t border-border sm:flex-col">
          <Button
            type="submit"
            form="edit-event-form"
            disabled={isSubmitting}
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                Guardar cambios
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

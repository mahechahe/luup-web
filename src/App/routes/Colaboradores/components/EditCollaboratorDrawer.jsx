import { yupResolver } from '@hookform/resolvers/yup';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import {
  getCollaboratorDetailService,
  getDocumentTypesService,
  updateColaboradorService,
} from '../services/collaboratorServices';
import { useSharedStore } from '@/App/context/sharedStore';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

const UNIFORM_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/* ── Validación ──────────────────────────────────────────── */
const schema = yup.object({
  firstName: yup
    .string()
    .required('El nombre es requerido.')
    .max(100, 'Máximo 100 caracteres.'),

  lastName: yup
    .string()
    .required('El apellido es requerido.')
    .max(100, 'Máximo 100 caracteres.'),

  phone: yup
    .string()
    .required('El celular es requerido.')
    .matches(/^\d+$/, 'Solo dígitos, sin espacios ni guiones.')
    .max(20, 'Máximo 20 caracteres.'),

  cedula: yup
    .string()
    .required('La cédula es requerida.')
    .max(20, 'Máximo 20 caracteres.'),

  typeDocument: yup
    .number()
    .transform((val) => (val === '' ? undefined : Number(val)))
    .typeError('Selecciona un tipo de documento.')
    .required('El tipo de documento es requerido.')
    .integer('Debe ser un número entero.')
    .positive('Debe ser un número positivo.'),

  email: yup
    .string()
    .email('El email no tiene un formato válido.')
    .max(100, 'Máximo 100 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),

  age: yup.string().optional(),

  gender: yup
    .string()
    .optional()
    .oneOf(['male', 'female', 'other', ''], 'Género inválido.')
    .transform((val) => (val === '' ? undefined : val)),

  // Campos opcionales adicionales
  birthDate: yup
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  bloodType: yup
    .string()
    .max(10, 'Máximo 10 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  hasDisease: yup.boolean().optional(),
  diseaseDescription: yup
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  takesMedication: yup.boolean().optional(),
  medicationDescription: yup
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  address: yup
    .string()
    .max(255, 'Máximo 255 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  emergencyContactName: yup
    .string()
    .max(200, 'Máximo 200 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  emergencyContactPhone: yup
    .string()
    .max(20, 'Máximo 20 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  bankName: yup
    .string()
    .max(100, 'Máximo 100 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  accountNumber: yup
    .string()
    .max(50, 'Máximo 50 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  hasExperience: yup.boolean().optional(),
  experienceDescription: yup
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  currentOccupation: yup
    .string()
    .max(100, 'Máximo 100 caracteres.')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  uniformSize: yup
    .string()
    .optional()
    .oneOf(['XS', 'S', 'M', 'L', 'XL', 'XXL', ''], 'Talla inválida.')
    .transform((val) => (val === '' ? undefined : val)),
  additionalNotes: yup
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

/* ── Helper: quita el prefijo +57 del teléfono ───────────── */
function stripPrefix(phone) {
  if (!phone) return '';
  return phone.replace(/^\+57/, '');
}

/* ── Helper: campo con error ─────────────────────────────── */
function Field({ label, error, optional, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (opcional)
          </span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

/* ── Separador de sección ────────────────────────────────── */
function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        {title}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ── Drawer ──────────────────────────────────────────────── */
export function EditCollaboratorDrawer({
  open,
  onClose,
  onSuccess,
  collaborator,
}) {
  const { documentTypes, setDocumentTypes } = useSharedStore();
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!open || documentTypes.length > 0) return;
    setLoadingTypes(true);
    getDocumentTypesService().then((res) => {
      if (res.status) setDocumentTypes(res.documentTypes);
      setLoadingTypes(false);
    });
  }, [open]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      cedula: '',
      typeDocument: '',
      email: '',
      age: '',
      gender: '',
      birthDate: '',
      bloodType: '',
      hasDisease: false,
      diseaseDescription: '',
      takesMedication: false,
      medicationDescription: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      bankName: '',
      accountNumber: '',
      hasExperience: false,
      experienceDescription: '',
      currentOccupation: '',
      uniformSize: '',
      additionalNotes: '',
    },
  });

  const hasDisease = watch('hasDisease');
  const takesMedication = watch('takesMedication');
  const hasExperience = watch('hasExperience');

  /* Busca el detalle completo del colaborador y rellena el formulario */
  useEffect(() => {
    if (!open || !collaborator?.userId) return;
    setLoadingDetail(true);
    getCollaboratorDetailService(collaborator.userId).then((res) => {
      const c = res.status ? res.collaborator : collaborator;
      reset({
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        phone: stripPrefix(c.phone),
        cedula: c.cedula ?? c.username ?? '',
        typeDocument:
          c.documentType?.id ?? c.typeDocument?.id ?? c.typeDocument ?? '',
        email: c.email ?? '',
        age: c.age ?? '',
        gender: c.gender ?? '',
        birthDate: c.birthDate ?? '',
        bloodType: c.bloodType ?? '',
        hasDisease: c.hasDisease ?? false,
        diseaseDescription: c.diseaseDescription ?? '',
        takesMedication: c.takesMedication ?? false,
        medicationDescription: c.medicationDescription ?? '',
        address: c.address ?? '',
        emergencyContactName: c.emergencyContactName ?? '',
        emergencyContactPhone: c.emergencyContactPhone ?? '',
        bankName: c.bankName ?? '',
        accountNumber: c.accountNumber ?? '',
        hasExperience: c.hasExperience ?? false,
        experienceDescription: c.experienceDescription ?? '',
        currentOccupation: c.currentOccupation ?? '',
        uniformSize: c.uniformSize ?? '',
        additionalNotes: c.additionalNotes ?? '',
      });
      setLoadingDetail(false);
    });
  }, [open, collaborator, reset]);

  function handleOpenChange(isOpen) {
    if (!isOpen) {
      reset();
      onClose();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      userId: collaborator.userId,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: `+57${values.phone}`,
      cedula: values.cedula,
      typeDocument: Number(values.typeDocument),
    };

    if (values.email) body.email = values.email;
    if (values.age) body.age = Number(values.age);
    if (values.gender) body.gender = values.gender;

    // Campos opcionales adicionales
    if (values.birthDate) body.birthDate = values.birthDate;
    if (values.bloodType) body.bloodType = values.bloodType;
    if (values.hasDisease !== undefined) body.hasDisease = values.hasDisease;
    if (values.hasDisease && values.diseaseDescription)
      body.diseaseDescription = values.diseaseDescription;
    if (values.takesMedication !== undefined)
      body.takesMedication = values.takesMedication;
    if (values.takesMedication && values.medicationDescription)
      body.medicationDescription = values.medicationDescription;
    if (values.address) body.address = values.address;
    if (values.emergencyContactName)
      body.emergencyContactName = values.emergencyContactName;
    if (values.emergencyContactPhone)
      body.emergencyContactPhone = values.emergencyContactPhone;
    if (values.bankName) body.bankName = values.bankName;
    if (values.accountNumber) body.accountNumber = values.accountNumber;
    if (values.hasExperience !== undefined)
      body.hasExperience = values.hasExperience;
    if (values.hasExperience && values.experienceDescription)
      body.experienceDescription = values.experienceDescription;
    if (values.currentOccupation)
      body.currentOccupation = values.currentOccupation;
    if (values.uniformSize) body.uniformSize = values.uniformSize;
    if (values.additionalNotes) body.additionalNotes = values.additionalNotes;

    const res = await updateColaboradorService(body);

    if (res.status) {
      toast.success('Colaborador actualizado exitosamente.');
      reset();
      onClose();
      onSuccess();
    } else {
      toast.error(res.errors ?? 'No se pudo actualizar el colaborador.');
    }
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        {/* Header */}
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-brand" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">
                Editar colaborador
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {loadingDetail
                  ? 'Cargando información...'
                  : 'Modifica los datos del colaborador.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Formulario */}
        <form
          id="edit-collaborator-form"
          onSubmit={onSubmit}
          className={`flex-1 overflow-y-auto px-4 py-6 space-y-5 transition-opacity ${
            loadingDetail ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" error={errors.firstName?.message}>
              <Input placeholder="ej. Carlos" {...register('firstName')} />
            </Field>
            <Field label="Apellido" error={errors.lastName?.message}>
              <Input placeholder="ej. Ramírez" {...register('lastName')} />
            </Field>
          </div>

          {/* Tipo de documento + Cédula */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tipo de documento"
              error={errors.typeDocument?.message}
            >
              <Controller
                name="typeDocument"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value !== '' ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={loadingTypes}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingTypes ? 'Cargando...' : 'Seleccionar'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((dt) => (
                        <SelectItem key={dt.id} value={String(dt.id)}>
                          {dt.code} — {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Número de cédula" error={errors.cedula?.message}>
              <Input placeholder="ej. 1234567890" {...register('cedula')} />
            </Field>
          </div>

          {/* Teléfono */}
          <Field label="Número de celular" error={errors.phone?.message}>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium select-none">
                +57
              </span>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                className="rounded-l-none"
                {...register('phone')}
              />
            </div>
          </Field>

          {/* ══════════════════════════════════════════════════════
              SECCIÓN OPCIONAL
          ══════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Información adicional
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Todos los campos de esta sección son opcionales.
              </p>
            </div>

            {/* Personal ─────────────────────────────────────── */}
            <SectionDivider title="Personal" />

            <Field
              label="Correo electrónico"
              error={errors.email?.message}
              optional
            >
              <Input
                type="email"
                placeholder="ej. carlos@luup.co"
                {...register('email')}
              />
            </Field>

            <Field
              label="Fecha de nacimiento"
              error={errors.birthDate?.message}
              optional
            >
              <Input type="date" {...register('birthDate')} />
            </Field>

            <Field
              label="Tipo de sangre"
              error={errors.bloodType?.message}
              optional
            >
              <Input placeholder="ej. O+" {...register('bloodType')} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Edad" error={errors.age?.message} optional>
                <Input
                  type="number"
                  placeholder="ej. 28"
                  min={18}
                  max={120}
                  {...register('age')}
                />
              </Field>
              <Field label="Género" error={errors.gender?.message} optional>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <Field label="Dirección" error={errors.address?.message} optional>
              <Input
                placeholder="ej. Calle 123 # 45-67, Bogotá"
                {...register('address')}
              />
            </Field>

            <Field
              label="Ocupación actual"
              error={errors.currentOccupation?.message}
              optional
            >
              <Input
                placeholder="ej. Estudiante"
                {...register('currentOccupation')}
              />
            </Field>

            <Field
              label="Talla de uniforme"
              error={errors.uniformSize?.message}
              optional
            >
              <Controller
                name="uniformSize"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar talla" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIFORM_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {/* Salud ───────────────────────────────────────── */}
            <SectionDivider title="Salud" />

            <div className="space-y-3">
              <Controller
                name="hasDisease"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-hasDisease"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <Label
                      htmlFor="edit-hasDisease"
                      className="text-sm font-medium cursor-pointer"
                    >
                      ¿Tiene alguna enfermedad?
                    </Label>
                  </div>
                )}
              />
              {hasDisease && (
                <Field
                  label="Descripción de la enfermedad"
                  error={errors.diseaseDescription?.message}
                  optional
                >
                  <Textarea
                    placeholder="Describe la enfermedad..."
                    rows={2}
                    {...register('diseaseDescription')}
                  />
                </Field>
              )}
            </div>

            <div className="space-y-3">
              <Controller
                name="takesMedication"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-takesMedication"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <Label
                      htmlFor="edit-takesMedication"
                      className="text-sm font-medium cursor-pointer"
                    >
                      ¿Toma medicamentos?
                    </Label>
                  </div>
                )}
              />
              {takesMedication && (
                <Field
                  label="Descripción de los medicamentos"
                  error={errors.medicationDescription?.message}
                  optional
                >
                  <Textarea
                    placeholder="Describe los medicamentos..."
                    rows={2}
                    {...register('medicationDescription')}
                  />
                </Field>
              )}
            </div>

            {/* Contacto de emergencia ──────────────────────── */}
            <SectionDivider title="Contacto de emergencia" />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Nombre"
                error={errors.emergencyContactName?.message}
                optional
              >
                <Input
                  placeholder="ej. María Ramírez"
                  {...register('emergencyContactName')}
                />
              </Field>
              <Field
                label="Teléfono"
                error={errors.emergencyContactPhone?.message}
                optional
              >
                <Input
                  placeholder="ej. 3001234567"
                  {...register('emergencyContactPhone')}
                />
              </Field>
            </div>

            {/* Información bancaria ────────────────────────── */}
            <SectionDivider title="Información bancaria" />

            <Field label="Banco" error={errors.bankName?.message} optional>
              <Input placeholder="ej. Bancolombia" {...register('bankName')} />
            </Field>

            <Field
              label="Número de cuenta"
              error={errors.accountNumber?.message}
              optional
            >
              <Input
                placeholder="ej. 123456789"
                {...register('accountNumber')}
              />
            </Field>

            {/* Experiencia laboral ─────────────────────────── */}
            <SectionDivider title="Experiencia laboral" />

            <div className="space-y-3">
              <Controller
                name="hasExperience"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-hasExperience"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <Label
                      htmlFor="edit-hasExperience"
                      className="text-sm font-medium cursor-pointer"
                    >
                      ¿Tiene experiencia previa?
                    </Label>
                  </div>
                )}
              />
              {hasExperience && (
                <Field
                  label="Descripción de la experiencia"
                  error={errors.experienceDescription?.message}
                  optional
                >
                  <Textarea
                    placeholder="Describe la experiencia..."
                    rows={2}
                    {...register('experienceDescription')}
                  />
                </Field>
              )}
            </div>

            {/* Notas adicionales ───────────────────────────── */}
            <SectionDivider title="Notas" />

            <Field
              label="Notas adicionales"
              error={errors.additionalNotes?.message}
              optional
            >
              <Textarea
                placeholder="Cualquier información adicional relevante..."
                rows={3}
                {...register('additionalNotes')}
              />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <SheetFooter className="flex-col gap-2 pt-4 border-t border-border sm:flex-col">
          <Button
            type="submit"
            form="edit-collaborator-form"
            disabled={isSubmitting || loadingDetail}
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

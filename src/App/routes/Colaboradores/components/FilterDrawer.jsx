import { Filter, X } from 'lucide-react';
import { useState } from 'react';
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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

const EMPTY_FILTERS = {
  firstName: '',
  email: '',
  phone: '',
  username: '',
  gender: '',
};

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onApply: (filters: object) => void,
 *   activeFilters: typeof EMPTY_FILTERS,
 * }} props
 */
export function FilterDrawer({ open, onClose, onApply, activeFilters }) {
  const [local, setLocal] = useState(activeFilters);

  const handleOpenChange = (isOpen) => {
    if (isOpen) setLocal(activeFilters);
    else onClose();
  };

  function handleApply() {
    const payload = Object.fromEntries(
      Object.entries(local).filter(([, v]) => v !== '')
    );
    onApply(payload);
    onClose();
  }

  function handleClear() {
    setLocal(EMPTY_FILTERS);
    onApply({});
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
                Filtrar colaboradores
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Ningún campo es obligatorio.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Campos */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-nombre" className="text-sm font-medium">
              Nombre
            </Label>
            <Input
              id="filter-nombre"
              placeholder="ej. Carlos"
              value={local.firstName}
              onChange={set('firstName')}
            />
          </div>

          {/* Cédula */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-cedula" className="text-sm font-medium">
              Cédula
            </Label>
            <Input
              id="filter-cedula"
              placeholder="ej. 1234567890"
              value={local.username}
              onChange={set('username')}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-email" className="text-sm font-medium">
              Correo electrónico
            </Label>
            <Input
              id="filter-email"
              type="email"
              placeholder="ej. carlos@luup.co"
              value={local.email}
              onChange={set('email')}
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-phone" className="text-sm font-medium">
              Celular
            </Label>
            <Input
              id="filter-phone"
              type="tel"
              inputMode="numeric"
              placeholder="ej. 3001234567"
              value={local.phone}
              onChange={set('phone')}
            />
          </div>

          {/* Género */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Género</Label>
            <Select
              value={local.gender}
              onValueChange={(val) =>
                setLocal((prev) => ({ ...prev, gender: val }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
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

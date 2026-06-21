import { useState } from 'react';
import { CalendarIcon, Filter, Search, X } from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function AttendanceFilterBar({
  filters,
  onChange,
  onApply,
  onClear,
  loading,
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDate = filters.dateRegister
    ? parse(filters.dateRegister, 'yyyy-MM-dd', new Date())
    : undefined;

  const handleDaySelect = (day) => {
    onChange('dateRegister', day ? format(day, 'yyyy-MM-dd') : '');
    setCalendarOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-10 justify-start text-left font-normal rounded-xl border-border bg-card text-sm"
              >
                <CalendarIcon className="mr-2 w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {selectedDate ? (
                  <span className="text-foreground">
                    {format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Seleccionar día</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDaySelect}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Nombre"
            value={filters.name}
            onChange={(event) => onChange('name', event.target.value)}
            className="pl-8 h-10 rounded-xl border-border bg-card text-sm"
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cédula"
            value={filters.cedula}
            onChange={(event) => onChange('cedula', event.target.value)}
            className="pl-8 h-10 rounded-xl border-border bg-card text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onApply}
          disabled={loading}
          className="flex-1 h-10 rounded-xl bg-brand text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <Filter className="w-3.5 h-3.5" />
          Aplicar
        </button>
        <button
          onClick={onClear}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          aria-label="Limpiar filtros"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

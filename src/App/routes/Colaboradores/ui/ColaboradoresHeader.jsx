import { Filter, Plus, RefreshCw, Upload, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ColaboradoresHeader({
  hasActiveFilter,
  loading,
  onCreate,
  onBulk,
  onFilter,
  onRefresh,
  onClear,
}) {
  return (
    <div className="rounded-2xl bg-[#234465] px-6 py-5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">
            Gestión de personal
          </p>
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            Colaboradores
          </h2>
          <p className="text-sm text-white/60 mt-0.5">
            Gestiona el equipo de trabajo de LUUP.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          className="bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 h-9 font-semibold shadow-sm"
          onClick={onCreate}
        >
          <Plus className="w-4 h-4" /> Crear colaborador
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          onClick={onBulk}
        >
          <Upload className="w-4 h-4" /> Carga masiva
        </Button>
        <Button
          variant="outline"
          className={`gap-1.5 h-9 border-white/20 text-white hover:bg-white/20 hover:text-white ${
            hasActiveFilter
              ? 'bg-[#DD7419]/30 border-[#DD7419]/60'
              : 'bg-white/10'
          }`}
          onClick={onFilter}
        >
          <Filter className="w-4 h-4" /> Filtrar
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{' '}
          Actualizar
        </Button>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            className="gap-1.5 h-9 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClear}
          >
            <X className="w-4 h-4" /> Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

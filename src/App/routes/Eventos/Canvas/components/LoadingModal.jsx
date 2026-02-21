import { Loader2 } from 'lucide-react';

export function LoadingModal({
  message = 'Actualizando información, espera un momento...',
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center gap-6 max-w-md">
        <div className="relative">
          {/* Círculo animado externo */}
          <div className="absolute inset-0 rounded-full border-4 border-[#234465]/20 animate-ping" />
          {/* Círculo principal */}
          <div className="relative w-16 h-16 rounded-full bg-[#234465]/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#234465] animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-foreground">Procesando...</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

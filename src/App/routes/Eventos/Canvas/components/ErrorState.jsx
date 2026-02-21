import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({ error, onNavigateBack }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {error ? 'Error al cargar el evento' : 'Evento no encontrado'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error ?? 'El evento que buscas no existe o fue eliminado.'}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={onNavigateBack}>
          <ArrowLeft className="w-4 h-4" /> Ir a todos los eventos
        </Button>
      </div>
    </div>
  );
}

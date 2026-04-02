import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DeleteConfirmModal({ collaborator, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={!!collaborator} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <DialogHeader className="items-center space-y-1">
            <DialogTitle>¿Eliminar colaborador?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar a{' '}
              <span className="font-semibold text-foreground">
                {collaborator?.firstName} {collaborator?.lastName}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="flex-row gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white border-0"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

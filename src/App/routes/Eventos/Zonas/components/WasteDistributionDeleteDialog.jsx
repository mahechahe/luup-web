import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function WasteDistributionDeleteDialog({
  open,
  onClose,
  distribution,
  onConfirm,
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    if (deleting) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    const result = await onConfirm(distribution);
    setDeleting(false);
    if (!result.status) {
      setError(result.errors);
      return;
    }
    handleClose();
  };

  return (
    <Dialog open={open && !!distribution} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-1">
            <Trash2 className="w-5 h-5" />
          </div>
          <DialogTitle>Eliminar distribución</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Se liberarán <strong className="text-foreground">{distribution?.weightKg} kg</strong>{' '}
          asignados a “{distribution?.category}”.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 />}
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

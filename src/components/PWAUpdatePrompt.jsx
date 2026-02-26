import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Verificar actualizaciones cada hora
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast.info('Nueva versión disponible', {
        description: 'Hay una actualización de la app lista para instalar.',
        duration: Infinity,
        action: {
          label: 'Actualizar',
          onClick: () => {
            updateServiceWorker(true);
            setNeedRefresh(false);
          },
        },
        cancel: {
          label: 'Después',
          onClick: () => setNeedRefresh(false),
        },
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layers, AlertCircle, ArrowLeft } from 'lucide-react';
import { getWorkerCurrentEventService } from './services/eventServices';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkerEventoModulesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    getWorkerCurrentEventService().then((res) => {
      if (res.status && res.currentEvent) {
        setCurrentEvent(res.currentEvent);
        setRole(res.currentEvent.role);
      }
      setLoading(false);
    });
  }, []);

  // Módulos según rol
  const allModules = [
    {
      id: 'zonas',
      title: 'Mis Zonas',
      description: 'Visualiza las zonas del evento a las que estás asignado y el personal de cada una.',
      icon: Layers,
      color: 'bg-[#DD7419]',
      path: `/eventos/${eventId}/zonas`,
      roles: ['worker', 'supervisor', 'coordinator'],
    },
    {
      id: 'incidencias',
      title: 'Incidencias',
      description: 'Registra y consulta incidencias del personal en tus zonas asignadas.',
      icon: AlertCircle,
      color: 'bg-[#234465]',
      path: `/eventos/${eventId}/incidencias`,
      roles: ['supervisor', 'coordinator'],
    },
  ];

  const modules = allModules.filter((m) => role && m.roles.includes(role));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/eventos/mis-eventos')}
            className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            {loading ? (
              <>
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-3.5 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-base font-bold text-foreground">
                  {currentEvent?.name ?? 'Evento'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {currentEvent?.location}
                </p>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          {loading ? (
            <>
              <Skeleton className="h-9 w-72 mx-auto mb-3" />
              <Skeleton className="h-5 w-80 mx-auto" />
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-luup-blue-dark mb-3">
                Selecciona un módulo
              </h2>
              <p className="text-muted-foreground">
                Accede a los módulos disponibles para tu rol en este evento.
              </p>
            </>
          )}
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent"
                >
                  <Skeleton className="w-16 h-16 rounded-2xl mb-6" />
                  <Skeleton className="h-6 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))
            : modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-luup-blue-dark hover:shadow-2xl transition-all duration-300 text-left"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl ${module.color} flex items-center justify-center mb-6 transition-colors group-hover:scale-110 transform duration-300`}
                  >
                    <module.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-luup-blue-dark transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-luup-blue-dark/10 flex items-center justify-center">
                      <ArrowLeft className="w-4 h-4 text-luup-blue-dark rotate-180" />
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}

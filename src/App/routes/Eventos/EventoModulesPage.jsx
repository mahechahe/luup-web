import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapIcon, ListChecks, UserCheck, ArrowLeft } from 'lucide-react';
import { getEventoDetailService } from './services/eventServices';
import { EventoHeader } from './Canvas/components/EventoHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventoModulesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    getEventoDetailService(eventId).then((res) => {
      if (res.status) {
        setEvent(res.event);
      }
      setLoading(false);
    });
  }, [eventId]);

  const modules = [
    {
      id: 'canvas',
      title: 'Canvas',
      description:
        'Diseña y gestiona las zonas del evento sobre el plano del recinto. Asigna colaboradores, supervisores y coordinadores a cada zona.',
      icon: MapIcon,
      color: 'bg-[#234465]',
      hoverColor: 'hover:bg-[#234465]/90',
      path: `/eventos/${eventId}/canvas`,
    },
    {
      id: 'zonas',
      title: 'Zonas',
      description:
        'Visualiza y administra todas las zonas del evento en formato de lista. Gestiona personal asignado y capacidad de cada zona.',
      icon: ListChecks,
      color: 'bg-[#DD7419]',
      hoverColor: 'hover:bg-[#DD7419]/90',
      path: `/eventos/${eventId}/zonas`,
    },
    {
      id: 'checkin',
      title: 'Check-in / Check-out',
      description:
        'Controla la asistencia y registro de entrada y salida del personal asignado a las zonas del evento.',
      icon: UserCheck,
      color: 'bg-[#7493B2]',
      hoverColor: 'hover:bg-[#7493B2]/90',
      path: `/eventos/${eventId}/checkin`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <EventoHeader
        loading={loading}
        event={event}
        onBack={() => navigate('/eventos/listado')}
      />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Título con estado de carga */}
        <div className="text-center mb-12">
          {loading ? (
            <>
              <Skeleton className="h-9 w-72 mx-auto mb-3" />
              <Skeleton className="h-5 w-96 mx-auto" />
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-[#234465] mb-3">
                Selecciona un módulo
              </h2>
              <p className="text-muted-foreground">
                Elige el módulo que deseas gestionar para el evento{' '}
                <span className="font-medium text-foreground">{event?.name}</span>
              </p>
            </>
          )}
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {loading
            ? // Skeletons durante la carga
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent"
                >
                  <Skeleton className="w-16 h-16 rounded-2xl mb-6" />
                  <Skeleton className="h-6 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ))
            : // Renderizado de módulos reales
              modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-[#234465] hover:shadow-2xl transition-all duration-300 text-left"
                >
                  {/* Icono */}
                  <div
                    className={`w-16 h-16 rounded-2xl ${module.color} ${module.hoverColor} flex items-center justify-center mb-6 transition-colors group-hover:scale-110 transform duration-300`}
                  >
                    <module.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Texto */}
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-[#234465] transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>

                  {/* Indicador de hover (Flecha) */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-[#234465]/10 flex items-center justify-center">
                      <ArrowLeft className="w-4 h-4 text-[#234465] rotate-180" />
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}
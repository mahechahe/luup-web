import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, LogIn, LogOut, Coffee, Calendar, MapPin } from 'lucide-react';
import { getWorkerAttendanceService, getEventoDetailService } from './services/eventServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '—';
  const normalized = iso.toString().replace(' ', 'T');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function WorkerEventoResumenPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    Promise.all([
      getEventoDetailService(eventId),
      getWorkerAttendanceService(eventId),
    ]).then(([eventRes, attendanceRes]) => {
      if (eventRes.status) setEvent(eventRes.event);
      if (attendanceRes.status) setAttendance(attendanceRes.attendance);
      setLoading(false);
    });
  }, [eventId]);

  const attended = attendance?.attended;
  const incidents = attendance?.incidents ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
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
                <h1 className="text-base font-bold text-foreground">{event?.name ?? 'Evento'}</h1>
                <p className="text-xs text-muted-foreground">Resumen de participación</p>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* Info del evento */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Información del evento
            </p>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event?.date ?? event?.startDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{event?.location ?? '—'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asistencia */}
        <Card className={`shadow-sm ${attended ? 'border-emerald-200 bg-emerald-50/50' : 'border-border'}`}>
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Tu asistencia
            </p>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <div className="flex gap-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  {attended === null || attended === undefined ? (
                    <><Clock className="w-5 h-5 text-muted-foreground" /><span className="text-base font-semibold text-muted-foreground">Sin registro</span></>
                  ) : attended ? (
                    <><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="text-base font-semibold text-emerald-700">Asistió al evento</span></>
                  ) : (
                    <><XCircle className="w-5 h-5 text-destructive" /><span className="text-base font-semibold text-destructive">No asistió</span></>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Entrada</p>
                      <p className="text-sm font-semibold text-foreground">{formatTime(attendance?.entryTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Salida</p>
                      <p className="text-sm font-semibold text-foreground">{formatTime(attendance?.exitTime)}</p>
                    </div>
                  </div>
                </div>
                {attendance?.notes && (
                  <p className="mt-3 text-xs text-muted-foreground italic border-t border-border pt-3">
                    {attendance.notes}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Breaks e incidencias */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" />
              Breaks e incidencias
            </p>
            {loading ? (
              <div className="flex gap-2">
                <Skeleton className="h-7 w-32 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin breaks o incidencias registradas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs text-foreground"
                  >
                    <span className="font-medium">{inc.name}</span>
                    <span className="text-muted-foreground">· {inc.time}</span>
                    {inc.note && <span className="text-muted-foreground italic">— {inc.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

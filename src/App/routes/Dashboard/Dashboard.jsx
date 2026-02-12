import {
  Bell,
  Box,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Truck,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { closeSesion } from '@/App/auth/services/authService';

/* ── Datos de ejemplo (reemplazar con API real) ──────────── */
const STATS = [
  {
    label: 'Eventos Activos',
    value: 8,
    icon: Calendar,
    color: 'bg-brand/10 text-brand',
    trend: '+2 esta semana',
    trendUp: true,
  },
  {
    label: 'Entregas en Tránsito',
    value: 24,
    icon: Truck,
    color: 'bg-sky-100 text-sky-600',
    trend: '6 llegan hoy',
    trendUp: true,
  },
  {
    label: 'Alertas Pendientes',
    value: 3,
    icon: AlertTriangle,
    color: 'bg-amber-100 text-amber-600',
    trend: '1 urgente',
    trendUp: false,
  },
  {
    label: 'Completados Hoy',
    value: 17,
    icon: CheckCircle2,
    color: 'bg-emerald-100 text-emerald-600',
    trend: '+5 vs ayer',
    trendUp: true,
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'urgent',
    icon: AlertTriangle,
    iconColor: 'text-error bg-error/10',
    title: 'Retraso detectado — Ruta Norte #RN-041',
    description: 'El camión lleva 45 min de atraso. Requiere acción inmediata.',
    time: 'Hace 5 min',
    unread: true,
  },
  {
    id: 2,
    type: 'event',
    icon: Calendar,
    iconColor: 'text-brand bg-brand/10',
    title: 'Evento "Expo Logística 2025" inicia pronto',
    description:
      'Faltan 2 horas para el inicio. 3 proveedores aún sin confirmar.',
    time: 'Hace 18 min',
    unread: true,
  },
  {
    id: 3,
    type: 'delivery',
    icon: Package,
    iconColor: 'text-sky-600 bg-sky-100',
    title: 'Entrega completada — Pedido #PD-7821',
    description: 'Confirmado por el receptor en Bodega Central Zona 4.',
    time: 'Hace 1 h',
    unread: false,
  },
  {
    id: 4,
    type: 'location',
    icon: MapPin,
    iconColor: 'text-emerald-600 bg-emerald-100',
    title: 'Nueva ubicación registrada',
    description: 'Punto de distribución "Sur-Beta" agregado al sistema.',
    time: 'Hace 3 h',
    unread: false,
  },
  {
    id: 5,
    type: 'inventory',
    icon: Box,
    iconColor: 'text-amber-600 bg-amber-100',
    title: 'Stock bajo — Pallets zona A',
    description: 'Quedan 12 unidades. El mínimo operativo es 20.',
    time: 'Hace 5 h',
    unread: false,
  },
];

const QUICK_ACTIONS = [
  {
    label: 'Nuevo Evento',
    icon: Calendar,
    color: 'bg-brand/10 text-brand hover:bg-brand/20',
  },
  {
    label: 'Nueva Entrega',
    icon: Truck,
    color: 'bg-sky-100 text-sky-600 hover:bg-sky-200',
  },
  {
    label: 'Ver Rutas',
    icon: MapPin,
    color: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200',
  },
  {
    label: 'Inventario',
    icon: Box,
    color: 'bg-amber-100 text-amber-600 hover:bg-amber-200',
  },
];

/* ── Helpers ─────────────────────────────────────────────── */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatDate() {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

/* ── Componentes internos ────────────────────────────────── */
function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              stat.trendUp
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-error/10 text-error'
            }`}
          >
            {stat.trend}
          </span>
        </div>
        <p className="text-3xl font-black text-foreground">{stat.value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
      </CardContent>
    </Card>
  );
}

function NotificationItem({ notification }) {
  const Icon = notification.icon;
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl transition-colors hover:bg-muted/50 cursor-pointer ${
        notification.unread ? 'bg-brand/5' : ''
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notification.iconColor}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-semibold truncate ${
              notification.unread ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {notification.title}
          </p>
          {notification.unread && (
            <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.description}
        </p>
        <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="text-xs">{notification.time}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
    </div>
  );
}

/* ── Vista principal ─────────────────────────────────────── */
function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase text-brand mb-0.5">
            {formatDate()}
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, Operador 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Aquí tienes un resumen de la operación de hoy.
          </p>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Acciones rápidas
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <Card className="border-border shadow-sm">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand" />
                Notificaciones
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand text-brand-foreground text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </CardTitle>
              <button
                type="button"
                className="text-xs text-brand hover:text-brand/80 font-medium"
              >
                Ver todas
              </button>
            </CardHeader>
            <CardContent className="px-2 pb-3 space-y-1">
              {NOTIFICATIONS.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

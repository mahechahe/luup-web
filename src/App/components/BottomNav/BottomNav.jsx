import { useState } from 'react';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess, isClientUser } from '@/App/utils/roles';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Home,
  Package,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Inicio', path: '/dashboard', icon: Home, adminOnly: false },
  {
    label: 'Eventos',
    path: '/eventos/listado',
    icon: Calendar,
    adminOnly: false,
  },
  { label: 'Inventario', path: '/inventario', icon: Package, adminOnly: true },
  {
    label: 'Colaboradores',
    path: '/colaboradores',
    icon: UserCheck,
    adminOnly: true,
  },
  {
    label: 'Reportes',
    path: '/reportes',
    icon: BarChart3,
    adminOnly: true,
  },
];

const CLIENT_NAV_ITEMS = [
  { label: 'Dashboard', path: '/cliente/dashboard', icon: LayoutDashboard },
  { label: 'Mis Eventos', path: '/cliente/eventos', icon: Calendar },
];

export default function BottomNav() {
  const { user } = useUserStore();
  const [isVisible, setIsVisible] = useState(true);

  const isClient = isClientUser(user?.roleId);

  const visibleItems = isClient
    ? CLIENT_NAV_ITEMS
    : NAV_ITEMS.filter((item) => !item.adminOnly || hasAdminAccess(user?.roleId));

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: isVisible
          ? 'translateY(0)'
          : 'translateY(calc(100% - 1.75rem))',
        transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Toggle handle */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsVisible((v) => !v)}
          aria-label={isVisible ? 'Ocultar menú' : 'Mostrar menú'}
          className="flex items-center justify-center w-16 h-7 rounded-t-2xl border border-b-0 border-border bg-card text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ChevronDown
            className="w-4 h-4"
            style={{
              transform: isVisible ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </button>
      </div>

      {/* Nav bar */}
      <nav
        className="bg-card border-t border-border"
        style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.07)' }}
      >
        <ul
          className={`grid h-16 w-full mx-auto px-2 gap-1 ${
            visibleItems.length <= 2 ? 'max-w-60' : 'max-w-[30rem]'
          }`}
          style={{
            gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <li key={path} className="h-full min-w-0">
              <NavLink
                to={path}
                end
                className="flex flex-col items-center justify-center h-full w-full group"
              >
                {({ isActive }) => (
                  <span
                    className="relative flex flex-col items-center gap-1.5 w-full px-1.5 pt-2 pb-1.5 rounded-xl transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: '#DD7419',
                            boxShadow: '0 4px 16px rgba(221,116,25,0.30)',
                            color: '#ffffff',
                          }
                        : {}
                    }
                  >
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${
                        isActive
                          ? ''
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    <span
                      className={`text-[9.5px] md:text-[11.5px] leading-none tracking-wide transition-colors duration-200 ${
                        isActive
                          ? ''
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                      style={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      {label}
                    </span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

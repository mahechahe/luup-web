import { Calendar, Home, UserCheck, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Inicio', path: '/dashboard', icon: Home },
  { label: 'Eventos', path: '/eventos', icon: Calendar },
  { label: 'Colaboradores', path: '/colaboradores', icon: UserCheck },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{
        boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex items-stretch h-16 w-full sm:max-w-md sm:mx-auto">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <li key={path} className="flex-1">
            <NavLink
              to={path}
              end
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 h-full w-full transition-colors ${
                  isActive
                    ? 'text-brand'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Indicador superior activo */}
                  <span
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full transition-all duration-200 bg-brand ${
                      isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'
                    }`}
                  />

                  {/* Icono con fondo pill cuando activo */}
                  <span
                    className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-200 ${
                      isActive ? 'bg-brand/10' : ''
                    }`}
                  >
                    <Icon
                      className={`transition-all duration-200 ${
                        isActive ? 'w-5 h-5' : 'w-5 h-5'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </span>

                  {/* Label */}
                  <span
                    className={`text-[11px] leading-none font-medium transition-all duration-200 ${
                      isActive ? 'font-semibold' : ''
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

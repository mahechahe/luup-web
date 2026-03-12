import { closeSesion } from '@/App/auth/services/authService';
import { useUserStore } from '@/App/context/userStore';
import { useTheme } from '@/App/context/themeStore.jsx';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AppBar = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    closeSesion();
    navigate(`/iniciar-sesion`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 bg-card border-b border-border px-4 flex items-center justify-between shadow-sm"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
          paddingBottom: '0.75rem',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
              <span className="text-brand-foreground font-black text-base select-none">
                L
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground tracking-tight">
                LUUP
              </span>
              <span className="hidden sm:inline text-xs text-muted-foreground">
                Logística & Eventos
              </span>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden sm:block w-px h-8 bg-border" />

          {/* Info del usuario */}
          {user && (
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-bold text-foreground leading-tight">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                C.C. {user.username}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            title={
              theme === 'dark'
                ? 'Cambiar a modo claro'
                : 'Cambiar a modo oscuro'
            }
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full">{children}</main>
    </div>
  );
};

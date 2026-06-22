import { closeSesion } from '@/App/auth/services/authService';
import { useUserStore } from '@/App/context/userStore';
import { useTheme } from '@/App/context/themeStore.jsx';
import { LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isClientUser, getRoleLabel, ROLE_IDS } from '@/App/utils/roles';

export const AppBar = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const isClient = isClientUser(user?.roleId);
  const isWorker = user?.roleId === ROLE_IDS.COLABORADOR;
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const handleLogout = () => {
    closeSesion();
    navigate(`/iniciar-sesion`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 bg-card border-b border-border shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
      <div className="px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="LUUP"
              className="w-8 h-8 rounded-lg object-contain"
            />
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
                {isClient ? getRoleLabel(user.roleId) : `C.C. ${user.username}`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isWorker && (
            <button
              type="button"
              onClick={() => navigate('/mi-perfil')}
              className="group flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-1.5 pr-3 text-left transition-colors hover:border-brand/30 hover:bg-brand/5"
              title="Ir a mi perfil"
            >
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand/10 text-[10px] font-bold text-brand">
                {initials || <UserRound className="h-3.5 w-3.5" />}
                {user?.photoUrl && (
                  <img src={user.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
              </span>
              <span className="hidden text-xs font-semibold text-foreground sm:inline">Mi perfil</span>
            </button>
          )}

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
      </div>
      </header>

      {/* Main content */}
      <main className="w-full">{children}</main>
    </div>
  );
};

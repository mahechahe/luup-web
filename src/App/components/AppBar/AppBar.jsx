import { closeSesion } from '@/App/auth/services/authService';
import { useUserStore } from '@/App/context/userStore';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AppBar = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUserStore();
console.log('user', user);

  const handleLogout = () => {
    closeSesion();
    navigate(`/iniciar-sesion`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
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
          {/* Notification bell */}
          <button
            type="button"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand text-brand-foreground text-[10px] font-bold flex items-center justify-center">
              2
            </span>
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
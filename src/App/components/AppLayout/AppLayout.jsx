import { Outlet } from 'react-router-dom';
import BottomNav from '@/App/components/BottomNav/BottomNav';

export default function AppLayout() {
  return (
    <>
      {/* pb-16 = altura del BottomNav (h-16) para que el contenido no quede tapado */}
      <div className="pb-16">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, MapPin } from 'lucide-react';

// Si MenuCard ya está en otro archivo, mantén la importación:
// import { MenuCard } from './components/MenuCard';

const ZonasPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 min-h-screen bg-[#F4F4F4] flex flex-col items-center pt-16 text-[#1A2238]">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-tighter mb-2 italic uppercase">Módulos</h1>
        <p className="text-slate-500 text-base font-bold italic">Gestión de despliegue y control de campo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* BOTÓN 1: VA A LA LISTA DE CANVAS */}
        <MenuCard 
          icon={<MapIcon size={36}/>} 
          title="Eventos" 
          badge="VALIDAR EVENTOS Y CANVAS" 
          desc="Acceso a georreferenciación a estados de producción." 
          color="orange" 
          onClick={() => navigate('/eventos/listado')} 
        />

        {/* BOTÓN 2: VA A LA GESTIÓN DE PERSONAL Y ACOPIOS */}
        <MenuCard 
          icon={<MapPin size={36}/>} 
          title="Zonas y Acopios" 
          badge="ZONAS PERSONAL Y ACOPIOS" 
          desc="Gestión de responsables y logística de suministro." 
          color="blue" 
          onClick={() => navigate('/eventos/zonas-acopios')} 
        />
      </div>
    </div>
  );
};

// Componente MenuCard (Asegúrate de que los estilos coincidan con tu diseño)
const MenuCard = ({ icon, title, badge, desc, color, onClick }) => (
  <button 
    onClick={onClick} 
    className="group bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-[#FAD9C1] shadow-sm flex flex-col items-center transition-all hover:scale-[1.02] w-full"
  >
    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-white ${color === 'orange' ? 'bg-orange-500' : 'bg-blue-600'}`}>
      {icon}
    </div>
    <h2 className="text-3xl font-black text-[#1A2238] mb-2 italic uppercase">{title}</h2>
    <div className={`px-5 py-1.5 rounded-full mb-5 ${color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
      <span className="text-[9px] font-black uppercase italic">{badge}</span>
    </div>
    <p className="text-slate-500 text-center text-sm font-bold italic">{desc}</p>
  </button>
);

export default ZonasPage;
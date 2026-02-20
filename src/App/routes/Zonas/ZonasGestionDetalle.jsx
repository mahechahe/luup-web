import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, UserCheck, ChevronRight, Calendar, Layers, Box, 
  ChevronDown, X, Phone, CreditCard, UserCog, Trash2, ChevronUp
} from 'lucide-react';
import { PersonCard } from './components/PersonCard';

const ZonasGestionDetalle = () => {
  const navigate = useNavigate();
  
  // ESTADOS
  const [selectedOp, setSelectedOp] = useState(null);
  const [filtroZona, setFiltroZona] = useState('todas');
  const [filtroAcopio, setFiltroAcopio] = useState('todos');
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [zonasAbiertas, setZonasAbiertas] = useState({});
  const [acopiosAbiertos, setAcopiosAbiertos] = useState({});

  const borderStyle = "border-[#FAD9C1]";

  // DATA (Simulada para estructura)
  const [operacionesLogistica] = useState([
    { 
      id: 1, 
      nombre: "OPERATIVO NACIONAL - CLIENTE X", 
      fecha: "FEBRERO 2026",
      nodos: [
        {
          id_nodo: 101,
          zona: "ZONA LOGÍSTICA NORTE",
          acopio: {
            nombre: "BODEGA SATÉLITE CALLE 170",
            direccion: "Cl. 170 #15-20, Bogotá",
            llenado: 85, actuales: 170, limite: 200,
            basurasActuales: 90, basurasLimite: 100, basurasPorcentaje: 90,
            equipo: {
              coordinador: { nombre: "Marcos Peña", id: "CC 80.111", celular: "300 123", rol: "Coordinador Acopio" },
              supervisor: { nombre: "Lucía Torres", id: "CC 1.050", celular: "311 456", rol: "Supervisor Acopio" },
              colaboradores: [{ nombre: "Colaborador Acopio 01", id: "1.090", celular: "320 789", rol: "Cargue" }]
            }
          },
          equipo: {
            coordinador: { nombre: "Carlos Mario Restrepo", id: "CC 79.234.123", celular: "310 555 1234", rol: "Coordinador General" },
            supervisor: { nombre: "Andrés Felipe Gil", id: "CC 1.017.555", celular: "321 999 0011", rol: "Supervisor de Campo" },
            colaboradores: [
                { nombre: "Colaborador 01", id: "1.020.333", celular: "310 444 5566", rol: "Cargue y Descargue" },
                { nombre: "Colaborador 02", id: "1.020.444", celular: "310 999 8877", rol: "Cargue y Descargue" }
            ]
          }
        }
      ]
    }
  ]);

  // FUNCIONES
  const toggleZona = (id) => setZonasAbiertas(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAcopio = (id) => setAcopiosAbiertos(prev => ({ ...prev, [id]: !prev[id] }));

  // LÓGICA DE FILTRADO SEGURO
  const zonasFiltradas = selectedOp?.nodos?.filter(n => {
    if (filtroZona === 'ninguna') return false;
    return filtroZona === 'todas' || n.zona === filtroZona;
  }) || [];

  const acopiosFiltrados = selectedOp?.nodos?.filter(n => {
    if (filtroAcopio === 'ninguna') return false;
    return filtroAcopio === 'todos' || n.acopio.nombre === filtroAcopio;
  }) || [];

  const opcionesZonas = selectedOp ? [...new Set(selectedOp.nodos.map(n => n.zona))] : [];
  const opcionesAcopios = selectedOp ? [...new Set(selectedOp.nodos.map(n => n.acopio.nombre))] : [];

  // PANTALLA 1: LISTADO
  if (!selectedOp) {
    return (
      <div className="p-8 max-w-3xl mx-auto min-h-screen pt-16 bg-[#F4F4F4]">
        <button 
          onClick={() => navigate('/eventos')} 
          className="flex items-center gap-2 text-orange-600 font-black text-[11px] tracking-[0.2em] mb-10 uppercase italic transition-all hover:-translate-x-2"
        >
          <ArrowLeft size={18} strokeWidth={3} /> Volver al Inicio
        </button>
        <h2 className="text-4xl font-black text-[#1A2238] mb-8 uppercase italic tracking-tighter">Operaciones Activas</h2>
        <div className="grid gap-3">
          {operacionesLogistica.map(op => (
            <button key={op.id} onClick={() => setSelectedOp(op)} className={`w-full bg-white p-6 rounded-[2.5rem] border-2 ${borderStyle} shadow-sm hover:shadow-md flex justify-between items-center group transition-all`}>
              <div className="flex items-center gap-6">
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><Calendar size={22} /></div>
                <p className="font-black text-lg text-[#1A2238] uppercase italic">{op.nombre}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors"><ChevronRight size={20} /></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // PANTALLA 2: DETALLE
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#F4F4F4] relative">
      
      {/* MODAL FICHA TÉCNICA */}
      {personaSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-200 flex items-center justify-center p-4">
          <div className={`bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl border-2 ${borderStyle}`}>
            <div className="bg-[#0B1221] p-5 text-white flex justify-between items-center">
              <span className="font-black uppercase tracking-widest text-[9px] italic text-orange-500">Ficha Técnica</span>
              <button onClick={() => setPersonaSeleccionada(null)}><X size={18} /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="text-center border-b pb-5">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-3"><UserCheck size={32} /></div>
                <h3 className="text-2xl font-black text-[#1A2238] uppercase italic">{personaSeleccionada.nombre}</h3>
              </div>
              <InfoRow icon={<CreditCard size={16}/>} label="Documento" value={personaSeleccionada.id} />
              <InfoRow icon={<Phone size={16}/>} label="Contacto" value={personaSeleccionada.celular} />
              <InfoRow icon={<UserCog size={16}/>} label="Cargo / Rol" value={personaSeleccionada.rol} />
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
        <button onClick={() => setSelectedOp(null)} className="flex items-center gap-2 text-orange-600 font-black text-[11px] tracking-[0.2em] italic uppercase transition-all hover:-translate-x-2">
          <ArrowLeft size={16} strokeWidth={3} /> Operaciones
        </button>
        <div className="flex flex-wrap items-center gap-4">
          <FilterSelect border={borderStyle} label="ZONAS" value={filtroZona} onChange={setFiltroZona} options={opcionesZonas} allValue="todas" />
          <FilterSelect border={borderStyle} label="ACOPIOS" value={filtroAcopio} onChange={setFiltroAcopio} options={opcionesAcopios} allValue="todos" />
        </div>
      </div>

      {/* SECCIÓN ZONAS */}
      <div className="mb-10">
        <h3 className="text-xl font-black text-[#1A2238] mb-6 uppercase italic flex items-center gap-2">
          <Users className="text-orange-500" size={24} /> Personal por Zonas
        </h3>
        {zonasFiltradas.map((nodo, i) => (
          <div key={`zona-${i}`} className={`mb-4 overflow-hidden rounded-[2.5rem] shadow-sm border-2 ${borderStyle}`}>
            <button onClick={() => toggleZona(i)} className="w-full bg-[#0B1221] text-white px-8 py-4 flex items-center justify-between border-b-[5px] border-orange-600">
              <div className="flex items-center gap-3.5">
                <Layers className="text-orange-500" size={22} />
                <span className="font-black text-xl uppercase italic tracking-wider">{nodo.zona}</span>
              </div>
              {zonasAbiertas[i] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {zonasAbiertas[i] && (
              <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-left transition-all">
                <div className="space-y-3">
                  <p className="text-black font-black text-[10px] uppercase italic">Coordinador Zona</p>
                  <PersonCard persona={nodo.equipo.coordinador} onClick={setPersonaSeleccionada} isActive={personaSeleccionada?.id === nodo.equipo.coordinador.id} border={borderStyle} />
                </div>
                <div className="space-y-3">
                  <p className="text-black font-black text-[10px] uppercase italic">Supervisor Zona</p>
                  <PersonCard persona={nodo.equipo.supervisor} onClick={setPersonaSeleccionada} isActive={personaSeleccionada?.id === nodo.equipo.supervisor.id} border={borderStyle} />
                </div>
                <div className="bg-slate-50 p-5 rounded-[2.5rem]">
                  <p className="text-black font-black text-[10px] uppercase italic mb-3">Colaboradores</p>
                  {nodo.equipo.colaboradores.map((p, idx) => (
                    <button key={idx} onClick={() => setPersonaSeleccionada(p)} className={`w-full p-3 rounded-full text-[10px] font-black shadow-sm mb-1.5 flex justify-between items-center italic uppercase transition-all border-2 ${personaSeleccionada?.id === p.id ? 'bg-orange-600 text-white border-orange-600' : `bg-white text-slate-700 ${borderStyle} hover:shadow-md`}`}>
                      {p.nombre} <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SECCIÓN ACOPIOS */}
      <div className="mt-16">
        <h3 className="text-xl font-black text-[#1A2238] mb-6 uppercase italic flex items-center gap-2">
          <Box className="text-blue-600" size={24} /> Detalle de Acopios
        </h3>
        {acopiosFiltrados.map((nodo, i) => (
          <div key={`acopio-${i}`} className={`mb-4 overflow-hidden rounded-[2.5rem] shadow-sm bg-white border-2 ${borderStyle}`}>
            <button onClick={() => toggleAcopio(i)} className="w-full bg-[#0B1221] text-white px-8 py-5 flex items-center justify-between border-b-[5px] border-blue-600">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center"><Trash2 size={20} /></div>
                <div>
                  <span className="font-black text-xl uppercase italic tracking-wider block leading-none">{nodo.acopio.nombre}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic mt-1 block">{nodo.acopio.direccion}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/50 uppercase font-black italic text-[10px]">
                {acopiosAbiertos[i] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </div>
            </button>

            {acopiosAbiertos[i] && (
              <div className="p-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <MetricCard 
                    label="Residuos / Basura" 
                    actual={nodo.acopio.basurasActuales} 
                    limite={nodo.acopio.basurasLimite} 
                    porcentaje={nodo.acopio.basurasPorcentaje}
                    color="blue"
                  />
                  <MetricCard 
                    label="Capacidad General" 
                    actual={nodo.acopio.actuales} 
                    limite={nodo.acopio.limite} 
                    porcentaje={nodo.acopio.llenado}
                    color="slate"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                  <div>
                    <p className="text-black font-black text-[10px] uppercase italic mb-3">Coordinador Acopio</p>
                    <PersonCard persona={nodo.acopio.equipo.coordinador} onClick={setPersonaSeleccionada} isActive={personaSeleccionada?.id === nodo.acopio.equipo.coordinador.id} border={borderStyle} />
                  </div>
                  <div>
                    <p className="text-black font-black text-[10px] uppercase italic mb-3">Supervisor Acopio</p>
                    <PersonCard persona={nodo.acopio.equipo.supervisor} onClick={setPersonaSeleccionada} isActive={personaSeleccionada?.id === nodo.acopio.equipo.supervisor.id} border={borderStyle} />
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[2.5rem]">
                    <p className="text-black font-black text-[10px] uppercase italic mb-3">Colaboradores</p>
                    {nodo.acopio.equipo.colaboradores.map((p, idx) => (
                      <button key={idx} onClick={() => setPersonaSeleccionada(p)} className="w-full p-3 rounded-full text-[10px] font-black shadow-sm mb-1.5 flex justify-between items-center bg-white border-2 border-[#FAD9C1] italic uppercase">
                        {p.nombre} <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// COMPONENTES AUXILIARES REDISEÑADOS
const MetricCard = ({ label, actual, limite, porcentaje, color }) => {
  // Calculamos la circunferencia para el anillo (Radio 36)
  const strokeDashoffset = 226 - (226 * porcentaje) / 100;
  const isCritical = porcentaje > 80;

  return (
    <div className={`bg-white p-6 rounded-[2.5rem] border-2 shadow-sm flex items-center gap-6 transition-all hover:shadow-md ${isCritical ? 'border-red-100' : 'border-slate-100'}`}>
      {/* Indicador Circular */}
      <div className="relative shrink-0 w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48" cy="48" r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="48" cy="48" r="36"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray="226"
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            className={`${isCritical ? 'text-red-500' : color === 'blue' ? 'text-blue-600' : 'text-slate-800'}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-black italic ${isCritical ? 'text-red-600' : 'text-slate-800'}`}>
            {porcentaje}%
          </span>
        </div>
      </div>

      {/* Datos */}
      <div className="text-left flex-1">
        <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest block mb-1">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-black italic tracking-tighter ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>
            {actual}
          </span>
          <span className="text-slate-400 font-bold italic text-base">
            / {limite}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[9px] font-black uppercase text-slate-500 italic">
            {isCritical ? 'Alerta de Llenado' : 'Operación Estable'}
          </span>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
    <div className="text-orange-500">{icon}</div>
    <div className="flex flex-col items-start text-left">
      <span className="text-[8px] font-black text-slate-400 uppercase italic">{label}</span>
      <span className="font-black text-[12px] uppercase italic text-slate-900">{value}</span>
    </div>
  </div>
);

const FilterSelect = ({ label, value, onChange, options, allValue, border }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative z-100">
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center justify-between bg-white border-2 ${border} rounded-full px-8 py-4 min-w-50 shadow-sm`}>
        <span className="text-[11px] font-black italic uppercase text-slate-700">{value === allValue ? `TODAS LAS ${label}` : value}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className={`absolute top-full mt-2 w-full bg-white border-2 ${border} rounded-4xl shadow-xl z-110 p-2`}>
          <button onClick={() => { onChange(allValue); setIsOpen(false); }} className="w-full text-left px-6 py-3 rounded-full text-[10px] font-black uppercase italic hover:bg-slate-50">TODAS</button>
          {options.map((opt, i) => (
            <button key={i} onClick={() => { onChange(opt); setIsOpen(false); }} className="w-full text-left px-6 py-3 rounded-full text-[10px] font-black uppercase italic hover:bg-orange-50">{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZonasGestionDetalle;
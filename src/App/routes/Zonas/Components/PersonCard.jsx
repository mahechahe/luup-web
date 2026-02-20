export const PersonCard = ({ persona, onClick, isActive, border }) => (
  <button onClick={() => onClick(persona)} className={`w-full p-4 rounded-3xl border-2 transition-all flex flex-col items-start ${isActive ? 'border-orange-600 bg-white shadow-md' : `bg-white ${border} hover:border-orange-400`}`}>
    <span className={`font-black text-[13px] uppercase italic ${isActive ? 'text-orange-600' : 'text-[#1A2238]'}`}>{persona.nombre}</span>
    <span className="text-[9px] text-slate-400 font-black italic">{persona.id}</span>
  </button>
);
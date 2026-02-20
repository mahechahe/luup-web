export const MenuCard = ({ icon, title, badge, desc, color, onClick }) => (
  <button onClick={onClick} className="group bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-[#FAD9C1] shadow-sm flex flex-col items-center transition-all hover:scale-[1.02] w-full">
    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-white ${color === 'orange' ? 'bg-orange-500' : 'bg-blue-600'}`}>{icon}</div>
    <h2 className="text-3xl font-black text-[#1A2238] mb-2 italic uppercase">{title}</h2>
    <div className={`px-5 py-1.5 rounded-full mb-5 ${color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}><span className="text-[9px] font-black uppercase italic">{badge}</span></div>
    <p className="text-slate-500 text-center text-sm font-bold italic">{desc}</p>
  </button>
);
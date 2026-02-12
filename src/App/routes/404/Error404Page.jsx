import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function Error404Page() {
  const [mounted, setMounted] = useState(false);

  // Para asegurar que las animaciones se ejecuten después de montar el componente
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Contenido principal */}
      <div className="max-w-md w-full text-center">
        {/* Número 404 con animación */}
        <div className="relative mb-8">
          <h1
            className={`text-[10rem] font-bold text-gray-100 leading-none transition-all duration-700 ${
              mounted ? 'opacity-100' : 'opacity-0 translate-y-8'
            }`}
          >
            404
          </h1>
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 delay-300 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-24 h-24 rounded-full bg-[#3377f5]/5 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#3377f5]/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#3377f5]/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-[#3377f5]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        <h2
          className={`text-2xl font-bold text-gray-900 mb-3 transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100' : 'opacity-0 translate-y-4'
          }`}
        >
          Página no encontrada
        </h2>
        <p
          className={`text-gray-600 mb-8 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100' : 'opacity-0 translate-y-4'
          }`}
        >
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        {/* Botones */}
        <div
          className={`mt-5 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100' : 'opacity-0 translate-y-4'
          }`}
        >
          <Button
            asChild
            className="bg-[#3377f5] hover:bg-[#3377f5]/90 text-white px-8 h-12 rounded-full"
          >
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Ir al dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Elementos decorativos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Círculos decorativos */}
        <div
          className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full border border-gray-100 transition-all duration-1000 ${
            mounted ? 'opacity-100' : 'opacity-0 scale-50'
          }`}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full border border-gray-100 transition-all duration-1000 delay-300 ${
            mounted ? 'opacity-100' : 'opacity-0 scale-50'
          }`}
        />

        {/* Puntos decorativos */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-[#3377f5]/10 transition-all duration-1000 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${15 + Math.random() * 70}%`,
              transitionDelay: `${300 + i * 100}ms`,
            }}
          />
        ))}
      </div>

      {/* Footer minimalista */}
      <div
        className={`absolute bottom-6 text-center text-sm text-gray-400 transition-all duration-700 delay-500 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p>© 2025 NUVANA. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

export default Error404Page;

import { Shield } from 'lucide-react';

function LoaderFullScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #3377f5 2px, transparent 0)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center space-y-8 p-8 max-w-md w-full mx-4">
        {/* Loader Animation */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-24 h-24 rounded-full border-4 border-gray-100" />

          {/* Inner rotating ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-[#3377f5] animate-spin" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#3377f5]/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#3377f5] animate-pulse" />
            </div>
          </div>

          {/* Pulsing dots around */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 relative">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-[#3377f5] rounded-full animate-ping"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${
                      i * 60
                    }deg) translateY(-60px) translateX(-50%)`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Security message */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Verificando token...
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Verificando credenciales de forma segura...
          </p>
          <div className="flex items-center justify-center mt-2 space-x-1">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Conexión segura SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoaderFullScreen;

import { yupResolver } from '@hookform/resolvers/yup';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { CustomButton } from '@/app/components/CustomButton/CustomButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { version } from '../../../../package.json';
import { INIT_LOADER } from '@/App/utils/constants/utilsConstants';
import { submitLoginService } from '@/App/auth/services/authService';

const INIT_LOGIN = {
  email: '',
  password: '',
};

const schema = yup.object({
  email: yup
    .string()
    .required('El correo es requerido')
    .email('Correo no válido')
    .min(2, 'Al menos dos caracteres')
    .max(40, 'Menos de 40 caracteres'),

  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(5, 'Mínimo 5 caracteres')
    .max(50, 'Máximo 50 caracteres'),
});

const TYPES = {
  SUBMIT_LOGIN: 'SUBMIT_LOGIN',
};

function LoginPage() {
  /* Config */
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(INIT_LOADER);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: INIT_LOGIN,
    resolver: yupResolver(schema),
  });

  const handleLogin = handleSubmit(async (data) => {
    setLoading({
      status: true,
      type: TYPES.SUBMIT_LOGIN,
    });

    const body = {
      email: data.email,
      password: data.password,
    };

    const res = await submitLoginService(body);

    if (res.status) {
      window.ReactNativeWebView.postMessage(JSON.stringify(res));
      navigate('/dashboard');
    } else {
      setError('email', {
        type: 'manual',
        message: res.errors,
      });
      setError('password', {
        type: 'manual',
        message: res.errors,
      });
    }

    setLoading(INIT_LOADER);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand/5 via-background to-brand/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-md">
                <span className="text-brand-foreground font-semibold text-3xl tracking-tight select-none">
                  L
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-1">
              LUUP
            </h1>
            <p className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
              Logística &amp; Control de Eventos
            </p>
            <p className="text-muted-foreground text-sm">
              Bienvenido de vuelta
            </p>
          </div>

          {/* <Button
            onClick={() => {}}
            variant="outline"
            className="w-full mb-6 h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </Button> */}

          {/* <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                o continúa con email
              </span>
            </div>
          </div> */}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-10 h-12 border-border focus:border-brand focus:ring-brand"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-error absolute -bottom-5">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 h-12 border-border focus:border-brand focus:ring-brand"
                  {...register('password')}
                  required
                />
                {errors.password && (
                  <p className="text-sm text-error absolute -bottom-5">
                    {errors.password.message}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked)}
                  className="border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Recordarme
                </Label>
              </div>
            </div>

            <div className="w-full">
              <CustomButton
                disabled={loading.status && loading.type === TYPES.SUBMIT_LOGIN}
                label={`${
                  loading.status && loading.type === TYPES.SUBMIT_LOGIN
                    ? 'Iniciando sesión...'
                    : 'Iniciar sesión'
                }`}
                loading={loading.status && loading.type === TYPES.SUBMIT_LOGIN}
                typeButton="submit"
                icon={
                  <LogIn
                    className="ml-2"
                    style={{
                      width: '20px',
                      height: '20px',
                    }}
                  />
                }
              />
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs ">Versión {version}</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

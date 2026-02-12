import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LoaderFullScreen from '../components/LoaderFullScreen/LoaderFullScreen';
import JwtService from './services/jwtService';
import { closeSesion } from './services/authService';
import { useUserStore } from '../context/userStore';

function Auth({ children }) {
  /* State */
  const [waitAuthCheck, setWaitAuthCheck] = useState(true);

  /* UseEffect */
  useEffect(() => {
    async function checkAuth() {
      await Promise.all([jwtCheck()]).then(() => {
        setWaitAuthCheck(false);
      });
    }

    checkAuth();
  }, []);

  const deleteSessionAuth = (message) => {
    if (message) {
      toast.error(message);
    }

    closeSesion();
    window.location.pathname = '/iniciar-sesion';
  };

  const jwtCheck = async () => {
    return new Promise((resolve) => {
      JwtService.on('onAutoLogin', () => {
        JwtService.signInWithToken()
          .then((user) => {
            useUserStore.getState().setUser(user);
            useUserStore.getState().setUserIsLogin(true);

            resolve();
          })
          .catch((error) => {
            toast.error(
              error.message ||
                'El inicio de sesión con token ha fallado. Por favor, ingresa otro nuevamente.'
            );
            resolve();
          });
      });

      JwtService.on('onAutoLogout', (message) => {
        deleteSessionAuth(message);
        JwtService.logout();

        resolve();
      });

      JwtService.on('onNoAccessToken', () => {
        resolve();
      });

      JwtService.init();
    });
  };

  return waitAuthCheck ? <LoaderFullScreen /> : <>{children}</>;
}

export default Auth;

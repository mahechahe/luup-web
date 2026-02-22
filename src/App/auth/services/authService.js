import { useUserStore } from '@/App/context/userStore';
import jwtService from './jwtService';

/* Functions dispatch */

export const submitLoginService = async (body) => {
  try {
    const data = await jwtService.signInWithEmailAndPassword(body);
    const datauser = data.data;

    console.log('datauser', datauser);

    useUserStore.getState().setUser(datauser);
    useUserStore.getState().setUserIsLogin(true);
    return {
      status: true,
      errors: null,
      response: data,
    };
  } catch (errors) {
    return {
      status: false,
      errors,
    };
  }
};

/* Seteadores states */

export const closeSesion = () => {
  useUserStore.getState().setUser(null);
  useUserStore.getState().setUserIsLogin(false);

  /* Limpio todos los stores */

  jwtService.setSession(null);
};

/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable class-methods-use-this */
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import FuseUtils from '@/app/utils/fuse/utils';
import { constants } from '@/app/utils/constants/apiConstants';

const regularExpressionAuth = /auth/;

class JwtService extends FuseUtils.EventEmitter {
  init() {
    this.setInterceptors();
    this.handleAuthentication();
  }

  /* Este servicio se ejecuta cuando se detecta un llamado a la API con axios, lo que hace es verificar si alguna peticion al E.P retormna 401 (Usuario no autrizado) en caso de que si cierra la sesion */
  setInterceptors = () => {
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (err) => {
        return new Promise(() => {
          if (
            err?.response?.status === 401 &&
            err?.config &&
            !err?.config?.__isRetryRequest
          ) {
            // if you ever get an unauthorized response, logout the user

            // TODO: if token expired call refreshToken

            /* Si el endpoint es auth no emite onAutoLogout */
            if (!regularExpressionAuth.test(err?.request?.responseURL)) {
              this.emit('onAutoLogout', err?.response?.data?.message);
            }

            this.setSession(null);
          }
          throw err;
        });
      }
    );
  };

  /* Este servicio valida si existe un token guardado en la sesion, si no existe, emite onNoAccessToken */
  handleAuthentication = () => {
    const access_token = this.getAccessToken();

    if (!access_token) {
      this.emit('onNoAccessToken');

      return;
    }

    if (this.isAuthTokenValid(access_token)) {
      this.setSession(access_token);
      this.emit('onAutoLogin', true);
    } else {
      this.setSession(null);
      this.emit('onAutoLogout', 'Error autenticando usuario');
    }
  };

  /* Esta función se encarga de gestionar el token de acceso en la sesión del navegador. Almacena el token en sessionStorage cuando está presente y configura el encabezado de autorización en Axios para incluir el token. Cuando el token no está presente, elimina el token almacenado y elimina la configuración del encabezado de autorización en Axios */
  setSession = (access_token) => {
    if (access_token) {
      sessionStorage.setItem('jwt_access_token', access_token);
      axios.defaults.headers.common.Authorization = `Bearer ${access_token}`;
    } else {
      sessionStorage.removeItem('jwt_access_token');
      delete axios.defaults.headers.common.Authorization;
    }
  };

  logout = () => {
    this.setSession(null);
  };

  signInWithToken = () => {
    return new Promise((resolve, reject) => {
      const URL = `${constants.BASE_URL}/${constants.ENDPOINTS.AUTH}/jwt`;
      axios
        .get(URL, {
          data: {
            access_token: this.getAccessToken(),
          },
        })
        .then((response) => {
          if (response.status === 200) {
            this.setSession(response.data.token);
            resolve(response.data.data);
          } else {
            this.logout();
            reject(
              new Error(
                'El inicio de sesión con token ha fallado. Por favor, ingresa otro nuevamente.'
              )
            );
          }
        })
        .catch(() => {
          this.logout();
          reject(
            new Error(
              'El inicio de sesión con token ha fallado. Por favor, ingresa otro nuevamente.'
            )
          );
        });
    });
  };

  /* Este servicio devuelve el token guardado en la sesion storage siempre y cuando este */
  getAccessToken = () => {
    return sessionStorage.getItem('jwt_access_token');
  };

  /* Esta función verifica si un token JWT proporcionado es válido. Devuelve false si el token no está presente, ha expirado o si hay algún problema en el proceso de decodificación. Devuelve true si el token está presente y no ha expirado.
   */
  isAuthTokenValid = (token) => {
    if (!token) {
      return false;
    }
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      console.warn('Token de acceso expirado');
      return false;
    }

    return true;
  };

  /* Iniciar sesion con email y password */
  signInWithEmailAndPassword = (body) => {
    return new Promise((resolve, reject) => {
      const URL = `${constants.BASE_URL}/${constants.ENDPOINTS.AUTH}/login`;
      axios
        .post(URL, body)
        .then((response) => {
          if (response.status === 200) {
            this.setSession(response.data.token);
            resolve(response.data);
          } else {
            reject(response.data);
          }
        })
        .catch((error) => {
          const errorResponse =
            error?.response?.data?.message ||
            'Lo sentimos, el recurso solicitado no está disponible';

          reject(errorResponse);
        });
    });
  };
}

const instance = new JwtService();
export default instance;

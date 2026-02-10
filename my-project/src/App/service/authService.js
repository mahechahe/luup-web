import api from "@/lib/axios";

export const authService = {
  login: async (email, password) => {
    // Si tu backend no usa el prefijo /api, esta ruta llamará a http://localhost:3000/login
    const response = await api.post("/login", { email, password });
    return response.data;
  },
};
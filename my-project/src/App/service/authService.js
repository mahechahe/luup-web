import axios from 'axios';
const API_URL = "http://localhost:3000/api/v1";

export const loginRequest = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data; 
  } catch (error) {
    throw error;
  }
};

// Nueva función para enviar los datos de la tabla de registro
export const registerRequest = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
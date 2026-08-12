import axios from 'axios';

export const api = axios.create({
  // A API do BaaS expõe todas as rotas sob o prefixo /api (setGlobalPrefix no main.ts do backend).
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  // A sessão vive num cookie httpOnly setado pelo backend (POST /auth/login|register);
  // o token nunca fica acessível ao JS, então cada request precisa enviar o cookie.
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

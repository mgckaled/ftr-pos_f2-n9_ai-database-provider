/**
 * Configuração do cliente Axios
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de resposta para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erro com resposta do servidor
      console.error('API Error:', error.response.data)
    } else if (error.request) {
      // Erro de rede
      console.error('Network Error:', error.message)
    } else {
      // Erro na configuração da requisição
      console.error('Request Error:', error.message)
    }
    return Promise.reject(error)
  },
)
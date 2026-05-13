// src/api/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Interceptor de respuesta — manejo global de errores
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('pander_session')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)
const SESSION_KEY = 'pander_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Login: el backend devuelve módulos del rol ──────────────
  const login = useCallback(async (loginVal, pwd) => {
    setLoading(true); setError(null)
    try {
      const res = await api.post('/api/acceso/auth/login/', {
        login: loginVal.trim(), pwd, compania: 1,
      })
      const session = res.data
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      return session
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Error al iniciar sesión.'
      setError(msg); throw new Error(msg)
    } finally { setLoading(false) }
  }, [])

  // ── Cambio de compañía (solo superusuarios) ─────────────────
  const cambiarCompania = useCallback(async (companiaId) => {
    if (!user?.ind_super_usuario) return
    try {
      const res = await api.post('/api/acceso/auth/cambiar-compania/', {
        usuario_id: user.id, compania_id: companiaId,
      })
      const nuevaSesion = res.data
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nuevaSesion))
      setUser(nuevaSesion)
      return nuevaSesion
    } catch (err) {
      throw new Error(err?.response?.data?.detail || 'Error al cambiar compañía.')
    }
  }, [user])

  // ── Logout ──────────────────────────────────────────────────
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null); setError(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, cambiarCompania }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

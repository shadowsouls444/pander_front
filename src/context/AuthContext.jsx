// src/context/AuthContext.jsx
// ══════════════════════════════════════════════
// Contexto global de autenticación.
// Almacena el usuario en sessionStorage para que
// la sesión persista mientras el tab esté abierto,
// pero se cierre al cerrar el navegador.
// ══════════════════════════════════════════════
import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

const SESSION_KEY = 'pander_session'

export function AuthProvider({ children }) {
  // Rehidratar sesión del sessionStorage al montar
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── login ──────────────────────────────────────
  // El backend no tiene JWT todavía; usamos el endpoint
  // de usuarios por compañía y validamos login/pwd.
  // compania=1 es la compañía del sistema (NIT 00000).
  const login = useCallback(async (login, pwd) => {
    setLoading(true)
    setError(null)
    try {
      // Buscar usuario en compañía 1 (sistema)
      const res = await api.get('/api/acceso/companias/1/usuarios/')
      const usuarios = res.data

      // Buscar por login (case-insensitive)
      const match = usuarios.find(
        u => u.login.toLowerCase() === login.toLowerCase()
      )

      if (!match) {
        throw new Error('Usuario o contraseña incorrectos.')
      }

      // Validar contraseña — el backend almacena SHA-256 en hex
      // En producción esto debe hacerse en el servidor con un endpoint /auth/login
      // Por ahora comparamos el hash SHA-256 del pwd ingresado
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(pwd)
      )
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      if (match.pwd && match.pwd !== hashHex) {
        // Si el backend devuelve el pwd (no debería en producción)
        throw new Error('Usuario o contraseña incorrectos.')
      }

      // Verificar que está activo y no bloqueado
      if (!match.ind_activo) {
        throw new Error('Tu cuenta está inactiva. Contacta al administrador.')
      }
      if (match.ind_bloqueo) {
        throw new Error('Tu cuenta está bloqueada. Contacta al administrador.')
      }

      // Guardar sesión
      const session = {
        id:              match.id,
        compania:        match.compania,
        login:           match.login,
        email:           match.email,
        rol:             match.rol,
        rol_descripcion: match.rol_descripcion,
        ind_super:       match.ind_super_usuario,
        nombre:          match.analista_nombre_completo || match.login,
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      return session
    } catch (err) {
      const msg = err.message || 'Error al iniciar sesión.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── logout ─────────────────────────────────────
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
    setError(null)
  }, [])

  const value = { user, loading, error, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook de uso rápido
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

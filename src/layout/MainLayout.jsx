// src/layout/MainLayout.jsx
import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import styles from '../components/layout/Layout.module.css'

const ROUTE_LABELS = {
  '/':                     'Dashboard',
  '/gestion-compania':     'Gestión de Compañías',
  '/gestion-analistas':    'Gestión de Analistas',
  '/gestion-usuarios':     'Gestión de Usuarios',
  '/gestion-modulos':      'Gestión de Módulos',
  '/gestion-vacantes':     'Gestión de Vacantes',
  '/gestion-candidatos':   'Gestión de Candidatos',
  '/gestion-postulaciones':'Gestión de Postulaciones',
  '/evaluacion':           'Evaluaciones',
}

export default function MainLayout() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(new Date())

  // Protección de ruta — redirige al login si no hay sesión
  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  // Reloj en topbar
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!user) return null

  const pageLabel = ROUTE_LABELS[location.pathname] || 'Pander'

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className={styles.content}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarBreadcrumb}>
              🏠 Pander › <strong>{pageLabel}</strong>
            </span>
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.topbarTime}>
              {time.toLocaleDateString('es-CO', { weekday:'short', day:'numeric', month:'short' })}
            </span>
          </div>
        </header>

        {/* Contenido de la ruta activa */}
        <main className={styles.page}>
          <Outlet />
        </main>

        <footer className={styles.footer}>
          © 2026 Pander RRHH · Sistema de Gestión de Talento Humano
        </footer>
      </div>
    </div>
  )
}

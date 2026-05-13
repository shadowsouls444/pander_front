// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { to: '/',                    icon: '🏠', label: 'Dashboard'       },
  { to: '/gestion-compania',    icon: '🏢', label: 'Compañías'       },
  { to: '/gestion-analistas',   icon: '👔', label: 'Analistas'       },
  { to: '/gestion-usuarios',    icon: '👤', label: 'Usuarios'        },
  { to: '/gestion-modulos',     icon: '🧩', label: 'Módulos'         },
  { to: '/gestion-vacantes',    icon: '💼', label: 'Vacantes'        },
  { to: '/gestion-candidatos',  icon: '🧑‍💼', label: 'Candidatos'      },
  { to: '/gestion-postulaciones',icon:'📋', label: 'Postulaciones'   },
  { to: '/evaluacion',          icon: '📊', label: 'Evaluaciones'    },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <span className={styles.logoIcon}>🎯</span>
        {!collapsed && <span className={styles.logoText}>Pander</span>}
        <button className={styles.collapseBtn} onClick={onToggle} title={collapsed ? 'Expandir' : 'Colapsar'}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Usuario actual */}
      {!collapsed && user && (
        <div className={styles.userChip}>
          <div className={styles.userAvatar}>{(user.nombre || user.login)[0].toUpperCase()}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.nombre || user.login}</span>
            <span className={styles.userRole}>{user.rol_descripcion || 'Usuario'}</span>
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          <span>🚪</span>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}

// src/layout/MainLayout.jsx  — v6
// FIX #5a: Nodo padre con hijos SÍ es navegable (NavLink + botón toggle separado)
// FIX #5b: Dashboard NO está hardcodeado — aparece solo si está en user.modulos
// FIX #5c: Breadcrumb lee la descripción del módulo actual desde la sesión
// FIX #5d: Icono/nombre se toman exclusivamente de la BD; ICON_FALLBACK
//           es solo para rutas sin icono en la BD (no items quemados)
import { useState, useEffect, useMemo, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import styles from '../components/layout/Layout.module.css'

// Solo fallback visual cuando la BD devuelve icono vacío
const ICON_FALLBACK = {
  '/':                      '🏠',
  '/gestion-compania':      '🏢',
  '/gestion-unidades':      '🏗️',
  '/gestion-roles':         '🔑',
  '/gestion-analistas':     '👔',
  '/gestion-usuarios':      '👤',
  '/gestion-modulos':       '🧩',
  '/gestion-vacantes':      '💼',
  '/gestion-candidatos':    '🧑‍💼',
  '/gestion-postulaciones': '📋',
  '/gestion-evaluaciones':  '⚙️',
  '/evaluacion':            '📊',
}

function buildTree(modulos) {
  const map = {}
  const roots = []
  modulos.forEach(m => { map[m.id] = { ...m, hijos: [] } })
  modulos.forEach(m => {
    if (m.modulo_padre && map[m.modulo_padre]) {
      map[m.modulo_padre].hijos.push(map[m.id])
    } else {
      roots.push(map[m.id])
    }
  })
  return roots
}

// ── Nodo de menú — FIX #5a ───────────────────────────────────
// Si tiene hijos Y ruta válida: NavLink navega + botón aparte expande.
// Si tiene hijos SIN ruta (solo agrupa): solo botón expand.
function NavNode({ nodo, collapsed, nivel = 0 }) {
  const [open, setOpen] = useState(false)
  const tieneHijos = (nodo.hijos?.length ?? 0) > 0
  const icono = nodo.icono || ICON_FALLBACK[nodo.nombre_aplicacion] || '📄'
  const ruta  = nodo.nombre_aplicacion || '#'
  const indent = nivel > 0 ? `${12 + nivel * 12}px` : undefined

  if (tieneHijos) {
    const esNavegable = ruta !== '#'
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {esNavegable ? (
            <NavLink
              to={ruta}
              end={ruta === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              style={{ flex: 1, paddingLeft: indent }}
              title={collapsed ? nodo.descripcion : undefined}
            >
              <span className={styles.navIcon}>{icono}</span>
              {!collapsed && <span className={styles.navLabel}>{nodo.descripcion}</span>}
            </NavLink>
          ) : (
            <button
              className={styles.navItem}
              style={{ flex: 1, paddingLeft: indent, textAlign: 'left' }}
              title={collapsed ? nodo.descripcion : undefined}
              onClick={() => setOpen(o => !o)}
            >
              <span className={styles.navIcon}>{icono}</span>
              {!collapsed && <span className={styles.navLabel}>{nodo.descripcion}</span>}
            </button>
          )}
          {/* Botón de expand/collapse — separado del NavLink */}
          {!collapsed && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,.6)', padding: '0 10px',
                fontSize: '.65rem', flexShrink: 0,
              }}
            >
              {open ? '▲' : '▼'}
            </button>
          )}
        </div>

        {open && !collapsed && (
          <div style={{ borderLeft: '2px solid rgba(255,255,255,.1)', marginLeft: 20 }}>
            {nodo.hijos.map(h => (
              <NavNode key={h.id} nodo={h} collapsed={collapsed} nivel={nivel + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Nodo hoja
  return (
    <NavLink
      to={ruta}
      end={ruta === '/'}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
      }
      title={collapsed ? nodo.descripcion : undefined}
      style={{ paddingLeft: indent }}
    >
      <span className={styles.navIcon}>{icono}</span>
      {!collapsed && <span className={styles.navLabel}>{nodo.descripcion}</span>}
    </NavLink>
  )
}

// ── Selector de compañía (superusuarios) ─────────────────────
function SelectorCompania({ onClose }) {
  const { user, cambiarCompania } = useAuth()
  const navigate  = useNavigate()
  const [query, setQuery]       = useState('')
  const [lista, setLista]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [cambiando, setCambiando] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    api.get('/api/acceso/auth/mis-companias/', {
      params: { usuario_id: user.id, q: '' }
    }).then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [user.id])

  const filtradas = useMemo(() => {
    if (!query.trim()) return lista
    return lista.filter(c =>
      c.descripcion.toLowerCase().includes(query.toLowerCase()))
  }, [lista, query])

  const seleccionar = async (cid) => {
    if (cid === user.compania) { onClose(); return }
    setCambiando(cid)
    try {
      await cambiarCompania(cid)
      onClose(); navigate('/')
    } catch (e) { alert(e.message) }
    finally { setCambiando(null) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,.25)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: 'var(--primary)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>
              🏢 Seleccionar Compañía
            </div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.8rem', marginTop: 2 }}>
              En sesión: <strong style={{ color: '#fff' }}>{user.compania_nombre}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none',
            color: '#fff', width: 30, height: 30, borderRadius: '50%',
            cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
        <div style={{ padding: '16px 24px 8px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', fontSize: '.9rem' }}>🔍</span>
            <input ref={inputRef} value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre de compañía..."
              style={{ width: '100%', padding: '10px 12px 10px 36px',
                border: '1.5px solid var(--border)', borderRadius: 8,
                fontFamily: 'var(--font)', fontSize: '.9rem', outline: 'none' }} />
          </div>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 24px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
              Cargando...
            </div>
          ) : !filtradas.length ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
              Sin resultados.
            </div>
          ) : filtradas.map(c => (
            <button key={c.id} onClick={() => seleccionar(c.id)}
              disabled={!!cambiando}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, marginBottom: 6,
                border: `2px solid ${c.id === user.compania ? 'var(--primary)' : 'var(--border)'}`,
                background: c.id === user.compania ? 'var(--primary-bg)' : 'var(--bg)',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: 'var(--font)', transition: 'all .15s',
                opacity: cambiando && cambiando !== c.id ? .5 : 1,
              }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text-h)' }}>
                  {c.descripcion}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>NIT: {c.nit}</div>
              </div>
              {c.id === user.compania
                ? <span style={{ fontSize: '.78rem', color: 'var(--primary)', fontWeight: 700 }}>✓ Actual</span>
                : cambiando === c.id
                  ? <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Cambiando...</span>
                  : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════════════════════════════
export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [collapsed, setCollapsed]       = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!user) return null

  // FIX #5b: menú construido 100% desde user.modulos (BD)
  // Dashboard solo aparece si está asignado al rol del usuario
  const modulosMenu = useMemo(
    () => buildTree(user?.modulos ?? []),
    [user?.modulos]
  )

  // FIX #5c: breadcrumb desde el módulo actual en la sesión
  const pageLabel = useMemo(() => {
    const mod = (user?.modulos ?? []).find(
      m => m.nombre_aplicacion === location.pathname
    )
    return mod?.descripcion || location.pathname.replace('/', '').replace(/-/g, ' ') || 'Pander'
  }, [location.pathname, user?.modulos])

  const handleLogout = () => {
    logout(); navigate('/login', { replace: true })
  }

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoIcon}>🎯</span>
          {!collapsed && <span className={styles.logoText}>Pander</span>}
          <button className={styles.collapseBtn}
            onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {!collapsed && (
          <div className={styles.userChip}>
            <div className={styles.userAvatar}>
              {(user.nombre || user.login)[0].toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.nombre || user.login}</span>
              <span className={styles.userRole}>{user.rol_descripcion || 'Usuario'}</span>
            </div>
          </div>
        )}

        {/* FIX #5b: menú 100% desde BD, sin items quemados */}
        <nav className={styles.nav}>
          {modulosMenu.length === 0 ? (
            !collapsed && (
              <div style={{ padding: '12px 16px', color: 'rgba(255,255,255,.5)', fontSize: '.8rem' }}>
                Sin módulos asignados
              </div>
            )
          ) : (
            modulosMenu.map(nodo => (
              <NavNode key={nodo.id} nodo={nodo} collapsed={collapsed} />
            ))
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>🚪</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            {/* FIX #5c: breadcrumb dinámico desde módulos */}
            <span className={styles.topbarBreadcrumb}>
              🏠 Pander › <strong>{pageLabel}</strong>
            </span>
          </div>
          <div className={styles.topbarRight}>
            <span style={{
              padding: '4px 12px', borderRadius: 99,
              background: 'var(--primary-bg)', color: 'var(--primary)',
              fontSize: '.8rem', fontWeight: 600, border: '1px solid var(--primary-border)',
            }}>
              🏢 {user.compania_nombre || `Compañía #${user.compania}`}
            </span>

            {user.ind_super_usuario && (
              <button onClick={() => setSelectorOpen(true)} style={{
                padding: '6px 14px', borderRadius: 99, border: 'none',
                background: 'var(--primary)', color: '#fff',
                fontFamily: 'var(--font)', fontSize: '.82rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🔄 Seleccionar Compañía
              </button>
            )}

            <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
              {time.toLocaleDateString('es-CO', {
                weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </header>

        <main className={styles.page}>
          <Outlet />
        </main>

        <footer className={styles.footer}>
          © 2026 Pander RRHH · Sistema de Gestión de Talento Humano
        </footer>
      </div>

      {selectorOpen && (
        <SelectorCompania onClose={() => setSelectorOpen(false)} />
      )}
    </div>
  )
}

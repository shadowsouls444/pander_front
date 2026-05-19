// src/pages/Login/Login.jsx — con enlace a olvido de contraseña
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Login.module.css'
import logo from '../../assets/logo.png'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]   = useState({ login: '', pwd: '' })
  const [error, setError] = useState(null)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    if (!form.login.trim() || !form.pwd.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }
    try {
      await login(form.login.trim(), form.pwd)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />

      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src={logo} alt="Logo" className={styles.logoIcon}/>
            <span className={styles.logoText}>Pander</span>
          </div>
          <p className={styles.tagline}>Sistema de Gestión de Talento Humano</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLeft}>
            <h2 className={styles.cardTitle}>Inicio de Sesión</h2>
            <p className={styles.cardSubtitle}>Ingresa tus credenciales para acceder al sistema</p>

            {error && (
              <div className={styles.errorBanner}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login">Usuario</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>👤</span>
                  <input
                    id="login" name="login" type="text"
                    className={styles.input} placeholder="Ej: admin"
                    value={form.login} onChange={handleChange}
                    autoFocus autoComplete="username"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="pwd">Contraseña</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>🔒</span>
                  <input
                    id="pwd" name="pwd" type="password"
                    className={styles.input} placeholder="••••••••"
                    value={form.pwd} onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading
                  ? <><span className={styles.btnSpinner} /> Verificando...</>
                  : 'Iniciar Sesión'
                }
              </button>
            </form>

            {/* Enlace a olvido de contraseña */}
            <p style={{ textAlign:'center', marginTop:16, fontSize:'.83rem' }}>
              <Link
                to="/forgot-password"
                style={{ color:'var(--primary)', fontWeight:600, textDecoration:'underline' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>

            <p className={styles.hint}>
              ¿Problemas para acceder? Contacta al administrador del sistema.
            </p>
          </div>

          <div className={styles.cardRight}>
            <div className={styles.illustration}>
              <div className={styles.illuIcon}>🧠</div>
              <h3 className={styles.illuTitle}>Evaluación Adaptativa</h3>
              <p className={styles.illuText}>
                Selección de talento humano basada en competencias blandas,
                impulsada por tecnología CAT/TRI.
              </p>
              <div className={styles.features}>
                {['Evaluaciones adaptativas', 'Reportes en tiempo real', 'Gestión multiempresa'].map(f => (
                  <div key={f} className={styles.featureItem}>
                    <span className={styles.featureCheck}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className={styles.footer}>© 2026 Pander RRHH · Todos los derechos reservados</p>
      </div>
    </div>
  )
}

// src/pages/Login/ForgotPassword.jsx
// ══════════════════════════════════════════════
// Flujo de 2 pasos:
//   Paso 1 — Ingresa email → backend envía OTP por correo
//   Paso 2 — Ingresa OTP + nueva contraseña → backend confirma
// ══════════════════════════════════════════════
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import styles from './Login.module.css'
import logo from '../../assets/logo.png'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)          // 1=email, 2=otp+pwd
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [pwd, setPwd]         = useState('')
  const [pwdRep, setPwdRep]   = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)        // {type:'ok'|'error', text}

  // ── Paso 1: solicitar OTP ──────────────────────────────────
  const handleRequest = async e => {
    e.preventDefault()
    if (!email.trim()) { setMsg({ type:'error', text:'Ingresa tu correo.' }); return }
    setLoading(true); setMsg(null)
    try {
      const res = await api.post('/api/acceso/auth/reset-request/', { email: email.trim() })
      setMsg({ type:'ok', text: res.data.detail })
      setStep(2)
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.detail || 'Error al procesar la solicitud.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: confirmar OTP + nueva contraseña ───────────────
  const handleConfirm = async e => {
    e.preventDefault()
    if (!otp.trim())    { setMsg({ type:'error', text:'Ingresa el código OTP.' }); return }
    if (pwd.length < 8) { setMsg({ type:'error', text:'La contraseña debe tener al menos 8 caracteres.' }); return }
    if (pwd !== pwdRep) { setMsg({ type:'error', text:'Las contraseñas no coinciden.' }); return }

    setLoading(true); setMsg(null)
    try {
      const res = await api.post('/api/acceso/auth/reset-confirm/', {
        otp: otp.trim(), nueva_pwd: pwd,
      })
      setMsg({ type:'ok', text: res.data.detail })
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.detail || 'Error al restablecer la contraseña.' })
    } finally {
      setLoading(false)
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

        <div className={styles.card} style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className={styles.cardLeft} style={{ flex: 'none', width: '100%', borderRadius: 20 }}>
            <h2 className={styles.cardTitle}>
              {step === 1 ? '🔐 Restablecer contraseña' : '✉️ Verificar código'}
            </h2>
            <p className={styles.cardSubtitle}>
              {step === 1
                ? 'Ingresa tu correo y te enviaremos un código de 6 dígitos.'
                : `Ingresamos un código a ${email}. Revisa tu bandeja de entrada.`
              }
            </p>

            {/* Indicador de pasos */}
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {[1,2].map(n => (
                <div key={n} style={{
                  flex:1, height:4, borderRadius:99,
                  background: n <= step ? 'var(--primary)' : 'var(--border)',
                  transition:'background .3s',
                }} />
              ))}
            </div>

            {/* Mensajes */}
            {msg && (
              <div style={{
                padding:'10px 14px', borderRadius:8, marginBottom:16,
                fontSize:'.85rem', fontWeight:500,
                background: msg.type==='ok' ? 'var(--success-bg)' : 'var(--danger-bg)',
                color:       msg.type==='ok' ? '#15803d' : 'var(--danger)',
                border:`1px solid ${msg.type==='ok' ? 'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`,
              }}>
                {msg.type==='ok' ? '✅' : '⚠️'} {msg.text}
              </div>
            )}

            {/* Paso 1 */}
            {step === 1 && (
              <form className={styles.form} onSubmit={handleRequest}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">Correo electrónico</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>📧</span>
                    <input
                      id="email" type="email" className={styles.input}
                      placeholder="tu@correo.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoFocus autoComplete="email"
                    />
                  </div>
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <><span className={styles.btnSpinner}/> Enviando...</> : 'Enviar código'}
                </button>
              </form>
            )}

            {/* Paso 2 */}
            {step === 2 && (
              <form className={styles.form} onSubmit={handleConfirm}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="otp">Código OTP (6 dígitos)</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>🔑</span>
                    <input
                      id="otp" type="text" inputMode="numeric" maxLength={6}
                      className={styles.input} placeholder="000000"
                      value={otp} onChange={e => setOtp(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="pwd">Nueva contraseña</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>🔒</span>
                    <input
                      id="pwd" type="password" className={styles.input}
                      placeholder="Mínimo 8 caracteres"
                      value={pwd} onChange={e => setPwd(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="pwdRep">Repetir contraseña</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>🔒</span>
                    <input
                      id="pwdRep" type="password" className={styles.input}
                      placeholder="Repite la contraseña"
                      value={pwdRep} onChange={e => setPwdRep(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <><span className={styles.btnSpinner}/> Confirmando...</> : 'Cambiar contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setMsg(null); setOtp(''); setPwd(''); setPwdRep('') }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)',
                    fontFamily:'var(--font)', fontSize:'.85rem', marginTop:8, textDecoration:'underline' }}
                >
                  ← Volver a ingresar el correo
                </button>
              </form>
            )}

            <p className={styles.hint} style={{ marginTop:20 }}>
              <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>
                ← Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </div>

        <p className={styles.footer}>© 2026 Pander RRHH · Todos los derechos reservados</p>
      </div>
    </div>
  )
}

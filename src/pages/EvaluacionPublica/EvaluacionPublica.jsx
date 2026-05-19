// src/pages/EvaluacionPublica/EvaluacionPublica.jsx  — v3 definitivo
// ────────────────────────────────────────────────────────────
// Cambios:
//   MAX_ITEMS_POR_HABILIDAD = 15  (alineado con cat_engine.MAX_ITEMS)
//   respondidas: contador acumulativo global — nunca retrocede
//   Al cambiar habilidad: setRespondidas(prev => prev + 1) (no resetea)
//   Variables correctas en responder(): intentoId, habilidadId,
//     pregunta.pregunta_id, seleccionado
// ────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { evaluacionService } from '../../services'
import styles from './EvaluacionPublica.module.css'
import logo from '../../assets/logo.png'

// Debe coincidir con MotorCAT.MAX_ITEMS en cat_engine.py
const MAX_ITEMS_POR_HABILIDAD = 15

function ProgressBar({ respondidas, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((respondidas / total) * 100)) : 0
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 99,
            background: i < respondidas ? 'var(--primary)' : 'var(--border)',
            transition: 'background .35s',
          }} />
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '.73rem', color: 'var(--text-muted)',
      }}>
        <span>Pregunta {respondidas + 1}</span>
        <span>{pct}%</span>
      </div>
    </div>
  )
}

export default function EvaluacionPublica() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const llave = params.get('llave')

  const [estado,       setEstado]       = useState('cargando')
  const [pregunta,     setPregunta]     = useState(null)
  const [intentoId,    setIntentoId]    = useState(null)
  const [habilidadId,  setHabilidadId]  = useState(null)
  const [evalDesc,     setEvalDesc]     = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [resultado,    setResultado]    = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [theta,        setTheta]        = useState(null)
  const tiempoRef = useRef(null)

  // Contador GLOBAL acumulativo — nunca retrocede aunque cambie habilidad
  const [respondidas,   setRespondidas]   = useState(0)
  // Total esperado: el backend devuelve el total de habilidades × MAX_ITEMS
  // Si no lo devuelve, usamos MAX_ITEMS_POR_HABILIDAD como mínimo
  const [totalEsperado, setTotalEsperado] = useState(MAX_ITEMS_POR_HABILIDAD)

  useEffect(() => {
    if (!token || !llave) {
      setEstado('error')
      setError('Enlace incorrecto o incompleto.')
      return
    }
    cargarAcceso()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarAcceso = async () => {
    try {
      const res = await evaluacionService.accesoToken(token, llave)
      const d   = res.data

      if (d.completado) {
        setEstado('completado'); setResultado(d.resultado); return
      }

      setIntentoId(d.intento_id)
      setHabilidadId(d.habilidad_id)
      setEvalDesc(d.evaluacion_descripcion || 'Evaluación de Competencias')
      setPregunta(d.pregunta)
      // Al inicio: 0 respondidas — barra en 0%
      setRespondidas(0)
      tiempoRef.current = Date.now()
      setEstado('pregunta')
    } catch (e) {
      setEstado('error')
      setError(e?.response?.data?.error || 'Error al cargar la evaluación.')
    }
  }

  const responder = async () => {
    if (seleccionado == null) return
    setLoading(true)
    setError(null)

    const tiempoSeg = Math.round((Date.now() - tiempoRef.current) / 1000)

    try {
      const res = await evaluacionService.responder({
        token,
        llave,
        intento_id:   intentoId,             // ✓ variable de estado correcta
        habilidad_id: habilidadId,           // ✓ variable de estado correcta
        pregunta_id:  pregunta.pregunta_id,  // ✓ campo correcto del objeto
        respuesta_id: seleccionado,          // ✓ variable de estado correcta
        tiempo_seg:   tiempoSeg,
      })

      const d = res.data
      if (d.theta != null) setTheta(d.theta)
      setSeleccionado(null)
      tiempoRef.current = Date.now()

      if (d.evaluacion_completada) {
        setEstado('completado')
        setResultado(d.resultado)

      } else if (d.habilidad_completada && d.siguiente) {
        // Cambio de habilidad:
        // - actualizar habilidadId con la nueva
        // - respondidas sigue subiendo (NO resetear)
        setHabilidadId(d.siguiente_habilidad_id)
        setPregunta(d.siguiente)
        setRespondidas(prev => prev + 1)   // acumula, no resetea

      } else if (d.siguiente) {
        // Siguiente pregunta de la misma habilidad
        setPregunta(d.siguiente)
        setRespondidas(prev => prev + 1)   // acumula siempre
      }

    } catch (e) {
      setError(e?.response?.data?.error || 'Error al registrar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const nivel = (th) => {
    if (th == null)  return { label: '—',             color: 'var(--text-muted)' }
    if (th >= 1.5)   return { label: 'Sobresaliente', color: '#15803d' }
    if (th >= 0.5)   return { label: 'Alto',          color: '#2563eb' }
    if (th >= -0.5)  return { label: 'Medio',         color: '#b45309' }
    if (th >= -1.5)  return { label: 'Bajo',          color: '#dc2626' }
    return                  { label: 'Muy Bajo',      color: '#7f1d1d' }
  }

  // ── Pantallas ─────────────────────────────────────────────

  if (estado === 'cargando') return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.spinner} />
        <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Cargando evaluación...</p>
      </div>
    </div>
  )

  if (estado === 'error') return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: 'var(--text-h)' }}>No se pudo cargar la evaluación</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{error}</p>
        <p style={{ marginTop: 16, fontSize: '.85rem', color: 'var(--text-muted)' }}>
          Si el enlace expiró, contacta al equipo de RRHH para recibir uno nuevo.
        </p>
      </div>
    </div>
  )

  if (estado === 'completado') {
    const niv = nivel(resultado?.theta_final)
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>¡Evaluación completada!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Gracias por completar la evaluación. El equipo de RRHH revisará tus resultados.
          </p>
          {resultado && (
            <div style={{
              background: 'var(--primary-bg)', borderRadius: 12,
              padding: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: niv.color }}>
                {resultado.theta_final != null
                  ? Number(resultado.theta_final).toFixed(3) : '—'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: niv.color, marginTop: 4 }}>
                {niv.label}
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                θ estimado · SE:{' '}
                {resultado.error_estandar != null
                  ? Number(resultado.error_estandar).toFixed(3) : '—'}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Pregunta activa ────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <div className={styles.header}>
          <div className={styles.logo}>
            <img src={logo} alt="Logo" className={styles.logoIcon}/> 
            <span>Pander</span>
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{evalDesc}</div>
        </div>

        {/* Barra de progreso acumulativa */}
        <ProgressBar respondidas={respondidas} total={totalEsperado} />

        {theta != null && (
          <div style={{
            fontSize: '.72rem', color: 'var(--text-muted)',
            textAlign: 'right', marginBottom: 10,
          }}>
            θ: {Number(theta).toFixed(3)}
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--danger-bg)', color: 'var(--danger)',
            padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '.85rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {error}
            <button onClick={() => setError(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'inherit', fontWeight: 700, fontSize: '1rem',
            }}>✕</button>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', lineHeight: 1.6 }}>
            {pregunta?.contenido}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {pregunta?.opciones?.map(op => (
            <button key={op.id} onClick={() => setSeleccionado(op.id)} style={{
              padding: '14px 18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font)', fontSize: '.9rem', transition: 'all .2s',
              fontWeight: seleccionado === op.id ? 700 : 400,
              background: seleccionado === op.id ? 'var(--primary)' : 'var(--input-bg)',
              color:      seleccionado === op.id ? '#fff'           : 'var(--text-h)',
              border: `2px solid ${seleccionado === op.id ? 'var(--primary)' : 'var(--border)'}`,
            }}>
              {op.contenido}
            </button>
          ))}
        </div>

        <button onClick={responder} disabled={!seleccionado || loading} style={{
          width: '100%', padding: '14px', borderRadius: 99,
          background: seleccionado && !loading ? 'var(--primary)' : 'var(--border)',
          color:      seleccionado && !loading ? '#fff'           : 'var(--text-muted)',
          border: 'none', cursor: seleccionado && !loading ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font)', fontSize: '1rem', fontWeight: 700, transition: 'all .2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {loading
            ? <><span className={styles.btnSpinner} /> Enviando...</>
            : 'Confirmar respuesta →'
          }
        </button>

      </div>
    </div>
  )
}

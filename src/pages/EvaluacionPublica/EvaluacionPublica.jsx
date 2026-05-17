// src/pages/EvaluacionPublica/EvaluacionPublica.jsx
// Ruta: /evaluacion/acceso?token=xxx&llave=yyy
// Acceso PÚBLICO — sin autenticación de analista
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { evaluacionService } from '../../services'
import styles from './EvaluacionPublica.module.css'

function ProgressBar({ paso, total }) {
  return (
    <div style={{ display:'flex', gap:4, marginBottom:20 }}>
      {Array.from({length: total}, (_,i) => (
        <div key={i} style={{
          flex:1, height:6, borderRadius:99,
          background: i < paso ? 'var(--primary)' : 'var(--border)', transition:'background .3s',
        }} />
      ))}
    </div>
  )
}

export default function EvaluacionPublica() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const llave = params.get('llave')

  const [estado, setEstado]   = useState('cargando')  // cargando|pregunta|completado|error
  const [pregunta, setPregunta] = useState(null)
  const [intentoId, setIntentoId] = useState(null)
  const [habilidadId, setHabilidadId] = useState(null)
  const [companiaId, setCompaniaId]   = useState(null)
  const [evalDesc, setEvalDesc]       = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [paso, setPaso] = useState(0)
  const [theta, setTheta] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tiempoInicio, setTiempoInicio] = useState(null)

  useEffect(() => {
    if (!token || !llave) { setEstado('error'); setError('Enlace incorrecto o incompleto.'); return }
    cargarAcceso()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarAcceso = async () => {
    try {
      const res = await evaluacionService.accesoToken(token, llave)
      const d = res.data
      if (d.completado) { setEstado('completado'); setResultado(d.resultado); return }
      setIntentoId(d.intento_id)
      setHabilidadId(d.habilidad_id)
      setCompaniaId(d.compania_id)
      setEvalDesc(d.evaluacion_descripcion || 'Evaluación de Competencias')
      setPregunta(d.pregunta)
      setPaso(d.pregunta?.numero || 1)
      setTiempoInicio(Date.now())
      setEstado('pregunta')
    } catch (e) {
      setEstado('error')
      setError(e?.response?.data?.error || 'Error al cargar la evaluación.')
    }
  }

  const responder = async () => {
    if (seleccionado == null) return
    setLoading(true)
    const tiempoSeg = Math.round((Date.now() - tiempoInicio) / 1000)
    try {
      const res = await evaluacionService.responder({
        token,
        llave,
        intento_id,
        habilidad_id,
        pregunta_id: preguntaActual.id,
        respuesta_id: respuestaSeleccionada,
        tiempo_seg
          })
      const d = res.data
      setTheta(d.theta)
      setSeleccionado(null)
      setTiempoInicio(Date.now())

      if (d.evaluacion_completada) {
        setEstado('completado')
        setResultado(d.resultado)
      } else if (d.habilidad_completada && d.siguiente) {
        setHabilidadId(d.siguiente_habilidad_id)
        setPregunta(d.siguiente)
        setPaso(d.siguiente?.numero || paso + 1)
      } else if (d.siguiente) {
        setPregunta(d.siguiente)
        setPaso(d.siguiente?.numero || paso + 1)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al registrar respuesta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const nivel = (th) => {
    if (th == null) return { label:'—', color:'var(--text-muted)' }
    if (th >= 1.5) return { label:'Sobresaliente', color:'#15803d' }
    if (th >= 0.5) return { label:'Alto',          color:'#2563eb' }
    if (th >= -0.5)return { label:'Medio',          color:'#b45309' }
    if (th >= -1.5)return { label:'Bajo',           color:'#dc2626' }
    return           { label:'Muy Bajo',           color:'#7f1d1d' }
  }

  // ── Pantallas ─────────────────────────────────────────────
  if (estado === 'cargando') return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.spinner} />
        <p>Cargando evaluación...</p>
      </div>
    </div>
  )

  if (estado === 'error') return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>⚠️</div>
        <h2>No se pudo cargar la evaluación</h2>
        <p style={{ color:'var(--text-muted)', marginTop:8 }}>{error}</p>
        <p style={{ marginTop:16, fontSize:'.85rem', color:'var(--text-muted)' }}>
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
          <div style={{ fontSize:'3rem', marginBottom:16 }}>🎉</div>
          <h2 style={{ color:'var(--primary)', marginBottom:8 }}>¡Evaluación completada!</h2>
          <p style={{ color:'var(--text-muted)', marginBottom:24 }}>
            Gracias por completar la evaluación. El equipo de RRHH revisará tus resultados.
          </p>
          {resultado && (
            <div style={{ background:'var(--primary-bg)', borderRadius:12, padding:20, textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', fontWeight:800, color: niv.color }}>
                {resultado.theta_final?.toFixed(3) ?? '—'}
              </div>
              <div style={{ fontSize:'1.1rem', fontWeight:700, color: niv.color, marginTop:4 }}>
                {niv.label}
              </div>
              <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:4 }}>
                θ estimado · SE: {resultado.error_estandar?.toFixed(3) ?? '—'}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Pregunta activa
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>🎯 <span>Pander</span></div>
          <div style={{ fontSize:'.82rem', color:'var(--text-muted)' }}>{evalDesc}</div>
        </div>

        {/* Progreso */}
        <div style={{ marginBottom:4 }}>
          <ProgressBar paso={paso - 1} total={Math.max(paso, 8)} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.75rem', color:'var(--text-muted)' }}>
            <span>Pregunta {paso}</span>
            {theta != null && <span>θ actual: {theta.toFixed(3)}</span>}
          </div>
        </div>

        {/* Pregunta */}
        {error && (
          <div style={{ background:'var(--danger-bg)', color:'var(--danger)', padding:'10px 14px',
            borderRadius:8, marginBottom:16, fontSize:'.85rem' }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft:8, background:'none', border:'none',
              cursor:'pointer', color:'inherit', fontWeight:700 }}>✕</button>
          </div>
        )}

        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:'1rem', fontWeight:600, color:'var(--text-h)', lineHeight:1.6 }}>
            {pregunta?.contenido}
          </p>
        </div>

        {/* Opciones */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {pregunta?.opciones?.map(op => (
            <button key={op.id} onClick={() => setSeleccionado(op.id)}
              style={{
                padding:'14px 18px', borderRadius:12, cursor:'pointer', textAlign:'left',
                fontFamily:'var(--font)', fontSize:'.9rem', fontWeight: seleccionado===op.id ? 700 : 400,
                transition:'all .2s',
                background: seleccionado===op.id ? 'var(--primary)' : 'var(--input-bg)',
                color:       seleccionado===op.id ? '#fff' : 'var(--text-h)',
                border:     `2px solid ${seleccionado===op.id ? 'var(--primary)' : 'var(--border)'}`,
              }}>
              {op.contenido}
            </button>
          ))}
        </div>

        {/* Botón confirmar */}
        <button
          onClick={responder}
          disabled={!seleccionado || loading}
          style={{
            width:'100%', padding:'14px', borderRadius:99,
            background: seleccionado && !loading ? 'var(--primary)' : 'var(--border)',
            color: seleccionado && !loading ? '#fff' : 'var(--text-muted)',
            border:'none', cursor: seleccionado && !loading ? 'pointer' : 'not-allowed',
            fontFamily:'var(--font)', fontSize:'1rem', fontWeight:700, transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
          {loading ? <><span className={styles.btnSpinner}/> Enviando...</> : 'Confirmar respuesta →'}
        </button>
      </div>
    </div>
  )
}

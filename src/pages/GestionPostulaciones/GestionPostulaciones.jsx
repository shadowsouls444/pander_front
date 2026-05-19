// src/pages/GestionPostulaciones/GestionPostulaciones.jsx — DEFINITIVO
// ─────────────────────────────────────────────────────────────────────
// Correcciones:
// 1. ModalDecision: lee de v_reporte_postulacion (tiene θ, duración, decisión).
//    Solo estados Seleccionado/Descartado tomados de la BD (no quemados).
//    Confirmación antes de enviar. Email con plantilla completa.
// 2. ModalFinalizar: bloquea ediciones, requiere decisión previa.
// 3. Gráficas incluyen decisiones. Export Excel/PDF/PNG/JPG/WEBP.
// ─────────────────────────────────────────────────────────────────────
import { useState, useMemo, useRef } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useFetch }  from '../../hooks/useFetch'
import { useAuth }   from '../../context/AuthContext'
import { candidatosService, vacantesService } from '../../services'
import api from '../../api/axios'
import {
  PageHeader, SearchBar, Table, Badge, Button,
  Modal, Select, Alert, Spinner, Card,
} from '../../components/ui'

// ── Colores / utilidades ─────────────────────────────────────
const COLOR_ESTADO   = { Recibida:'info','En Evaluación':'warning', Seleccionado:'success', Descartado:'danger', Finalizado:'primary' }
const COLOR_DECISION = { SELECCIONADO:'success', DESCARTADO:'danger', 'EN PROCESO':'warning', FINALIZADO:'primary' }

function nBadge(v, map) {
  return <Badge variant={map[v] || 'info'}>{v || '—'}</Badge>
}

// ── Columnas ─────────────────────────────────────────────────
const COLS_POST = [
  { key: 'id',                         label: 'ID',       width: 55 },
  { key: 'candidato_nombre_completo',  label: 'Candidato' },
  { key: 'vacante_descripcion',        label: 'Vacante',
    render: v => <span title={v}>{v?.slice(0,40)}{v?.length>40?'...':''}</span> },
  { key: 'estado_descripcion',         label: 'Estado',   width: 130,
    render: v => nBadge(v, COLOR_ESTADO) },
  { key: 'fecha_postulacion',          label: 'Fecha',    width: 100,
    render: v => v ? new Date(v).toLocaleDateString('es-CO') : '—' },
]

const COLS_REP = [
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'vacante',                   label: 'Vacante',
    render: v => <span title={v}>{v?.slice(0,35)}{v?.length>35?'...':''}</span> },
  { key: 'estado_postulacion',        label: 'Estado',   width: 130,
    render: v => nBadge(v, COLOR_ESTADO) },
  { key: 'decision',                  label: 'Decisión', width: 120,
    render: v => v ? nBadge(v, COLOR_DECISION) : <span style={{color:'var(--text-muted)'}}>—</span> },
  { key: 'theta_final',               label: 'θ Final',  width: 90,
    render: v => v != null ? <strong style={{color:'var(--primary)'}}>{Number(v).toFixed(3)}</strong> : '—' },
  { key: 'estado_intento',            label: 'Evaluación', width: 110,
    render: v => v ? nBadge(v, { Completado:'success','En Progreso':'warning' }) : '—' },
  { key: 'duracion_minutos',          label: 'Duración', width: 80,
    render: v => v != null ? `${v} min` : '—' },
]

// ── Modal: Nueva Postulación ──────────────────────────────────
function ModalPostular({ open, onClose, compania, onSaved }) {
  const [form, setForm]   = useState({ vacante:'', candidato:'', descripcion:'' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]     = useState(null)
  const vacantes   = useFetch(() => vacantesService.vVacantes(compania), [compania])
  const candidatos = useFetch(() => candidatosService.vCandidatos(compania), [compania])
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setMsg(null)
    if (!form.vacante || !form.candidato) { setMsg({type:'error',text:'Vacante y candidato son obligatorios.'}); return }
    setLoading(true)
    try {
      const res = await candidatosService.createPostulacion(compania, form)
      setMsg({ type:'ok', text: res.data.correo_enviado
        ? '✅ Postulación creada. Correo enviado al candidato.'
        : '✅ Postulación creada. (Correo no enviado — revisar SMTP).' })
      onSaved()
      setTimeout(() => { setMsg(null); onClose() }, 3000)
    } catch(e) { setMsg({type:'error', text: e?.response?.data?.detail || 'Error.'}) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="📋 Nueva Postulación" size="md">
      {msg && <Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:12}}>{msg.text}</Alert>}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Select label="Vacante *" value={form.vacante} onChange={e => set('vacante',e.target.value)}>
          <option value="">Seleccionar...</option>
          {vacantes.data?.filter(v=>v.ind_activa).map(v=>(
            <option key={v.id} value={v.id}>{v.descripcion?.slice(0,60)}</option>
          ))}
        </Select>
        <Select label="Candidato *" value={form.candidato} onChange={e => set('candidato',e.target.value)}>
          <option value="">Seleccionar...</option>
          {candidatos.data?.map(c=>(
            <option key={c.id} value={c.id}>{c.nombre_completo || `Candidato #${c.id}`}</option>
          ))}
        </Select>
        <div>
          <label style={{fontSize:'.82rem',fontWeight:600,display:'block',marginBottom:6}}>Observaciones</label>
          <textarea value={form.descripcion} onChange={e=>set('descripcion',e.target.value)}
            style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1.5px solid var(--border)',
              fontFamily:'var(--font)',fontSize:'.9rem',minHeight:70,resize:'vertical',outline:'none'}}
            placeholder="Notas del analista..." />
        </div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} loading={loading} icon="📋">Postular y enviar enlace</Button>
      </div>
    </Modal>
  )
}

// ── Modal: Toma de Decisión ───────────────────────────────────
// Lee estados de la BD (no quemados), solo muestra Seleccionado/Descartado
// Muestra resumen con θ y duración desde v_reporte_postulacion
// Confirmación antes de enviar
function ModalDecision({ open, onClose, fila, compania, userId, onSaved }) {
  const [estadoId,  setEstadoId]  = useState('')
  const [obs,       setObs]       = useState('')
  const [paso,      setPaso]      = useState('form')   // form | confirm
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState(null)

  // Estados de la BD filtrados a los permitidos para decisión
  const estadosBD = useFetch(() => candidatosService.getEstadosPost())
  const estadosDecision = useMemo(
    () => (estadosBD.data || []).filter(e => ['Seleccionado','Descartado'].includes(e.descripcion)),
    [estadosBD.data]
  )

  // Pre-llenar cuando se abre
  useMemo(() => {
    if (open && fila) {
      setEstadoId('')   // decisión fresca cada vez
      setObs(fila.observaciones || '')
      setPaso('form')
      setMsg(null)
    }
  }, [open, fila])

  const getNivel = (th) => {
    if (th == null)  return '—'
    if (th >= 1.5)   return 'Sobresaliente'
    if (th >= 0.5)   return 'Alto'
    if (th >= -0.5)  return 'Medio'
    if (th >= -1.5)  return 'Bajo'
    return 'Muy bajo'
  }

  const estadoSelDesc = estadosDecision.find(e => String(e.id) === String(estadoId))?.descripcion || ''

  const handleConfirmar = () => {
    if (!estadoId) { setMsg({type:'error',text:'Debes seleccionar un estado de decisión.'}); return }
    setMsg(null)
    setPaso('confirm')
  }

  const handleEnviar = async () => {
    setLoading(true); setMsg(null)
    try {
      const res = await api.post(
        `/api/candidatos/companias/${compania}/postulaciones/${fila.postulacion_id || fila.id}/decision/`,
        { estado_id: Number(estadoId), observaciones: obs, usuario_modificacion: userId }
      )
      setMsg({type:'ok', text: res.data.message || '✅ Decisión registrada.'})
      onSaved()
      setTimeout(() => { setMsg(null); onClose() }, 3000)
    } catch(e) {
      setMsg({type:'error', text: e?.response?.data?.detail || 'Error al registrar.'})
      setPaso('form')
    } finally { setLoading(false) }
  }

  if (!fila) return null

  return (
    <Modal open={open} onClose={onClose}
      title={`⚖️ Toma de Decisión — ${fila.candidato_nombre_completo || ''}`}
      size="md">

      {msg && (
        <Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:14}}>
          {msg.text}
        </Alert>
      )}

      {/* Resumen del candidato — datos de v_reporte_postulacion */}
      <div style={{ background:'var(--primary-bg)', borderRadius:10, padding:'12px 16px',
        marginBottom:16, border:'1px solid var(--primary-border)', fontSize:'.85rem' }}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px'}}>
          <div><strong>Vacante:</strong>{' '}
            {fila.vacante || fila.vacante_descripcion || '—'}</div>
          <div><strong>Estado evaluación:</strong>{' '}
            {fila.estado_intento || '—'}</div>
          <div><strong>θ Final:</strong>{' '}
            {fila.theta_final != null
              ? <span style={{color:'var(--primary)',fontWeight:700}}>
                  {Number(fila.theta_final).toFixed(3)} ({getNivel(fila.theta_final)})
                </span>
              : 'Sin evaluación'}
          </div>
          <div><strong>Duración:</strong>{' '}
            {fila.duracion_minutos != null ? `${fila.duracion_minutos} min` : '—'}</div>
          <div><strong>Decisión anterior:</strong>{' '}
            {fila.decision || 'Ninguna'}</div>
          <div><strong>Email candidato:</strong>{' '}
            {fila.candidato_email || '—'}</div>
        </div>
      </div>

      {paso === 'form' && (
        <>
          {/* Selector de estado — desde la BD, sin datos quemados */}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:'.85rem',fontWeight:700,display:'block',marginBottom:8}}>
              Estado de Decisión *
            </label>
            {estadosBD.loading ? <Spinner size="sm" /> : (
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {estadosDecision.map(e => {
                  const isSelec = e.descripcion === 'Seleccionado'
                  const activo  = String(estadoId) === String(e.id)
                  return (
                    <button key={e.id} onClick={() => setEstadoId(String(e.id))} style={{
                      padding:'10px 22px', borderRadius:99, border:'2px solid',
                      cursor:'pointer', fontFamily:'var(--font)', fontSize:'.88rem', fontWeight:700,
                      transition:'all .15s',
                      borderColor: activo ? (isSelec?'#15803d':'#dc2626') : 'var(--border)',
                      background:  activo ? (isSelec?'#15803d':'#dc2626') : 'var(--bg)',
                      color:       activo ? '#fff' : 'var(--text)',
                    }}>
                      {isSelec ? '✅' : '❌'} {e.descripcion}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:'.85rem',fontWeight:700,display:'block',marginBottom:8}}>
              Justificación / Observaciones
            </label>
            <textarea value={obs} onChange={e=>setObs(e.target.value)}
              style={{width:'100%',padding:'10px 14px',borderRadius:8,
                border:'1.5px solid var(--border)',fontFamily:'var(--font)',
                fontSize:'.9rem',minHeight:90,resize:'vertical',outline:'none'}}
              placeholder="Describe la justificación de la decisión..." />
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button icon="→" onClick={handleConfirmar}>Revisar y confirmar</Button>
          </div>
        </>
      )}

      {/* Pantalla de confirmación */}
      {paso === 'confirm' && (
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'2.5rem',marginBottom:12}}>
            {estadoSelDesc === 'Seleccionado' ? '✅' : '❌'}
          </div>
          <h3 style={{color:'var(--text-h)',marginBottom:8}}>
            ¿Confirmar decisión?
          </h3>
          <p style={{fontSize:'.9rem',color:'var(--text-muted)',marginBottom:6}}>
            Candidato: <strong>{fila.candidato_nombre_completo}</strong>
          </p>
          <p style={{fontSize:'.9rem',color:'var(--text-muted)',marginBottom:6}}>
            Decisión: <strong style={{
              color: estadoSelDesc==='Seleccionado'?'#15803d':'#dc2626'
            }}>{estadoSelDesc}</strong>
          </p>
          {obs && (
            <p style={{fontSize:'.85rem',color:'var(--text-muted)',marginBottom:6,
              fontStyle:'italic',maxWidth:400,margin:'0 auto 12px'}}>
              "{obs.slice(0,120)}{obs.length>120?'...':''}"
            </p>
          )}
          <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>
            📧 Se enviará un correo automático al candidato con esta decisión.
          </p>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <Button variant="ghost" onClick={() => setPaso('form')} disabled={loading}>
              ← Regresar
            </Button>
            <Button
              onClick={handleEnviar}
              loading={loading}
              icon={estadoSelDesc==='Seleccionado'?'✅':'❌'}
              style={{ background: estadoSelDesc==='Seleccionado'?'#15803d':'#dc2626' }}
            >
              Confirmar y notificar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Modal: Finalizar Postulación ──────────────────────────────
function ModalFinalizar({ open, onClose, fila, compania, userId, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState(null)

  const handleFinalizar = async () => {
    setLoading(true); setMsg(null)
    try {
      const res = await api.post(
        `/api/candidatos/companias/${compania}/postulaciones/${fila.postulacion_id || fila.id}/finalizar/`,
        { usuario_modificacion: userId }
      )
      setMsg({type:'ok', text: res.data.message || '✅ Postulación finalizada.'})
      onSaved()
      setTimeout(() => { setMsg(null); onClose() }, 2500)
    } catch(e) {
      setMsg({type:'error', text: e?.response?.data?.detail || 'Error al finalizar.'})
    } finally { setLoading(false) }
  }

  if (!fila) return null
  const tieneDecision = ['Seleccionado','Descartado'].includes(fila.estado_postulacion || fila.estado_descripcion)

  return (
    <Modal open={open} onClose={onClose} title="🏁 Finalizar Postulación" size="sm">
      {msg && <Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:14}}>{msg.text}</Alert>}
      {!tieneDecision ? (
        <>
          <Alert type="error">
            Solo se puede finalizar una postulación con decisión previa (Seleccionado o Descartado).
          </Alert>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>
        </>
      ) : (
        <>
          <p style={{fontSize:'.9rem',color:'var(--text-muted)',marginBottom:16}}>
            Esta acción marca la postulación de <strong>{fila.candidato_nombre_completo}</strong> como
            {' '}<strong>Finalizada</strong> y bloquea cualquier edición posterior.
          </p>
          <div style={{background:'var(--primary-bg)',borderRadius:8,padding:'10px 14px',
            marginBottom:20,fontSize:'.85rem',border:'1px solid var(--primary-border)'}}>
            <div><strong>Decisión actual:</strong> {fila.estado_postulacion || fila.estado_descripcion}</div>
            <div><strong>Vacante:</strong> {(fila.vacante || fila.vacante_descripcion || '').slice(0,60)}</div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button onClick={handleFinalizar} loading={loading} icon="🏁"
              style={{background:'var(--primary)'}}>
              Confirmar y finalizar
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Export Excel ──────────────────────────────────────────────
function exportarExcel(data, columnas, nombreArchivo) {
  const encabezados = columnas.map(c => c.label || c.key)
  const filas = data.map(row =>
    columnas.map(c => {
      const val = row[c.key]
      if (val == null) return ''
      if (val instanceof Date) return val.toLocaleDateString('es-CO')
      return String(val)
    })
  )
  // Construir CSV compatible con Excel (separador ;)
  const csv = [encabezados, ...filas]
    .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${nombreArchivo}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Export Gráfica (PNG / JPG / WEBP / PDF) ───────────────────
async function exportarGrafica(svgContainer, formato, nombreArchivo) {
  const svgEl = svgContainer.querySelector('svg')
  if (!svgEl) { alert('No hay gráfica para exportar.'); return }

  const serializer = new XMLSerializer()
  const svgStr     = serializer.serializeToString(svgEl)
  const svgBlob    = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl     = URL.createObjectURL(svgBlob)

  const img    = new Image()
  img.crossOrigin = 'anonymous'
  img.src = svgUrl

  await new Promise(res => { img.onload = res })

  const canvas  = document.createElement('canvas')
  const scale   = 2   // retina
  canvas.width  = img.width  * scale
  canvas.height = img.height * scale
  const ctx     = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(svgUrl)

  if (formato === 'pdf') {
    // PDF simple via print
    const win = window.open('', '_blank')
    const pngUrl = canvas.toDataURL('image/png')
    win.document.write(`<html><body style="margin:0"><img src="${pngUrl}" style="width:100%"/></body></html>`)
    win.document.close()
    win.print()
    return
  }

  const mimeMap = { png:'image/png', jpg:'image/jpeg', webp:'image/webp' }
  const mime    = mimeMap[formato] || 'image/png'
  const dataUrl = canvas.toDataURL(mime, 0.95)
  const a       = document.createElement('a')
  a.href = dataUrl; a.download = `${nombreArchivo}.${formato}`; a.click()
}

// ── Gráficas configurables ────────────────────────────────────
const GRAFICAS_CONFIG = [
  { value: 'candidatos_vacante',    label: '💼 Candidatos por Vacante' },
  { value: 'distribucion_estados',  label: '📊 Distribución de Estados' },
  { value: 'distribucion_decision', label: '⚖️ Distribución de Decisiones' },
  { value: 'theta_vacante',         label: '📈 θ Promedio por Vacante' },
]
const PALETTE = ['#2563eb','#15803d','#b45309','#dc2626','#7c3aed','#0891b2','#ca8a04']

function GraficasPostulaciones({ data }) {
  const [tipo, setTipo] = useState('candidatos_vacante')
  const grafRef = useRef(null)

  const chartData = useMemo(() => {
    if (!data.length) return []
    const agrupar = (campo) => {
      const g = {}
      data.forEach(r => { const k = (r[campo]||'—').slice?.(0,30)||'—'; g[k]=(g[k]||0)+1 })
      return Object.entries(g).map(([name,value]) => ({name,value})).sort((a,b)=>b.value-a.value).slice(0,10)
    }
    if (tipo==='candidatos_vacante')    return agrupar('vacante')
    if (tipo==='distribucion_estados')  return agrupar('estado_postulacion')
    if (tipo==='distribucion_decision') return agrupar('decision')
    if (tipo==='theta_vacante') {
      const g = {}
      data.forEach(r => {
        const k = (r.vacante||'—').slice(0,25)
        if (!g[k]) g[k]=[]
        if (r.theta_final!=null) g[k].push(r.theta_final)
      })
      return Object.entries(g).filter(([,v])=>v.length>0)
        .map(([name,vals]) => ({
          name, theta: +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(3), n:vals.length
        }))
    }
    return []
  }, [data, tipo])

  const usePie = tipo==='distribucion_estados' || tipo==='distribucion_decision'

  return (
    <Card style={{marginBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10}}>
        <h3 style={{fontSize:'.95rem',margin:0}}>📊 Análisis de Postulaciones</h3>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <select value={tipo} onChange={e=>setTipo(e.target.value)}
            style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--border)',
              fontFamily:'var(--font)',fontSize:'.82rem',cursor:'pointer',outline:'none'}}>
            {GRAFICAS_CONFIG.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          {/* Botones de exportación */}
          {['PNG','JPG','WEBP','PDF'].map(f=>(
            <button key={f} onClick={()=>exportarGrafica(grafRef.current, f.toLowerCase(), `grafica_postulaciones_${tipo}`)}
              style={{padding:'5px 11px',borderRadius:6,border:'1px solid var(--border)',
                background:'var(--bg)',cursor:'pointer',fontFamily:'var(--font)',fontSize:'.76rem',fontWeight:600}}>
              ⬇ {f}
            </button>
          ))}
        </div>
      </div>

      <div ref={grafRef}>
        {!chartData.length ? (
          <div style={{textAlign:'center',color:'var(--text-muted)',padding:30}}>Sin datos.</div>
        ) : usePie ? (
          <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({name,percent})=>`${name} (${(percent*100).toFixed(0)}%)`}>
                  {chartData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {chartData.map((d,i)=>(
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <div style={{width:12,height:12,borderRadius:'50%',background:PALETTE[i%PALETTE.length],flexShrink:0}} />
                  <span style={{fontSize:'.85rem'}}>{d.name}</span>
                  <strong style={{marginLeft:'auto'}}>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{top:10,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Bar dataKey={tipo==='theta_vacante'?'theta':'value'} fill="var(--primary)" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <p style={{fontSize:'.73rem',color:'var(--text-muted)',marginTop:10,textAlign:'right'}}>
        {data.length} registros · Haz clic en los botones para exportar la gráfica
      </p>
    </Card>
  )
}

// ── Página principal ──────────────────────────────────────────
const COLS_EXPORT_REP = [
  {key:'candidato_nombre_completo',label:'Candidato'},
  {key:'vacante',label:'Vacante'},{key:'unidad',label:'Unidad'},
  {key:'estado_postulacion',label:'Estado'},{key:'decision',label:'Decisión'},
  {key:'theta_final',label:'θ Final'},{key:'error_estandar_final',label:'SE(θ)'},
  {key:'estado_intento',label:'Estado Evaluación'},
  {key:'duracion_minutos',label:'Duración (min)'},
  {key:'intento_inicio',label:'Inicio eval.'},{key:'intento_fin',label:'Fin eval.'},
  {key:'candidato_email',label:'Email'},{key:'candidato_telefono',label:'Teléfono'},
]

export default function GestionPostulaciones() {
  const { user }  = useAuth()
  const cid       = user?.compania
  const [tab, setTab]       = useState('postulaciones')
  const [search, setSearch] = useState('')
  const [modalPost,      setModalPost]      = useState(false)
  const [modalDecision,  setModalDecision]  = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState(false)
  const [filaActiva,     setFilaActiva]     = useState(null)

  const postulaciones = useFetch(() => candidatosService.vPostulaciones(cid), [cid])
  const reporte       = useFetch(() => candidatosService.getReporte(cid),     [cid])

  const qL = search.toLowerCase()
  const filtPost = postulaciones.data?.filter(p =>
    !search || [p.candidato_nombre_completo, p.vacante_descripcion, p.estado_descripcion]
      .some(f => f?.toLowerCase().includes(qL))
  ) ?? []
  const filtRep = reporte.data?.filter(r =>
    !search || [r.candidato_nombre_completo, r.vacante].some(f => f?.toLowerCase().includes(qL))
  ) ?? []

  const reload = () => { postulaciones.reload(); reporte.reload() }

  // Para el modal de decisión necesitamos la fila del REPORTE (que tiene θ, duración, email)
  // Cuando se hace clic desde Postulaciones, buscar el reporte correspondiente
  const abrirDecision = (fila) => {
    // Si la fila ya tiene theta_final (viene del reporte), usarla directamente
    if (fila.theta_final !== undefined || fila.postulacion_id !== undefined) {
      setFilaActiva(fila)
    } else {
      // Si viene de v_postulacion, buscar en el reporte por postulacion_id o id
      const filaReporte = reporte.data?.find(
        r => r.postulacion_id === fila.id || r.postulacion_id === fila.id_interno
      )
      setFilaActiva(filaReporte || { ...fila, theta_final: null, duracion_minutos: null })
    }
    setModalDecision(true)
  }

  const abrirFinalizar = (fila) => {
    setFilaActiva(fila)
    setModalFinalizar(true)
  }

  const accionesPost = row => (
    <div style={{display:'flex',gap:6}}>
      <Button size="sm" variant="secondary" icon="⚖️" onClick={()=>abrirDecision(row)}>Decisión</Button>
      <Button size="sm" variant="ghost"     icon="🏁" onClick={()=>abrirFinalizar(row)}>Finalizar</Button>
    </div>
  )

  const accionesRep = row => (
    <div style={{display:'flex',gap:6}}>
      <Button size="sm" variant="secondary" icon="⚖️" onClick={()=>abrirDecision(row)}>Decisión</Button>
      <Button size="sm" variant="ghost"     icon="🏁" onClick={()=>abrirFinalizar(row)}>Finalizar</Button>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Postulaciones"
        subtitle="Gestión de candidatos, evaluaciones y toma de decisiones"
        action={<Button icon="➕" onClick={()=>setModalPost(true)}>Nueva Postulación</Button>}
      />

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {[['postulaciones','📋 Postulaciones'],['reporte','📊 Reporte y Análisis']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:'8px 20px',borderRadius:99,border:'none',cursor:'pointer',
            fontFamily:'var(--font)',fontWeight:600,fontSize:'.88rem',transition:'all .2s',
            background:tab===k?'var(--primary)':'var(--border)',
            color:tab===k?'#fff':'var(--text)'}}>
            {l}
          </button>
        ))}
      </div>

      <div style={{marginBottom:14}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar candidato, vacante, estado..." />
      </div>

      {tab === 'postulaciones' ? (
        postulaciones.loading ? <Spinner /> : (
          <>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
              <Button size="sm" variant="ghost" icon="⬇"
                onClick={()=>exportarExcel(filtPost, COLS_EXPORT_REP.filter(c=>filtPost[0]?.[c.key]!==undefined), 'postulaciones')}>
                Exportar Excel
              </Button>
            </div>
            <Table columns={COLS_POST} data={filtPost}
              empty="No hay postulaciones." actions={accionesPost} />
          </>
        )
      ) : (
        reporte.loading ? <Spinner /> : (
          <>
            <GraficasPostulaciones data={filtRep} />
            <Card>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <h3 style={{fontSize:'.95rem',margin:0}}>📋 Reporte Ejecutivo</h3>
                <Button size="sm" variant="ghost" icon="⬇"
                  onClick={()=>exportarExcel(filtRep, COLS_EXPORT_REP, 'reporte_postulaciones')}>
                  Exportar Excel
                </Button>
              </div>
              <Table columns={COLS_REP} data={filtRep}
                empty="Sin datos en el reporte." actions={accionesRep} />
            </Card>
          </>
        )
      )}

      <ModalPostular open={modalPost} onClose={()=>setModalPost(false)}
        compania={cid} onSaved={reload} />

      <ModalDecision
        open={modalDecision}
        onClose={()=>{setModalDecision(false);setFilaActiva(null)}}
        fila={filaActiva} compania={cid} userId={user?.id} onSaved={reload}
      />

      <ModalFinalizar
        open={modalFinalizar}
        onClose={()=>{setModalFinalizar(false);setFilaActiva(null)}}
        fila={filaActiva} compania={cid} userId={user?.id} onSaved={reload}
      />
    </div>
  )
}

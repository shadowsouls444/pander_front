// src/pages/GestionEvaluaciones/GestionEvaluaciones.jsx
// Configuración total: nombre, habilidades, preguntas, parámetros TRI
import { useState, useEffect } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { evaluacionService } from '../../services'
import {
  PageHeader, Card, Button, Input, Badge,
  Alert, Spinner, Modal, Table
} from '../../components/ui'

const NIVELES = [
  { rango:[1.5,4],   label:'Sobresaliente', color:'#15803d' },
  { rango:[0.5,1.5], label:'Alto',          color:'#2563eb' },
  { rango:[-0.5,.5], label:'Medio',         color:'#b45309' },
  { rango:[-1.5,-.5],label:'Bajo',          color:'#dc2626' },
  { rango:[-4,-1.5], label:'Muy Bajo',      color:'#7f1d1d' },
]

// ── Modal: crear / editar evaluación ────────────────────────
function ModalEvaluacion({ open, onClose, evaluacion, companiaId, userId, onSaved }) {
  const [form, setForm] = useState({ descripcion: '', ind_activa: true })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!evaluacion

  useEffect(() => {
    if (evaluacion) {
      setForm({ descripcion: evaluacion.descripcion || '', ind_activa: !!evaluacion.ind_activa })
    } else {
      setForm({ descripcion: '', ind_activa: true })
    }
    setMsg(null)
  }, [evaluacion, open])

  const handleSave = async () => {
    if (!form.descripcion.trim()) { setMsg({ type:'error', text:'El nombre es obligatorio.' }); return }
    setLoading(true); setMsg(null)
    try {
      if (isEdit) {
        await evaluacionService.updateEvaluacion(companiaId, evaluacion.id, {
          ...form, compania: companiaId, usuario_modificacion: userId,
        })
      } else {
        await evaluacionService.createEvaluacion(companiaId, {
          ...form, compania: companiaId, usuario_creacion: userId,
        })
      }
      onSaved()
      onClose()
    } catch (e) {
      setMsg({ type:'error', text: e?.response?.data?.detail || 'Error al guardar.' })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? '✏️ Editar Evaluación' : '➕ Nueva Evaluación'} size="md">
      {msg && <Alert type={msg.type === 'ok' ? 'success' : 'error'} style={{ marginBottom:12 }}>{msg.text}</Alert>}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input
          label="Nombre de la Evaluación *"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Ej: Evaluación de Competencias Blandas"
        />
        <label style={{ display:'flex', alignItems:'center', gap:10, fontSize:'.88rem', fontWeight:500, cursor:'pointer' }}>
          <input
            type="checkbox"
            checked={!!form.ind_activa}
            onChange={e => set('ind_activa', e.target.checked)}
            style={{ width:16, height:16 }}
          />
          Evaluación activa
        </label>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSave} loading={loading} icon="💾">
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Modal: gestión de habilidades de una evaluación ─────────
function ModalHabilidades({ open, onClose, evaluacion, companiaId, userId }) {
  const todasHabilidades = useFetch(() => evaluacionService.getHabilidades())
  const asignadas = useFetch(
    () => evaluacionService.getEvalHabilidades(companiaId, evaluacion?.id),
    [evaluacion?.id]
  )
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const asignadasIds = new Set(asignadas.data?.map(eh => eh.habilidad) ?? [])

  const toggle = async (habilidadId) => {
    setLoading(true); setMsg(null)
    try {
      if (asignadasIds.has(habilidadId)) {
        const rel = asignadas.data.find(eh => eh.habilidad === habilidadId)
        await evaluacionService.desasignarHabilidad(companiaId, evaluacion.id, rel.id)
      } else {
        const orden = (asignadas.data?.length ?? 0) + 1
        await evaluacionService.asignarHabilidad(companiaId, evaluacion.id, {
          habilidad: habilidadId, orden, obligatoria: true,
          usuario_creacion: userId, compania: companiaId,
        })
      }
      asignadas.reload()
      setMsg({ type:'ok', text:'Habilidad actualizada.' })
      setTimeout(() => setMsg(null), 2000)
    } catch { setMsg({ type:'error', text:'Error al actualizar.' }) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose}
      title={`🧠 Habilidades — ${evaluacion?.descripcion}`} size="md">
      {msg && <Alert type={msg.type==='ok'?'success':'error'} style={{ marginBottom:12 }}>{msg.text}</Alert>}
      <p style={{ fontSize:'.83rem', color:'var(--text-muted)', marginBottom:14 }}>
        Marca las habilidades que se evaluarán en esta configuración.
        Las preguntas del banco corresponden a cada habilidad.
      </p>

      {todasHabilidades.loading || asignadas.loading ? <Spinner size="sm" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {todasHabilidades.data?.map(h => {
            const activa = asignadasIds.has(h.id)
            return (
              <div key={h.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'12px 16px', borderRadius:10,
                background: activa ? 'var(--primary-bg)' : 'var(--bg)',
                border: `1.5px solid ${activa ? 'var(--primary-border)' : 'var(--border)'}`,
              }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:'.9rem' }}>{h.descripcion}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:2 }}>
                    {h.total_preguntas || 0} preguntas ·
                    a={Number(h.discriminacion || 0).toFixed(2)} ·
                    b={Number(h.dificultad || 0).toFixed(2)} ·
                    c={Number(h.adivinabilidad || 0).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => toggle(h.id)}
                  disabled={loading}
                  style={{
                    padding:'6px 14px', borderRadius:99, border:'none', cursor:'pointer',
                    fontFamily:'var(--font)', fontSize:'.8rem', fontWeight:700,
                    background: activa ? 'var(--danger-bg)' : 'var(--primary)',
                    color: activa ? 'var(--danger)' : '#fff', transition:'all .2s',
                    opacity: loading ? .6 : 1,
                  }}
                >
                  {activa ? '✕ Quitar' : '+ Asignar'}
                </button>
              </div>
            )
          })}
          {!todasHabilidades.data?.length && (
            <p style={{ color:'var(--text-muted)', fontSize:'.85rem' }}>
              No hay habilidades en el banco. Ve a "Banco de Habilidades" para crearlas.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Modal: preguntas de una habilidad ────────────────────────
function ModalPreguntas({ habilidad, onClose }) {
  const preguntas = useFetch(() => evaluacionService.getPreguntas(habilidad.id), [habilidad.id])
  const DEFAULT_FORM = {
    contenido:'', criterio_a:1.0, criterio_b:0.0, criterio_c:0.1,
    opciones:[
      { contenido:'', ind_correcta:true  },
      { contenido:'', ind_correcta:false },
      { contenido:'', ind_correcta:false },
      { contenido:'', ind_correcta:false },
    ]
  }
  const [form, setForm]   = useState(DEFAULT_FORM)
  const [editPreg, setEditPreg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const set    = (k,v) => setForm(f => ({ ...f, [k]: v }))
  const setOpc = (i,k,v) => setForm(f => {
    const opciones = [...f.opciones]
    if (k === 'ind_correcta' && v) opciones.forEach((_,j) => { opciones[j] = {...opciones[j], ind_correcta: j===i} })
    else opciones[i] = { ...opciones[i], [k]: v }
    return { ...f, opciones }
  })

  const resetForm = () => { setForm(DEFAULT_FORM); setEditPreg(null) }

  const handleSave = async () => {
    if (!form.contenido.trim()) { setMsg({type:'error',text:'El enunciado es obligatorio.'}); return }
    const opcsFilled = form.opciones.filter(o => o.contenido.trim())
    if (opcsFilled.length < 2)  { setMsg({type:'error',text:'Se requieren al menos 2 opciones.'}); return }
    if (!opcsFilled.some(o => o.ind_correcta)) { setMsg({type:'error',text:'Marca una opción como correcta.'}); return }
    setLoading(true); setMsg(null)
    try {
      const body = { ...form, ind_activa: true, opciones: opcsFilled }
      if (editPreg) {
        await evaluacionService.updatePregunta(habilidad.id, editPreg.id, body)
        setMsg({type:'ok', text:'Pregunta actualizada.'})
      } else {
        await evaluacionService.createPregunta(habilidad.id, body)
        setMsg({type:'ok', text:'Pregunta creada.'})
      }
      preguntas.reload()
      resetForm()
    } catch { setMsg({type:'error', text:'Error al guardar la pregunta.'}) }
    finally { setLoading(false) }
  }

  const handleEdit = async (p) => {
    setEditPreg(p)
    // Cargar respuestas existentes
    try {
      const res = await evaluacionService.getRespuestas(p.id)
      const opciones = res.data.map(r => ({ id: r.id, contenido: r.contenido, ind_correcta: r.ind_correcta }))
      // Rellenar hasta 4
      while (opciones.length < 4) opciones.push({ contenido:'', ind_correcta:false })
      setForm({
        contenido: p.contenido,
        criterio_a: p.criterio_a,
        criterio_b: p.criterio_b,
        criterio_c: p.criterio_c,
        opciones,
      })
    } catch { setMsg({type:'error', text:'Error al cargar la pregunta.'}) }
    setMsg(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar pregunta?')) return
    try { await evaluacionService.deletePregunta(habilidad.id, id); preguntas.reload() }
    catch { alert('Error al eliminar.') }
  }

  return (
    <Modal open onClose={onClose} title={`❓ Preguntas — ${habilidad.descripcion}`} size="lg">
      {msg && <Alert type={msg.type==='ok'?'success':'error'} onClose={() => setMsg(null)} style={{marginBottom:12}}>{msg.text}</Alert>}

      {/* Lista existente */}
      <div style={{ maxHeight:240, overflowY:'auto', marginBottom:20 }}>
        {preguntas.loading ? <Spinner size="sm" /> :
          !preguntas.data?.length ? <p style={{color:'var(--text-muted)',fontSize:'.85rem'}}>Sin preguntas.</p> :
          preguntas.data.map((p, i) => (
            <div key={p.id} style={{
              padding:'10px 14px', marginBottom:6, background:'var(--bg)',
              borderRadius:8, border:'1px solid var(--border)',
              display:'flex', gap:10, alignItems:'flex-start',
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:'.87rem', marginBottom:3 }}>{i+1}. {p.contenido}</div>
                <div style={{ fontSize:'.73rem', color:'var(--text-muted)' }}>
                  a={p.criterio_a} · b={p.criterio_b} · c={p.criterio_c}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => handleEdit(p)}
                  style={{ padding:'3px 10px', background:'var(--primary-bg)', color:'var(--primary)',
                    border:'none', borderRadius:6, cursor:'pointer', fontSize:'.76rem', fontWeight:600 }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(p.id)}
                  style={{ padding:'3px 10px', background:'var(--danger-bg)', color:'var(--danger)',
                    border:'none', borderRadius:6, cursor:'pointer', fontSize:'.76rem', fontWeight:600 }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Formulario crear/editar pregunta */}
      <div style={{ background:'var(--primary-bg)', borderRadius:12, padding:16, border:'1px solid var(--primary-border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <h4 style={{ fontSize:'.9rem', color:'var(--primary)', margin:0 }}>
            {editPreg ? '✏️ Editando pregunta' : '➕ Nueva Pregunta'}
          </h4>
          {editPreg && (
            <button onClick={resetForm}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'.8rem' }}>
              Cancelar edición
            </button>
          )}
        </div>

        <textarea value={form.contenido} onChange={e => set('contenido', e.target.value)}
          style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid var(--border)',
            fontFamily:'var(--font)', fontSize:'.9rem', minHeight:60, resize:'vertical', outline:'none', marginBottom:10 }}
          placeholder="Enunciado de la pregunta..." />

        {/* Parámetros TRI */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
          {[['criterio_a','Discriminación (a)'],['criterio_b','Dificultad (b)'],['criterio_c','Adivinab. (c)']].map(([k,l]) => (
            <div key={k}>
              <label style={{ fontSize:'.73rem', fontWeight:600, display:'block', marginBottom:4 }}>{l}</label>
              <input type="number" step="0.1" value={form[k]}
                onChange={e => set(k, parseFloat(e.target.value) || 0)}
                style={{ width:'100%', padding:'6px 10px', border:'1.5px solid var(--border)',
                  borderRadius:6, fontFamily:'var(--font)', outline:'none' }} />
            </div>
          ))}
        </div>

        {/* Opciones */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
          {form.opciones.map((op, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="radio" name="correcta" checked={!!op.ind_correcta}
                onChange={() => setOpc(i, 'ind_correcta', true)}
                style={{ cursor:'pointer', width:16, height:16, flexShrink:0 }} />
              <input value={op.contenido} onChange={e => setOpc(i, 'contenido', e.target.value)}
                placeholder={`Opción ${String.fromCharCode(65+i)}`}
                style={{
                  flex:1, padding:'7px 12px', borderRadius:8, fontFamily:'var(--font)', fontSize:'.88rem',
                  border: `1.5px solid ${op.ind_correcta ? '#86efac' : 'var(--border)'}`,
                  background: op.ind_correcta ? '#f0fdf4' : 'var(--input-bg)', outline:'none',
                }} />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} loading={loading} icon="💾" size="sm">
          {editPreg ? 'Actualizar Pregunta' : 'Guardar Pregunta'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function GestionEvaluaciones() {
  const { user } = useAuth()
  const cid      = user?.compania

  const habilidades  = useFetch(() => evaluacionService.getHabilidades())
  const evaluaciones = useFetch(() => evaluacionService.getEvaluaciones(cid), [cid])

  const [modalEval, setModalEval]   = useState(null)  // null | 'new' | evaluacion_obj
  const [modalHab, setModalHab]     = useState(null)  // evaluacion_obj
  const [panelPreg, setPanelPreg]   = useState(null)  // habilidad_obj
  const [msg, setMsg] = useState(null)

  const handleDeleteEval = async (id) => {
    if (!confirm('¿Eliminar esta evaluación?')) return
    try {
      await evaluacionService.deleteEvaluacion(cid, id)
      evaluaciones.reload()
    } catch { alert('Error al eliminar.') }
  }

  return (
    <div>
      <PageHeader
        title="Configuración de Evaluaciones"
        subtitle="Evaluaciones · Habilidades asignadas · Preguntas TRI por habilidad"
        action={
          <Button icon="➕" onClick={() => setModalEval('new')}>Nueva Evaluación</Button>
        }
      />

      {msg && <Alert type={msg.type==='ok'?'success':'error'} onClose={() => setMsg(null)} style={{marginBottom:16}}>{msg.text}</Alert>}

      {/* ── Evaluaciones configuradas ── */}
      <Card style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:'.95rem', marginBottom:14 }}>📋 Evaluaciones</h3>
        {evaluaciones.loading ? <Spinner size="sm" /> :
          !evaluaciones.data?.length
            ? <p style={{ color:'var(--text-muted)', fontSize:'.88rem' }}>Sin evaluaciones. Crea la primera.</p>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {evaluaciones.data.map(e => (
                  <div key={e.id} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
                    padding:'12px 16px', background:'var(--bg)', borderRadius:10,
                    border:'1px solid var(--border)',
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'.95rem' }}>{e.descripcion}</div>
                      <div style={{ fontSize:'.76rem', color:'var(--text-muted)', marginTop:2 }}>
                        ID: {e.id} · Creada por: #{e.usuario_creacion}
                      </div>
                    </div>
                    <Badge variant={e.ind_activa ? 'success' : 'danger'}>
                      {e.ind_activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <div style={{ display:'flex', gap:6 }}>
                      <Button size="sm" variant="secondary" icon="🧠"
                        onClick={() => setModalHab(e)}>
                        Habilidades
                      </Button>
                      <Button size="sm" variant="secondary" icon="✏️"
                        onClick={() => setModalEval(e)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="danger" icon="🗑️"
                        onClick={() => handleDeleteEval(e.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
      </Card>

      {/* ── Banco de habilidades ── */}
      <Card>
        <h3 style={{ fontSize:'.95rem', marginBottom:14 }}>🧠 Banco de Habilidades</h3>
        <p style={{ fontSize:'.82rem', color:'var(--text-muted)', marginBottom:14 }}>
          Haz clic en una habilidad para gestionar sus preguntas.
        </p>
        {habilidades.loading ? <Spinner size="sm" /> :
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:12 }}>
            {habilidades.data?.map(h => (
              <div key={h.id}
                style={{ padding:16, background:'var(--bg)', borderRadius:12,
                  border:'1px solid var(--border)', cursor:'pointer', transition:'all .2s' }}
                onClick={() => setPanelPreg(h)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ fontWeight:700, fontSize:'.93rem' }}>{h.descripcion}</div>
                  <Badge variant="primary">{h.total_preguntas ?? 0} ítems</Badge>
                </div>
                <div style={{ fontSize:'.73rem', color:'var(--text-muted)', display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span>a={Number(h.discriminacion||0).toFixed(2)}</span>
                  <span>b={Number(h.dificultad||0).toFixed(2)}</span>
                  <span>c={Number(h.adivinabilidad||0).toFixed(2)}</span>
                </div>
                <div style={{ marginTop:8, fontSize:'.76rem', color:'var(--primary)', fontWeight:600 }}>
                  ✏️ Gestionar preguntas →
                </div>
              </div>
            ))}
            {!habilidades.data?.length && (
              <p style={{ color:'var(--text-muted)', fontSize:'.85rem', gridColumn:'1/-1' }}>
                No hay habilidades en el banco.
              </p>
            )}
          </div>
        }
      </Card>

      {/* ── Escala θ ── */}
      <Card style={{ marginTop:16 }}>
        <h3 style={{ fontSize:'.9rem', marginBottom:10 }}>📊 Escala de Niveles θ (TRI)</h3>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {NIVELES.map(n => (
            <div key={n.label} style={{ padding:'5px 14px', borderRadius:99,
              border:`2px solid ${n.color}20`, background:`${n.color}10`,
              color:n.color, fontWeight:600, fontSize:'.78rem' }}>
              {n.label} ({n.rango[0]} → {n.rango[1]})
            </div>
          ))}
        </div>
        <p style={{ marginTop:10, fontSize:'.78rem', color:'var(--text-muted)' }}>
          θ estimado por el motor CAT (Computerized Adaptive Testing) usando el modelo TRI 3PL.
        </p>
      </Card>

      {/* Modales */}
      {(modalEval === 'new' || (modalEval && typeof modalEval === 'object')) && (
        <ModalEvaluacion
          open
          onClose={() => setModalEval(null)}
          evaluacion={modalEval === 'new' ? null : modalEval}
          companiaId={cid}
          userId={user?.id}
          onSaved={() => evaluaciones.reload()}
        />
      )}
      {modalHab && (
        <ModalHabilidades
          open onClose={() => setModalHab(null)}
          evaluacion={modalHab} companiaId={cid} userId={user?.id}
        />
      )}
      {panelPreg && (
        <ModalPreguntas habilidad={panelPreg} onClose={() => setPanelPreg(null)} />
      )}
    </div>
  )
}

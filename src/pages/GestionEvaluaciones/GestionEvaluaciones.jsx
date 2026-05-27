// src/pages/GestionEvaluaciones/GestionEvaluaciones.jsx — v10
// CAMBIOS vs v9:
//   ModalPreguntas: getPreguntas(cid, hid) sin eid,
//                  createPregunta(cid, hid, d) sin eid
//                  updatePregunta(cid, hid, id, d) sin eid
//                  deletePregunta(cid, hid, id) sin eid
//                  getRespuestas(cid, pid) — igual
//   Tab "Por Vacante" restaurada con ind_evaluacion_vacante
import { useState, useEffect, useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { useAuth }  from '../../context/AuthContext'
import { evaluacionService, vacantesService } from '../../services'
import {
  PageHeader, Card, Button, Input, Badge, Alert, Spinner, Modal,
} from '../../components/ui'
import {
  MdAdd, MdEdit, MdDelete, MdCheck, MdClose, MdSave,
  MdQuiz, MdAssignment, MdSettings, MdLink, MdInfo,
} from 'react-icons/md'
import { BiBrain } from 'react-icons/bi'

const btn = (v, x={}) => {
  const m = {
    primary: {background:'var(--primary)',color:'#fff',border:'none'},
    ghost:   {background:'var(--primary-bg)',color:'var(--primary)',border:'1px solid var(--primary-border)'},
    danger:  {background:'var(--danger-bg)',color:'var(--danger)',border:'1px solid #fee2e2'},
    success: {background:'#dcfce7',color:'#15803d',border:'1px solid #bbf7d0'},
  }
  return {padding:'6px 12px',borderRadius:8,cursor:'pointer',fontFamily:'var(--font)',
    fontSize:'.8rem',fontWeight:600,display:'flex',alignItems:'center',gap:5,transition:'opacity .15s',
    ...(m[v]||m.ghost),...x}
}

// ── Modal Evaluación ──────────────────────────────────────────
function ModalEvaluacion({ open, onClose, evaluacion, companiaId, userId, onSaved }) {
  const isEdit = !!evaluacion
  const [form, setForm] = useState({ descripcion:'', ind_activa:true })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    if (open) {
      setForm(evaluacion
        ? { descripcion:evaluacion.descripcion??'', ind_activa:!!evaluacion.ind_activa }
        : { descripcion:'', ind_activa:true })
      setMsg(null)
    }
  }, [evaluacion, open])

  const handleSave = async () => {
    if (!form.descripcion.trim()) { setMsg({type:'error',text:'Nombre obligatorio.'}); return }
    setLoading(true); setMsg(null)
    try {
      if (isEdit) await evaluacionService.updateEvaluacion(companiaId, evaluacion.id, {...form, compania:companiaId})
      else        await evaluacionService.createEvaluacion(companiaId, {...form, compania:companiaId, usuario_creacion:userId||1})
      onSaved(); onClose()
    } catch(e) { setMsg({type:'error', text:e?.response?.data?.detail||JSON.stringify(e?.response?.data)||'Error.'}) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Editar Evaluación':'Nueva Evaluación'} size="sm">
      {msg && <Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:12}}>{msg.text}</Alert>}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="Nombre *" value={form.descripcion} onChange={e=>set('descripcion',e.target.value)}/>
        <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
          <input type="checkbox" checked={!!form.ind_activa} onChange={e=>set('ind_activa',e.target.checked)} style={{width:16,height:16}}/>
          <div>
            <div style={{fontSize:'.9rem',fontWeight:600}}>Activa</div>
            <div style={{fontSize:'.75rem',color:'var(--text-muted)'}}>Al activar se desactivan las demás de esta compañía.</div>
          </div>
        </label>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
        <button onClick={onClose} disabled={loading} style={btn('ghost')}><MdClose size={14}/> Cancelar</button>
        <button onClick={handleSave} disabled={loading} style={btn('primary')}>
          {loading?<Spinner size="xs"/>:<MdSave size={14}/>} {isEdit?'Actualizar':'Crear'}
        </button>
      </div>
    </Modal>
  )
}

// ── Modal Asignar Habilidades ─────────────────────────────────
function ModalAsignarHabilidades({ open, onClose, evaluacion, companiaId, userId }) {
  const todas    = useFetch(()=>companiaId?evaluacionService.getHabilidades(companiaId):Promise.resolve({data:[]}),[companiaId])
  const asignadas = useFetch(()=>evaluacion?.id?evaluacionService.getEvalHabilidades(companiaId,evaluacion.id):Promise.resolve({data:[]}),[evaluacion?.id])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const asignadasIds = new Set(asignadas.data?.map(eh=>eh.habilidad)??[])

  const toggle = async (habId) => {
    setLoading(true); setMsg(null)
    try {
      if (asignadasIds.has(habId)) {
        const rel = asignadas.data.find(eh=>eh.habilidad===habId)
        await evaluacionService.desasignarHabilidad(companiaId, evaluacion.id, rel.id)
      } else {
        await evaluacionService.asignarHabilidad(companiaId, evaluacion.id, {
          habilidad:habId, orden:(asignadas.data?.length??0)+1,
          obligatoria:true, usuario_creacion:userId||1, compania:companiaId,
        })
      }
      asignadas.reload()
    } catch { setMsg({type:'error',text:'Error al actualizar.'}) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Habilidades — ${evaluacion?.descripcion}`} size="md">
      {msg && <Alert type="error" style={{marginBottom:10}}>{msg.text}</Alert>}
      {(todas.loading||asignadas.loading) ? <Spinner size="sm"/> : (
        <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:360,overflowY:'auto'}}>
          {!todas.data?.length ? (
            <div style={{textAlign:'center',color:'var(--text-muted)',padding:20}}>Sin habilidades en el banco.</div>
          ) : todas.data.map(h => {
            const activa = asignadasIds.has(h.id)
            return (
              <div key={h.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'12px 16px',borderRadius:10,
                background:activa?'var(--primary-bg)':'var(--bg)',
                border:`1.5px solid ${activa?'var(--primary-border)':'var(--border)'}`}}>
                <div>
                  <div style={{fontWeight:600,fontSize:'.9rem'}}>{h.descripcion}</div>
                  <div style={{fontSize:'.73rem',color:'var(--text-muted)'}}>
                    a={Number(h.discriminacion??0).toFixed(2)} · b={Number(h.dificultad??0).toFixed(2)} · c={Number(h.adivinabilidad??0).toFixed(2)}
                  </div>
                </div>
                <button onClick={()=>toggle(h.id)} disabled={loading} style={btn(activa?'danger':'success')}>
                  {activa?<><MdClose size={13}/>Quitar</>:<><MdCheck size={13}/>Asignar</>}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

// ── Modal CRUD Habilidad ──────────────────────────────────────
function ModalHabilidadForm({ open, onClose, habilidad, companiaId, onSaved }) {
  const isEdit = !!habilidad
  const [form, setForm] = useState({descripcion:'',dificultad:0.0,discriminacion:1.0,adivinabilidad:0.0})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    if(open){ setForm(habilidad?{descripcion:habilidad.descripcion??'',dificultad:habilidad.dificultad??0.0,discriminacion:habilidad.discriminacion??1.0,adivinabilidad:habilidad.adivinabilidad??0.0}:{descripcion:'',dificultad:0.0,discriminacion:1.0,adivinabilidad:0.0}); setMsg(null) }
  },[habilidad,open])

  const handleSave = async () => {
    if (!form.descripcion.trim()) { setMsg({type:'error',text:'Nombre obligatorio.'}); return }
    setLoading(true); setMsg(null)
    try {
      if (isEdit) await evaluacionService.updateHabilidad(companiaId, habilidad.id, {...form,compania:companiaId})
      else        await evaluacionService.createHabilidad(companiaId, {...form,compania:companiaId})
      onSaved(); onClose()
    } catch(e) { setMsg({type:'error',text:e?.response?.data?.detail||'Error.'}) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Editar Habilidad':'Nueva Habilidad'} size="sm">
      {msg && <Alert type="error" style={{marginBottom:12}}>{msg.text}</Alert>}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="Nombre *" value={form.descripcion} onChange={e=>set('descripcion',e.target.value)}/>
        <div style={{background:'var(--primary-bg)',borderRadius:10,padding:14,border:'1px solid var(--primary-border)'}}>
          <div style={{fontSize:'.78rem',fontWeight:700,color:'var(--primary)',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <MdInfo size={14}/> Parámetros TRI 3PL
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {[['discriminacion','a (discriminación)'],['dificultad','b (dificultad)'],['adivinabilidad','c (adivinab.)']].map(([k,l])=>(
              <div key={k}>
                <label style={{fontSize:'.73rem',fontWeight:600,display:'block',marginBottom:4}}>{l}</label>
                <input type="number" step="0.1" value={form[k]} onChange={e=>set(k,parseFloat(e.target.value)||0)}
                  style={{width:'100%',padding:'7px 10px',border:'1.5px solid var(--border)',borderRadius:7,fontFamily:'var(--font)',outline:'none',fontSize:'.88rem'}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
        <button onClick={onClose} disabled={loading} style={btn('ghost')}><MdClose size={14}/> Cancelar</button>
        <button onClick={handleSave} disabled={loading} style={btn('primary')}>
          <MdSave size={14}/> {isEdit?'Actualizar':'Crear'}
        </button>
      </div>
    </Modal>
  )
}

// ── Modal Preguntas — SIN evalId en las llamadas al service ───
function ModalPreguntas({ habilidad, companiaId, onClose }) {
  // FIX: getPreguntas(cid, hid) — sin eid
  const preguntas = useFetch(
    ()=>evaluacionService.getPreguntas(companiaId, habilidad.id),
    [companiaId, habilidad.id]
  )
  const DF = {contenido:'',criterio_a:1.0,criterio_b:0.0,criterio_c:0.1,
    opciones:[{contenido:'',ind_correcta:true},{contenido:'',ind_correcta:false},{contenido:'',ind_correcta:false},{contenido:'',ind_correcta:false}]}
  const [form, setForm]       = useState(DF)
  const [editPreg, setEditPreg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const setOpc = (i, k, v) => {
    setForm(f => {
      const ops = [...f.opciones]
      if (k === 'ind_correcta' && v) {
        ops.forEach((_, j) => {
          ops[j] = {
            ...ops[j],
            ind_correcta: j === i
          }
        })
      } else {
        ops[i] = {
          ...ops[i],
          [k]: v
        }
      }
      return {
        ...f,
        opciones: ops
      }
    })
  }
  const resetForm=()=>{setForm(DF);setEditPreg(null)}

  const handleSave = async () => {
    if (!form.contenido.trim()) { setMsg({type:'error',text:'Enunciado obligatorio.'}); return }
    const ops = form.opciones.filter(o=>o.contenido.trim())
    if (ops.length<2) { setMsg({type:'error',text:'Mínimo 2 opciones.'}); return }
    if (!ops.some(o=>o.ind_correcta)) { setMsg({type:'error',text:'Marca una opción correcta.'}); return }
    setLoading(true); setMsg(null)
    try {
      if (editPreg) {
        // FIX: updatePregunta(cid, hid, id, d) — sin eid
        await evaluacionService.updatePregunta(companiaId, habilidad.id, editPreg.id, {...form,ind_activa:true,opciones:ops})
      } else {
        // FIX: createPregunta(cid, hid, d) — sin eid
        await evaluacionService.createPregunta(companiaId, habilidad.id, {...form,ind_activa:true,opciones:ops})
      }
      setMsg({type:'ok',text:editPreg?'Pregunta actualizada.':'Pregunta creada.'})
      preguntas.reload(); resetForm()
    } catch { setMsg({type:'error',text:'Error al guardar.'}) }
    finally { setLoading(false) }
  }

  const handleEdit = async (p) => {
    setEditPreg(p); setMsg(null)
    try {
      // FIX: getRespuestas(cid, pid)
      const res = await evaluacionService.getRespuestas(companiaId, p.id)
      const ops = res.data.map(r=>({id:r.id,contenido:r.contenido,ind_correcta:r.ind_correcta}))
      while(ops.length<4) ops.push({contenido:'',ind_correcta:false})
      setForm({contenido:p.contenido,criterio_a:p.criterio_a,criterio_b:p.criterio_b,criterio_c:p.criterio_c,opciones:ops})
    } catch { setMsg({type:'error',text:'Error al cargar.'}) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar pregunta?')) return
    try {
      // FIX: deletePregunta(cid, hid, id) — sin eid
      await evaluacionService.deletePregunta(companiaId, habilidad.id, id)
      preguntas.reload()
    } catch { alert('Error al eliminar.') }
  }

  return (
    <Modal open onClose={onClose} title={`Preguntas — ${habilidad.descripcion}`} size="lg">
      {msg && <Alert type={msg.type==='ok'?'success':'error'} onClose={()=>setMsg(null)} style={{marginBottom:10}}>{msg.text}</Alert>}
      <div style={{maxHeight:240,overflowY:'auto',marginBottom:16}}>
        {preguntas.loading?<Spinner size="sm"/>: !preguntas.data?.length?(
          <div style={{textAlign:'center',color:'var(--text-muted)',padding:20,fontSize:'.85rem'}}>Sin preguntas. Crea la primera abajo.</div>
        ):preguntas.data.map((p,i)=>(
          <div key={p.id} style={{padding:'10px 14px',marginBottom:6,background:'var(--bg)',borderRadius:9,border:'1px solid var(--border)',display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:'.87rem',marginBottom:2,lineHeight:1.4}}>{i+1}. {p.contenido.slice(0,120)}{p.contenido.length>120?'…':''}</div>
              <div style={{fontSize:'.72rem',color:'var(--text-muted)'}}>a={p.criterio_a} · b={p.criterio_b} · c={p.criterio_c}</div>
            </div>
            <div style={{display:'flex',gap:5,flexShrink:0}}>
              <button onClick={()=>handleEdit(p)} style={btn('ghost',{padding:'5px 9px'})}><MdEdit size={13}/></button>
              <button onClick={()=>handleDelete(p.id)} style={btn('danger',{padding:'5px 9px'})}><MdDelete size={13}/></button>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:'var(--primary-bg)',borderRadius:12,padding:16,border:'1px solid var(--primary-border)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontWeight:700,color:'var(--primary)',fontSize:'.9rem',display:'flex',alignItems:'center',gap:5}}>
            {editPreg?<><MdEdit size={14}/>Editando</>:<><MdAdd size={14}/>Nueva Pregunta</>}
          </div>
          {editPreg&&<button onClick={resetForm} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'.8rem'}}>Cancelar edición</button>}
        </div>
        <textarea value={form.contenido} onChange={e=>set('contenido',e.target.value)} placeholder="Enunciado de la pregunta..."
          style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1.5px solid var(--border)',fontFamily:'var(--font)',fontSize:'.9rem',minHeight:68,resize:'vertical',outline:'none',marginBottom:12}}/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
          {[['criterio_a','a (discriminación)'],['criterio_b','b (dificultad)'],['criterio_c','c (adivinab.)']].map(([k,l])=>(
            <div key={k}>
              <label style={{fontSize:'.73rem',fontWeight:600,display:'block',marginBottom:4}}>{l}</label>
              <input type="number" step="0.1" value={form[k]} onChange={e=>set(k,parseFloat(e.target.value)||0)}
                style={{width:'100%',padding:'6px 10px',border:'1.5px solid var(--border)',borderRadius:6,fontFamily:'var(--font)',outline:'none',fontSize:'.88rem'}}/>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
          {form.opciones.map((op,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="radio" name="correcta" checked={!!op.ind_correcta} onChange={()=>setOpc(i,'ind_correcta',true)}
                style={{cursor:'pointer',width:15,height:15,flexShrink:0,accentColor:'#15803d'}}/>
              <input value={op.contenido} onChange={e=>setOpc(i,'contenido',e.target.value)} placeholder={`Opción ${String.fromCharCode(65+i)}`}
                style={{flex:1,padding:'7px 12px',borderRadius:8,fontFamily:'var(--font)',fontSize:'.88rem',outline:'none',
                  border:`1.5px solid ${op.ind_correcta?'#86efac':'var(--border)'}`,background:op.ind_correcta?'#f0fdf4':'var(--input-bg)'}}/>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={loading} style={btn('primary',{padding:'8px 16px'})}>
          {loading?<Spinner size="xs"/>:<MdSave size={14}/>} {editPreg?'Actualizar':'Guardar'}
        </button>
      </div>
    </Modal>
  )
}

// ── Tab Evaluación por Vacante ────────────────────────────────
function TabEvalVacante({ companiaId, userId }) {
  const evaluaciones = useFetch(()=>evaluacionService.getEvaluaciones(companiaId),[companiaId])
  const vacantes     = useFetch(()=>vacantesService.vVacantes(companiaId),[companiaId])
  const evalVacantes = useFetch(()=>evaluacionService.getEvalVacantes(companiaId),[companiaId])
  const [form, setForm] = useState({vacante:'',evaluacion:'',descripcion:'',ind_activa:true,fecha_inicio:'',fecha_fin:''})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const listaEvals = useMemo(()=>{const d=evaluaciones.data; if(!d) return []; if(Array.isArray(d)) return d; return d.evaluaciones??[]},[evaluaciones.data])

  const handleCreate = async () => {
    if (!form.vacante||!form.evaluacion) { setMsg({type:'error',text:'Vacante y evaluación son obligatorias.'}); return }
    setLoading(true); setMsg(null)
    try {
      await evaluacionService.createEvalVacante(companiaId,{...form,compania:companiaId,usuario_creacion:userId||1,vacante:Number(form.vacante),evaluacion:Number(form.evaluacion)})
      setMsg({type:'ok',text:'Asignación creada.'})
      setForm({vacante:'',evaluacion:'',descripcion:'',ind_activa:true,fecha_inicio:'',fecha_fin:''})
      evalVacantes.reload()
    } catch(e){ setMsg({type:'error',text:e?.response?.data?.detail||'Error.'}) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar asignación?')) return
    try { await evaluacionService.deleteEvalVacante(companiaId, id); evalVacantes.reload() }
    catch { alert('Error.') }
  }

  const sel=(label,campo,items,display)=>(
    <div>
      <label style={{fontSize:'.78rem',fontWeight:600,display:'block',marginBottom:5}}>{label}</label>
      <select value={form[campo]} onChange={e=>set(campo,e.target.value)}
        style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontFamily:'var(--font)',fontSize:'.88rem',outline:'none'}}>
        <option value="">Seleccionar...</option>
        {items?.map(i=><option key={i.id} value={i.id}>{display(i)}</option>)}
      </select>
    </div>
  )

  return (
    <div>
      <div style={{background:'#fef9c3',borderRadius:10,padding:'10px 16px',marginBottom:18,fontSize:'.83rem',color:'#92400e',border:'1px solid #fde68a',display:'flex',alignItems:'center',gap:8}}>
        <MdInfo size={15}/> Solo disponible cuando la compañía tiene <strong>ind_evaluacion_vacante = TRUE</strong>.
        Solo puede haber 1 asignación activa por vacante.
      </div>
      {msg && <Alert type={msg.type==='ok'?'success':'error'} onClose={()=>setMsg(null)} style={{marginBottom:14}}>{msg.text}</Alert>}
      <Card style={{marginBottom:20}}>
        <div style={{fontSize:'.88rem',fontWeight:700,marginBottom:14,display:'flex',alignItems:'center',gap:6}}><MdAdd size={15}/> Nueva Asignación Vacante ↔ Evaluación</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          {sel('Vacante *','vacante',vacantes.data?.filter(v=>v.ind_activa),v=>v.descripcion?.slice(0,50))}
          {sel('Evaluación *','evaluacion',listaEvals,e=>e.descripcion)}
          <div>
            <label style={{fontSize:'.78rem',fontWeight:600,display:'block',marginBottom:5}}>Fecha Inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={e=>set('fecha_inicio',e.target.value)}
              style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontFamily:'var(--font)',fontSize:'.88rem',outline:'none'}}/>
          </div>
          <div>
            <label style={{fontSize:'.78rem',fontWeight:600,display:'block',marginBottom:5}}>Fecha Fin</label>
            <input type="date" value={form.fecha_fin} onChange={e=>set('fecha_fin',e.target.value)}
              style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontFamily:'var(--font)',fontSize:'.88rem',outline:'none'}}/>
          </div>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:14}}>
          <input type="checkbox" checked={!!form.ind_activa} onChange={e=>set('ind_activa',e.target.checked)} style={{width:15,height:15}}/>
          <span style={{fontSize:'.88rem',fontWeight:500}}>Activa</span>
        </label>
        <button onClick={handleCreate} disabled={loading} style={btn('primary')}>
          {loading?<Spinner size="xs"/>:<MdAdd size={14}/>} Crear Asignación
        </button>
      </Card>
      {evalVacantes.loading?<Spinner size="sm"/>:(
        evalVacantes.data?.length===0
          ? <div style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>Sin asignaciones.</div>
          : <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {evalVacantes.data.map(ev=>(
                <div key={ev.id} style={{padding:'12px 16px',borderRadius:10,
                  border:`1.5px solid ${ev.ind_activa?'var(--primary-border)':'var(--border)'}`,
                  background:ev.ind_activa?'var(--primary-bg)':'var(--bg)',
                  display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:'.9rem'}}>Vacante #{ev.vacante} → Eval #{ev.evaluacion}</div>
                    <div style={{fontSize:'.75rem',color:'var(--text-muted)',marginTop:2}}>
                      {ev.fecha_inicio&&`Desde: ${ev.fecha_inicio}`}{ev.fecha_fin&&` · Hasta: ${ev.fecha_fin}`}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <Badge variant={ev.ind_activa?'success':'danger'}>{ev.ind_activa?'Activa':'Inactiva'}</Badge>
                    <button onClick={()=>handleDelete(ev.id)} style={btn('danger',{padding:'5px 9px'})}><MdDelete size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function GestionEvaluaciones() {
  const { user } = useAuth()
  const cid      = user?.compania

  const todasHabilidades = useFetch(()=>cid?evaluacionService.getHabilidades(cid):Promise.resolve({data:[]}),[cid])
  const evaluaciones     = useFetch(()=>cid?evaluacionService.getEvaluaciones(cid):Promise.resolve({data:[]}),[cid])
  const [evalSel, setEvalSel] = useState(null)
  const habsAsignadas = useFetch(
    ()=>evalSel?.id?evaluacionService.getEvalHabilidades(cid,evalSel.id):Promise.resolve({data:[]}),
    [evalSel?.id])
  const habsAsignadasIds = new Set(habsAsignadas.data?.map(eh=>eh.habilidad)??[])
  const habsMostradas = evalSel?(todasHabilidades.data??[]).filter(h=>habsAsignadasIds.has(h.id)):(todasHabilidades.data??[])
  const listaEvals = useMemo(()=>{const d=evaluaciones.data; if(!d) return []; if(Array.isArray(d)) return d; return d.evaluaciones??[]},[evaluaciones.data])
  const modoVacante = useMemo(()=>{const d=evaluaciones.data; return d?.modo==='vacante'},[evaluaciones.data])

  const [modalEval,    setModalEval]    = useState(null)
  const [modalAsignar, setModalAsignar] = useState(null)
  const [panelPreg,    setPanelPreg]    = useState(null)
  const [modalHabForm, setModalHabForm] = useState(null)
  const [tab, setTab] = useState('evaluaciones')

  const handleDeleteEval = async (id) => {
    if (!confirm('¿Eliminar esta evaluación?')) return
    try { await evaluacionService.deleteEvaluacion(cid, id); if(evalSel?.id===id) setEvalSel(null); evaluaciones.reload() }
    catch { alert('Error al eliminar.') }
  }
  const handleDeleteHabilidad = async (id) => {
    if (!confirm('¿Eliminar habilidad?')) return
    try { await evaluacionService.deleteHabilidad(cid, id); todasHabilidades.reload() }
    catch { alert('Error al eliminar.') }
  }

  const TABS = [
    {id:'evaluaciones',label:'Evaluaciones',icon:MdAssignment},
    {id:'habilidades', label:'Habilidades', icon:BiBrain},
    ...(modoVacante?[{id:'por_vacante',label:'Por Vacante',icon:MdLink}]:[]),
  ]

  return (
    <div>
      <PageHeader title="Configuración de Evaluaciones"
        subtitle="Motor CAT TRI 3PL · Gestión de evaluaciones y banco de ítems"
        action={<div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:99,background:'var(--primary-bg)',border:'1px solid var(--primary-border)',color:'var(--primary)',fontSize:'.79rem',fontWeight:600}}><MdSettings size={14}/> TRI 3PL</div>}/>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:'2px solid var(--border)',paddingBottom:0}}>
        {TABS.map(t=>{const Ic=t.icon; return(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'9px 20px',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontSize:'.87rem',fontWeight:600,background:'transparent',transition:'all .15s',marginBottom:-2,
            borderBottom:tab===t.id?'2px solid var(--primary)':'2px solid transparent',
            color:tab===t.id?'var(--primary)':'var(--text-muted)',display:'flex',alignItems:'center',gap:7}}>
            <Ic size={16}/> {t.label}
          </button>
        )})}
      </div>

      {/* Tab Evaluaciones */}
      {tab==='evaluaciones' && (
        <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:20,alignItems:'start'}}>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <h3 style={{margin:0,fontSize:'.92rem',fontWeight:700}}>Evaluaciones</h3>
              <button onClick={()=>setModalEval('new')} style={btn('primary',{padding:'6px 10px'})}><MdAdd size={14}/> Nueva</button>
            </div>
            {evaluaciones.loading?<Spinner size="sm"/>: !listaEvals.length?(
              <div style={{textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:'.85rem'}}>Sin evaluaciones.</div>
            ):listaEvals.map(e=>(
              <div key={e.id} style={{padding:'12px 14px',borderRadius:10,marginBottom:8,cursor:'pointer',
                border:`2px solid ${evalSel?.id===e.id?'var(--primary)':'var(--border)'}`,
                background:evalSel?.id===e.id?'var(--primary-bg)':'var(--bg)',transition:'all .15s'}}
                onClick={()=>setEvalSel(e)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div style={{flex:1,paddingRight:8}}>
                    <div style={{fontWeight:700,fontSize:'.88rem'}}>{e.descripcion}</div>
                    <div style={{fontSize:'.72rem',color:'var(--text-muted)',marginTop:2}}>{e.total_habilidades??0} habilidad(es) · ID {e.id}</div>
                  </div>
                  <Badge variant={e.ind_activa?'success':'danger'}>{e.ind_activa?'Activa':'Inactiva'}</Badge>
                </div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <button onClick={ev=>{ev.stopPropagation();setModalAsignar(e)}} style={btn('ghost',{padding:'4px 9px',fontSize:'.76rem'})}><BiBrain size={12}/> Habilidades</button>
                  <button onClick={ev=>{ev.stopPropagation();setModalEval(e)}} style={btn('ghost',{padding:'4px 9px',fontSize:'.76rem'})}><MdEdit size={12}/></button>
                  <button onClick={ev=>{ev.stopPropagation();handleDeleteEval(e.id)}} style={btn('danger',{padding:'4px 9px',fontSize:'.76rem'})}><MdDelete size={12}/></button>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            {!evalSel?(
              <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)'}}>
                <MdAssignment size={40} style={{opacity:.2,marginBottom:12}}/>
                <p>Selecciona una evaluación para ver sus habilidades.</p>
              </div>
            ):(
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div>
                    <h3 style={{margin:'0 0 3px',fontSize:'.95rem',fontWeight:700}}>{evalSel.descripcion}</h3>
                    <p style={{margin:0,fontSize:'.76rem',color:'var(--text-muted)'}}>Haz clic en una habilidad para ver sus preguntas.</p>
                  </div>
                  <button onClick={()=>setModalAsignar(evalSel)} style={btn('primary')}><BiBrain size={14}/> Configurar Habilidades</button>
                </div>
                {habsAsignadas.loading?<Spinner size="sm"/>: !habsMostradas.length?(
                  <div style={{textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:'.85rem'}}>Sin habilidades asignadas.</div>
                ):(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
                    {habsMostradas.map(h=>(
                      <div key={h.id} style={{borderRadius:12,border:'1.5px solid var(--border)',background:'var(--card)',padding:16}}>
                        <div style={{fontWeight:700,fontSize:'.9rem',marginBottom:6}}>{h.descripcion}</div>
                        <div style={{fontSize:'.73rem',color:'var(--text-muted)',marginBottom:12}}>
                          a={Number(h.discriminacion??0).toFixed(2)} · b={Number(h.dificultad??0).toFixed(2)} · c={Number(h.adivinabilidad??0).toFixed(2)}
                        </div>
                        <button onClick={()=>setPanelPreg(h)} style={btn('primary',{width:'100%',justifyContent:'center'})}>
                          <MdQuiz size={14}/> Ver Preguntas
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Tab Habilidades */}
      {tab==='habilidades' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{margin:0,fontSize:'.95rem',fontWeight:700}}>Banco de Habilidades de la Compañía</h3>
            <button onClick={()=>setModalHabForm('new')} style={btn('primary')}><MdAdd size={14}/> Nueva Habilidad</button>
          </div>
          {todasHabilidades.loading?<Spinner label="Cargando..."/>: !todasHabilidades.data?.length?(
            <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}><BiBrain size={40} style={{opacity:.2,marginBottom:12}}/><p>Sin habilidades.</p></div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
              {todasHabilidades.data.map(h=>(
                <div key={h.id} style={{borderRadius:12,border:'1.5px solid var(--border)',background:'var(--card)',padding:16}}>
                  <div style={{fontWeight:700,fontSize:'.92rem',marginBottom:6}}>{h.descripcion}</div>
                  <div style={{fontSize:'.74rem',color:'var(--text-muted)',marginBottom:14}}>
                    a={Number(h.discriminacion??0).toFixed(2)} · b={Number(h.dificultad??0).toFixed(2)} · c={Number(h.adivinabilidad??0).toFixed(2)}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>setModalHabForm(h)} style={btn('ghost',{flex:1,justifyContent:'center'})}><MdEdit size={13}/> Editar</button>
                    <button onClick={()=>handleDeleteHabilidad(h.id)} style={btn('danger',{padding:'6px 9px'})}><MdDelete size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Por Vacante (solo si modo vacante) */}
      {tab==='por_vacante' && modoVacante && (
        <TabEvalVacante companiaId={cid} userId={user?.id}/>
      )}

      {/* Modales */}
      {(modalEval==='new'||(modalEval&&typeof modalEval==='object')) && (
        <ModalEvaluacion open onClose={()=>setModalEval(null)}
          evaluacion={modalEval==='new'?null:modalEval} companiaId={cid} userId={user?.id}
          onSaved={()=>{evaluaciones.reload();habsAsignadas.reload()}}/>
      )}
      {modalAsignar && (
        <ModalAsignarHabilidades open onClose={()=>setModalAsignar(null)}
          evaluacion={modalAsignar} companiaId={cid} userId={user?.id}/>
      )}
      {panelPreg && (
        <ModalPreguntas habilidad={panelPreg} companiaId={cid} onClose={()=>setPanelPreg(null)}/>
      )}
      {(modalHabForm==='new'||(modalHabForm&&typeof modalHabForm==='object')) && (
        <ModalHabilidadForm open onClose={()=>setModalHabForm(null)}
          habilidad={modalHabForm==='new'?null:modalHabForm} companiaId={cid}
          onSaved={()=>todasHabilidades.reload()}/>
      )}
    </div>
  )
}

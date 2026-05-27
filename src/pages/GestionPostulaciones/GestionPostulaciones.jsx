// src/pages/GestionPostulaciones/GestionPostulaciones.jsx — v7
// Dashboard con filtros configurables, etiquetas en gráficas, descripciones
import { useState, useMemo, useRef } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LabelList,
} from 'recharts'
import { useFetch }  from '../../hooks/useFetch'
import { useAuth }   from '../../context/AuthContext'
import { candidatosService, vacantesService } from '../../services'
import api from '../../api/axios'
import {
  PageHeader, SearchBar, Table, Badge, Button,
  Modal, Alert, Spinner, Card,
} from '../../components/ui'
import {
  MdAdd, MdBarChart, MdTableChart, MdFilterList,
  MdDownload, MdGavel, MdCheckCircle, MdCancel,
  MdRefresh, MdInfo, MdTrendingUp, MdOutlineCreateNewFolder
} from 'react-icons/md'

// ── Utilidades ────────────────────────────────────────────────
const C_ESTADO   = { Recibida:'info','En Evaluación':'warning',Seleccionado:'success',Descartado:'danger',Finalizado:'primary' }
const C_DECISION = { SELECCIONADO:'success',DESCARTADO:'danger','EN PROCESO':'warning',FINALIZADO:'primary' }
const PALETTE    = ['#2563eb','#15803d','#f59e0b','#ef4444','#7c3aed','#0891b2','#ca8a04']

function nBadge(v, map) { return <Badge variant={map[v]||'info'}>{v||'—'}</Badge> }

function exportarExcel(datos, cols, nombre) {
  const csv = [cols.map(c=>c.label), ...datos.map(r=>cols.map(c=>String(r[c.key]??'').replace(/"/g,'""')))]
    .map(r=>r.map(v=>`"${v}"`).join(';')).join('\n')
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})),
    download: `${nombre}.csv`,
  }); a.click()
}

async function exportarGrafica(ref, fmt, nombre) {
  const svg = ref.current?.querySelector('svg'); if(!svg){alert('Sin gráfica.');return}
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}))
  const img = Object.assign(new Image(),{crossOrigin:'anonymous',src:url})
  await new Promise(r=>{img.onload=r})
  const c=document.createElement('canvas'); const sc=2
  c.width=img.naturalWidth*sc; c.height=img.naturalHeight*sc
  const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height)
  ctx.scale(sc,sc); ctx.drawImage(img,0,0); URL.revokeObjectURL(url)
  if(fmt==='pdf'){const w=window.open('','_blank');w.document.write(`<html><body style="margin:0;padding:16px"><img src="${c.toDataURL('image/png')}" style="max-width:100%"/></body></html>`);w.document.close();setTimeout(()=>w.print(),400);return}
  Object.assign(document.createElement('a'),{href:c.toDataURL({png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[fmt]??'image/png',0.95),download:`${nombre}.${fmt}`}).click()
}

// ── Tooltip ───────────────────────────────────────────────────
const TT = ({active,payload,label}) => {
  if(!active||!payload?.length) return null
  return (
    <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:'.8rem',boxShadow:'0 4px 20px rgba(0,0,0,.1)'}}>
      {label && <div style={{fontWeight:700,marginBottom:5}}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.fill||p.color,marginBottom:2}}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── Toolbar de exportación ────────────────────────────────────
function ExportBtns({refEl,nombre,onExcel,data,cols}) {
  return (
    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
      {onExcel && (
        <button onClick={()=>exportarExcel(data,cols,nombre)}
          style={{padding:'4px 10px',borderRadius:6,border:'1px solid #bbf7d0',background:'#f0fdf4',
            cursor:'pointer',fontFamily:'var(--font)',fontSize:'.72rem',fontWeight:600,color:'#15803d',
            display:'flex',alignItems:'center',gap:4}}>
          <MdDownload size={13}/> Excel
        </button>
      )}
      {refEl && ['PNG','PDF'].map(f=>(
        <button key={f} onClick={()=>exportarGrafica(refEl,f.toLowerCase(),nombre)}
          style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg)',
            cursor:'pointer',fontFamily:'var(--font)',fontSize:'.72rem',fontWeight:600,color:'var(--text-muted)',
            display:'flex',alignItems:'center',gap:4}}>
          <MdDownload size={13}/> {f}
        </button>
      ))}
    </div>
  )
}

// ── Columnas ──────────────────────────────────────────────────
const COLS_POST = [
  {key:'id',label:'ID',width:55},
  {key:'candidato_nombre_completo',label:'Candidato'},
  {key:'vacante_descripcion',label:'Vacante',render:v=><span title={v}>{v?.slice(0,40)}{v?.length>40?'…':''}</span>},
  {key:'estado_descripcion',label:'Estado',width:130,render:v=>nBadge(v,C_ESTADO)},
  {key:'fecha_postulacion',label:'Fecha',width:100,render:v=>v?new Date(v).toLocaleDateString('es-CO'):'—'},
]
const COLS_REP = [
  {key:'candidato_nombre_completo',label:'Candidato'},
  {key:'vacante',label:'Vacante',render:v=><span title={v}>{v?.slice(0,35)}{v?.length>35?'…':''}</span>},
  {key:'estado_postulacion',label:'Estado',width:130,render:v=>nBadge(v,C_ESTADO)},
  {key:'decision',label:'Decisión',width:120,render:v=>v?nBadge(v,C_DECISION):<span style={{color:'var(--text-muted)'}}>—</span>},
  {key:'theta_final',label:'θ Final',width:90,render:v=>v!=null?<strong style={{color:'var(--primary)'}}>{Number(v).toFixed(3)}</strong>:'—'},
  {key:'estado_intento',label:'Evaluación',width:110,render:v=>v?nBadge(v,{Completado:'success','En Progreso':'warning'}):'—'},
  {key:'duracion_minutos',label:'Duración',width:80,render:v=>v!=null?`${v} min`:'—'},
]
const COLS_EXP = [
  {key:'candidato_nombre_completo',label:'Candidato'},{key:'vacante',label:'Vacante'},
  {key:'unidad',label:'Unidad'},{key:'estado_postulacion',label:'Estado'},{key:'decision',label:'Decisión'},
  {key:'theta_final',label:'θ Final'},{key:'error_estandar_final',label:'SE(θ)'},
  {key:'estado_intento',label:'Estado Evaluación'},{key:'duracion_minutos',label:'Duración (min)'},
  {key:'candidato_email',label:'Email'},{key:'candidato_telefono',label:'Teléfono'},
]

// ── Gráficas configurables ────────────────────────────────────
const GRAFICAS_DEF = [
  {
    id:'candidatos_vacante', label:'Candidatos × Vacante',
    desc:'Cuántos candidatos se han postulado a cada vacante.',
    campo:'vacante', tipo:'bar',
  },
  {
    id:'estados', label:'Distribución de Estados',
    desc:'Distribución de postulaciones según su estado actual en el proceso.',
    campo:'estado_postulacion', tipo:'pie',
  },
  {
    id:'decisiones', label:'Toma de Decisiones',
    desc:'Resumen de las decisiones tomadas por los analistas sobre las postulaciones.',
    campo:'decision', tipo:'pie',
  },
  {
    id:'theta_vacante', label:'θ Promedio × Vacante',
    desc:'Nivel de competencia estimado (θ) promedio de los candidatos evaluados por vacante.',
    campo:'vacante', metrica:'theta_final', tipo:'bar_avg',
  },
  {
    id:'unidad', label:'Candidatos × Unidad Org.',
    desc:'Distribución de postulaciones por unidad organizacional.',
    campo:'unidad', tipo:'bar',
  },
]

function GraficasPostulaciones({ data }) {
  const [graficaId, setGraficaId]         = useState('candidatos_vacante')
  const [filtroCampo, setFiltroCampo]     = useState('')
  const [filtroValor, setFiltroValor]     = useState('todos')
  const [etiquetas, setEtiquetas]         = useState(true)
  const [topN, setTopN]                   = useState(10)
  const ref = useRef(null)

  const grafDef = GRAFICAS_DEF.find(g => g.id === graficaId) || GRAFICAS_DEF[0]

  // Valores únicos del campo de filtro
  const valoresFiltro = useMemo(() => {
    if (!filtroCampo) return []
    const s = new Set(data.map(r => String(r[filtroCampo]||'—')).filter(Boolean))
    return ['todos', ...Array.from(s).sort()]
  }, [data, filtroCampo])

  // Datos filtrados
  const dataFiltrada = useMemo(() => {
    if (!filtroCampo || filtroValor === 'todos') return data
    return data.filter(r => String(r[filtroCampo]||'—') === filtroValor)
  }, [data, filtroCampo, filtroValor])

  // Datos para la gráfica
  const chartData = useMemo(() => {
    if (!dataFiltrada.length) return []
    if (grafDef.tipo === 'bar' || grafDef.tipo === 'pie') {
      const g = {}
      dataFiltrada.forEach(r => { const k=(r[grafDef.campo]||'Sin dato').slice?.(0,30)||'Sin dato'; g[k]=(g[k]||0)+1 })
      return Object.entries(g).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,topN)
    }
    if (grafDef.tipo === 'bar_avg') {
      const g = {}
      dataFiltrada.forEach(r => {
        const k=(r[grafDef.campo]||'Sin dato').slice?.(0,25)||'Sin dato'
        if(!g[k]) g[k]=[]
        if(r[grafDef.metrica]!=null) g[k].push(r[grafDef.metrica])
      })
      return Object.entries(g).filter(([,v])=>v.length>0)
        .map(([name,vals])=>({name,valor:+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(3),n:vals.length}))
        .sort((a,b)=>b.valor-a.valor).slice(0,topN)
    }
    return []
  }, [dataFiltrada, grafDef, topN])

  return (
    <Card style={{marginBottom:20}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:10}}>
        <div>
          <h3 style={{margin:'0 0 4px',fontSize:'.95rem',fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
            <MdBarChart size={17} color="var(--primary)"/> Análisis de Postulaciones
          </h3>
          <p style={{margin:0,fontSize:'.77rem',color:'var(--text-muted)'}}>{grafDef.desc}</p>
        </div>
        <ExportBtns refEl={ref} nombre={`grafica_${graficaId}`}/>
      </div>

      {/* Selector de gráfica */}
      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
        {GRAFICAS_DEF.map(g=>(
          <button key={g.id} onClick={()=>setGraficaId(g.id)} title={g.desc}
            style={{padding:'5px 12px',borderRadius:99,border:'none',cursor:'pointer',
              fontFamily:'var(--font)',fontSize:'.77rem',fontWeight:600,transition:'all .15s',
              background:graficaId===g.id?'var(--primary)':'var(--border)',
              color:graficaId===g.id?'#fff':'var(--text)'}}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Controles de filtro y configuración */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14,
        padding:'10px 14px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'.8rem',fontWeight:600,color:'var(--text-muted)'}}>
          <MdFilterList size={14}/> Filtrar por:
        </div>

        {/* Campo de filtro */}
        <select value={filtroCampo} onChange={e=>{setFiltroCampo(e.target.value);setFiltroValor('todos')}}
          style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--border)',
            fontFamily:'var(--font)',fontSize:'.79rem',outline:'none',cursor:'pointer'}}>
          <option value="">— Sin filtro —</option>
          <option value="estado_postulacion">Estado</option>
          <option value="decision">Decisión</option>
          <option value="vacante">Vacante</option>
          <option value="unidad">Unidad Org.</option>
        </select>

        {/* Valor del filtro */}
        {filtroCampo && (
          <select value={filtroValor} onChange={e=>setFiltroValor(e.target.value)}
            style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--border)',
              fontFamily:'var(--font)',fontSize:'.79rem',outline:'none',cursor:'pointer'}}>
            {valoresFiltro.map(v=><option key={v} value={v}>{v==='todos'?'Todos':v}</option>)}
          </select>
        )}

        {/* Top N */}
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'.79rem'}}>
          <span style={{color:'var(--text-muted)',fontWeight:600}}>Top</span>
          <select value={topN} onChange={e=>setTopN(Number(e.target.value))}
            style={{padding:'4px 8px',borderRadius:6,border:'1px solid var(--border)',
              fontFamily:'var(--font)',fontSize:'.79rem',outline:'none',cursor:'pointer'}}>
            {[5,10,15,20].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Etiquetas */}
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'.79rem',cursor:'pointer'}}>
          <input type="checkbox" checked={etiquetas} onChange={e=>setEtiquetas(e.target.checked)}
            style={{width:14,height:14}}/>
          Etiquetas
        </label>

        <span style={{marginLeft:'auto',fontSize:'.76rem',color:'var(--text-muted)'}}>
          {dataFiltrada.length} registros
        </span>
      </div>

      {/* Gráfica */}
      <div ref={ref}>
        {!chartData.length ? (
          <div style={{textAlign:'center',color:'var(--text-muted)',padding:32,fontSize:'.85rem'}}>
            Sin datos para mostrar con los filtros actuales.
          </div>
        ) : grafDef.tipo==='pie' ? (
          <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
            <ResponsiveContainer width="55%" height={230}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}
                  label={etiquetas ? ({name,percent})=>`${name.slice(0,14)}: ${(percent*100).toFixed(0)}%` : false}
                  labelLine={etiquetas}>
                  {chartData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                </Pie>
                <Tooltip content={<TT/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1,minWidth:120}}>
              <div style={{fontSize:'.78rem',fontWeight:700,color:'var(--text-h)',marginBottom:8}}>
                Detalle
              </div>
              {chartData.map((d,i)=>(
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                  <div style={{width:10,height:10,borderRadius:3,background:PALETTE[i%PALETTE.length],flexShrink:0}}/>
                  <span style={{fontSize:'.8rem',flex:1}}>{d.name}</span>
                  <strong style={{fontSize:'.85rem',color:PALETTE[i%PALETTE.length]}}>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{top:18,right:10,left:-10,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="name" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey={grafDef.tipo==='bar_avg'?'valor':'value'}
                name={grafDef.label} fill="var(--primary)" radius={[5,5,0,0]}>
                {etiquetas && (
                  <LabelList dataKey={grafDef.tipo==='bar_avg'?'valor':'value'}
                    position="top" style={{fontSize:10,fill:'var(--text-muted)'}}/>
                )}
                {chartData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

// ── Modal: Nueva Postulación ──────────────────────────────────
function ModalPostular({open,onClose,compania,onSaved}) {
  const [form,setForm]=useState({vacante:'',candidato:'',descripcion:''})
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState(null)
  const vacantes   = useFetch(()=>vacantesService.vVacantes(compania),[compania])
  const candidatos = useFetch(()=>candidatosService.vCandidatos(compania),[compania])
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const sel=(label,campo,items,display)=>(
    <div>
      <label style={{fontSize:'.8rem',fontWeight:600,display:'block',marginBottom:5}}>{label}</label>
      <select value={form[campo]} onChange={e=>set(campo,e.target.value)}
        style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border)',
          fontFamily:'var(--font)',fontSize:'.88rem',outline:'none'}}>
        <option value="">Seleccionar...</option>
        {items?.map(i=><option key={i.id} value={i.id}>{display(i)}</option>)}
      </select>
    </div>
  )
  const handleSubmit=async()=>{
    if(!form.vacante||!form.candidato){setMsg({type:'error',text:'Vacante y candidato son obligatorios.'});return}
    setLoading(true);setMsg(null)
    try{
      const res=await candidatosService.createPostulacion(compania,form)
      setMsg({type:'ok',text:res.data.correo_enviado?'✅ Postulación creada. Correo enviado.':'✅ Postulación creada.'})
      onSaved();setTimeout(()=>{setMsg(null);onClose()},2500)
    }catch(e){setMsg({type:'error',text:e?.response?.data?.detail||'Error.'})}
    finally{setLoading(false)}
  }
  return(
    <Modal open={open} onClose={onClose} title="Nueva Postulación" size="md">
      {msg&&<Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:12}}>{msg.text}</Alert>}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {sel('Vacante *','vacante',vacantes.data?.filter(v=>v.ind_activa),v=>v.descripcion?.slice(0,60))}
        {sel('Candidato *','candidato',candidatos.data,c=>c.nombre_completo||`Candidato #${c.id}`)}
        <div>
          <label style={{fontSize:'.8rem',fontWeight:600,display:'block',marginBottom:5}}>Observaciones</label>
          <textarea value={form.descripcion} onChange={e=>set('descripcion',e.target.value)}
            style={{width:'100%',padding:'9px 14px',borderRadius:8,border:'1.5px solid var(--border)',
              fontFamily:'var(--font)',fontSize:'.9rem',minHeight:60,resize:'vertical',outline:'none'}}
            placeholder="Notas del analista..."/>
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
function ModalDecision({open,onClose,fila,compania,userId,onSaved}) {
  const [estadoId,setEstadoId]=useState('')
  const [obs,setObs]=useState('')
  const [paso,setPaso]=useState('form')
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState(null)
  const estadosBD = useFetch(()=>candidatosService.getEstadosPost())
  const estadosDecision = useMemo(
    ()=>(estadosBD.data||[]).filter(e=>['Seleccionado','Descartado'].includes(e.descripcion)),
    [estadosBD.data])
  useMemo(()=>{if(open&&fila){setEstadoId('');setObs(fila.observaciones||'');setPaso('form');setMsg(null)}},[open,fila])
  const estadoDesc=estadosDecision.find(e=>String(e.id)===String(estadoId))?.descripcion||''
  const handleEnviar=async()=>{
    setLoading(true);setMsg(null)
    try{
      const res=await api.post(`/api/candidatos/companias/${compania}/postulaciones/${fila.postulacion_id||fila.id}/decision/`,
        {estado_id:Number(estadoId),observaciones:obs,usuario_modificacion:userId})
      setMsg({type:'ok',text:res.data.message||'✅ Decisión registrada.'})
      onSaved();setTimeout(()=>{setMsg(null);onClose()},2500)
    }catch(e){setMsg({type:'error',text:e?.response?.data?.detail||'Error.'});setPaso('form')}
    finally{setLoading(false)}
  }
  if(!fila) return null
  return(
    <Modal open={open} onClose={onClose} title={`Decisión — ${fila.candidato_nombre_completo||''}`} size="md">
      {msg&&<Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:12}}>{msg.text}</Alert>}
      {/* Resumen */}
      <div style={{background:'var(--primary-bg)',borderRadius:10,padding:'12px 16px',marginBottom:14,
        border:'1px solid var(--primary-border)',fontSize:'.84rem',
        display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px 14px'}}>
        <div><strong>Vacante:</strong> {fila.vacante||fila.vacante_descripcion||'—'}</div>
        <div><strong>Evaluación:</strong> {fila.estado_intento||'—'}</div>
        <div><strong>θ Final:</strong> {fila.theta_final!=null?<span style={{color:'var(--primary)',fontWeight:700}}>{Number(fila.theta_final).toFixed(3)}</span>:'Sin evaluación'}</div>
        <div><strong>Duración:</strong> {fila.duracion_minutos!=null?`${fila.duracion_minutos} min`:'—'}</div>
        <div><strong>Decisión anterior:</strong> {fila.decision||'Ninguna'}</div>
        <div><strong>Email:</strong> {fila.candidato_email||'—'}</div>
      </div>
      {paso==='form'?(
        <>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:'.85rem',fontWeight:700,display:'block',marginBottom:8}}>
              Estado de Decisión *
              <span style={{fontSize:'.75rem',color:'var(--text-muted)',fontWeight:400,marginLeft:8}}>
                Se notificará al candidato por correo.
              </span>
            </label>
            {estadosBD.loading?<Spinner size="sm"/>:(
              <div style={{display:'flex',gap:10}}>
                {estadosDecision.map(e=>{
                  const isSel=e.descripcion==='Seleccionado'; const activo=String(estadoId)===String(e.id)
                  return(
                    <button key={e.id} onClick={()=>setEstadoId(String(e.id))} style={{
                      flex:1,padding:'12px 10px',borderRadius:10,border:'2px solid',cursor:'pointer',
                      fontFamily:'var(--font)',fontSize:'.88rem',fontWeight:700,transition:'all .15s',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                      borderColor:activo?(isSel?'#15803d':'#dc2626'):'var(--border)',
                      background:activo?(isSel?'#15803d':'#dc2626'):'var(--bg)',
                      color:activo?'#fff':'var(--text)',
                    }}>
                      {isSel?<MdCheckCircle size={16}/>:<MdCancel size={16}/>} {e.descripcion}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:'.85rem',fontWeight:700,display:'block',marginBottom:6}}>
              Justificación / Observaciones
            </label>
            <textarea value={obs} onChange={e=>setObs(e.target.value)}
              style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1.5px solid var(--border)',
                fontFamily:'var(--font)',fontSize:'.9rem',minHeight:80,resize:'vertical',outline:'none'}}
              placeholder="Describe la razón de la decisión..."/>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button icon="→" onClick={()=>{if(!estadoId){setMsg({type:'error',text:'Selecciona un estado.'});return}setMsg(null);setPaso('confirm')}}>
              Revisar y confirmar
            </Button>
          </div>
        </>
      ):(
        <div style={{textAlign:'center',paddingTop:10}}>
          <div style={{fontSize:'3rem',marginBottom:12}}>{estadoDesc==='Seleccionado'?'✅':'❌'}</div>
          <h3 style={{marginBottom:8}}>¿Confirmar decisión?</h3>
          <p style={{color:'var(--text-muted)',marginBottom:5}}>Candidato: <strong>{fila.candidato_nombre_completo}</strong></p>
          <p style={{color:'var(--text-muted)',marginBottom:5}}>Decisión: <strong style={{color:estadoDesc==='Seleccionado'?'#15803d':'#dc2626'}}>{estadoDesc}</strong></p>
          {obs&&<p style={{color:'var(--text-muted)',fontStyle:'italic',maxWidth:360,margin:'0 auto 12px'}}>"{obs.slice(0,120)}"</p>}
          <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>📧 Se enviará correo automático al candidato.</p>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <Button variant="ghost" onClick={()=>setPaso('form')} disabled={loading}>← Regresar</Button>
            <Button onClick={handleEnviar} loading={loading}
              style={{background:estadoDesc==='Seleccionado'?'#15803d':'#dc2626'}}>
              Confirmar y notificar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Modal: Finalizar ──────────────────────────────────────────
function ModalFinalizar({open,onClose,fila,compania,userId,onSaved}) {
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState(null)
  const tieneDecision=['Seleccionado','Descartado'].includes(fila?.estado_postulacion||fila?.estado_descripcion)
  const handleFinalizar=async()=>{
    setLoading(true);setMsg(null)
    try{
      const res=await api.post(`/api/candidatos/companias/${compania}/postulaciones/${fila.postulacion_id||fila.id}/finalizar/`,{usuario_modificacion:userId})
      setMsg({type:'ok',text:res.data.message||'✅ Finalizado.'})
      onSaved();setTimeout(()=>{setMsg(null);onClose()},2000)
    }catch(e){setMsg({type:'error',text:e?.response?.data?.detail||'Error.'})}
    finally{setLoading(false)}
  }
  if(!fila) return null
  return(
    <Modal open={open} onClose={onClose} title="Finalizar Postulación" size="sm">
      {msg&&<Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:12}}>{msg.text}</Alert>}
      {!tieneDecision?(
        <>
          <Alert type="error">Solo se puede finalizar una postulación con decisión previa (Seleccionado o Descartado).</Alert>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}><Button variant="ghost" onClick={onClose}>Cerrar</Button></div>
        </>
      ):(
        <>
          <p style={{fontSize:'.9rem',color:'var(--text-muted)',marginBottom:16}}>
            Marca la postulación de <strong>{fila.candidato_nombre_completo}</strong> como <strong>Finalizada</strong>.
            Esta acción no se puede deshacer.
          </p>
          <div style={{background:'var(--primary-bg)',borderRadius:8,padding:'10px 14px',marginBottom:20,fontSize:'.84rem',border:'1px solid var(--primary-border)'}}>
            <div><strong>Decisión:</strong> {fila.estado_postulacion||fila.estado_descripcion}</div>
            <div><strong>Vacante:</strong> {(fila.vacante||fila.vacante_descripcion||'').slice(0,60)}</div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button onClick={handleFinalizar} loading={loading} icon="🏁">Confirmar y finalizar</Button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function GestionPostulaciones() {
  const {user}=useAuth(); const cid=user?.compania
  const [tab,setTab]=useState('postulaciones')
  const [search,setSearch]=useState('')
  const [modalPost,setModalPost]=useState(false)
  const [modalDec,setModalDec]=useState(false)
  const [modalFin,setModalFin]=useState(false)
  const [filaActiva,setFilaActiva]=useState(null)
  const postulaciones=useFetch(()=>candidatosService.vPostulaciones(cid),[cid])
  const reporte=useFetch(()=>candidatosService.getReporte(cid),[cid])
  const reload=()=>{postulaciones.reload();reporte.reload()}
  const qL=search.toLowerCase()
  const filtPost=postulaciones.data?.filter(p=>!search||[p.candidato_nombre_completo,p.vacante_descripcion,p.estado_descripcion].some(f=>f?.toLowerCase().includes(qL)))??[]
  const filtRep=reporte.data?.filter(r=>!search||[r.candidato_nombre_completo,r.vacante].some(f=>f?.toLowerCase().includes(qL)))??[]

  const abrirDecision=fila=>{
    const fr=reporte.data?.find(r=>r.postulacion_id===fila.id||r.postulacion_id===fila.id_interno)
    setFilaActiva(fr||{...fila,theta_final:null,duracion_minutos:null})
    setModalDec(true)
  }
  const abrirFinalizar=fila=>{setFilaActiva(fila);setModalFin(true)}

  const accsPost=row=>(
    <div style={{display:'flex',gap:6}}>
      <Button size="sm" variant="secondary" icon="⚖️" onClick={()=>abrirDecision(row)}>Decisión</Button>
      <Button size="sm" variant="ghost"     icon="🏁" onClick={()=>abrirFinalizar(row)}>Finalizar</Button>
    </div>
  )
  const accsRep=row=>(
    <div style={{display:'flex',gap:6}}>
      <Button size="sm" variant="secondary" icon="⚖️" onClick={()=>abrirDecision(row)}>Decisión</Button>
      <Button size="sm" variant="ghost"     icon="🏁" onClick={()=>abrirFinalizar(row)}>Finalizar</Button>
    </div>
  )

  return(
    <div>
      <PageHeader title="Postulaciones"
        subtitle="Gestión de candidatos · Evaluaciones · Toma de decisiones"
        action={<Button icon={<MdOutlineCreateNewFolder />} onClick={()=>setModalPost(true)}>Nueva Postulación</Button>}/>

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
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar candidato, vacante, estado..."/>
      </div>

      {tab==='postulaciones'?(
        postulaciones.loading?<Spinner/>:(
          <>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
              <ExportBtns onExcel data={filtPost} cols={COLS_EXP} nombre="postulaciones"/>
            </div>
            <Table columns={COLS_POST} data={filtPost} empty="Sin postulaciones." actions={accsPost}/>
          </>
        )
      ):(
        reporte.loading?<Spinner/>:(
          <>
            <GraficasPostulaciones data={filtRep}/>
            <Card>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div>
                  <h3 style={{margin:'0 0 3px',fontSize:'.95rem',fontWeight:700}}>📋 Reporte Ejecutivo</h3>
                  <p style={{margin:0,fontSize:'.76rem',color:'var(--text-muted)'}}>
                    Datos completos de postulaciones con resultados de evaluación y toma de decisiones.
                  </p>
                </div>
                <ExportBtns onExcel data={filtRep} cols={COLS_EXP} nombre="reporte_postulaciones"/>
              </div>
              <Table columns={COLS_REP} data={filtRep} empty="Sin datos." actions={accsRep}/>
            </Card>
          </>
        )
      )}

      <ModalPostular open={modalPost} onClose={()=>setModalPost(false)} compania={cid} onSaved={reload}/>
      <ModalDecision open={modalDec} onClose={()=>{setModalDec(false);setFilaActiva(null)}} fila={filaActiva} compania={cid} userId={user?.id} onSaved={reload}/>
      <ModalFinalizar open={modalFin} onClose={()=>{setModalFin(false);setFilaActiva(null)}} fila={filaActiva} compania={cid} userId={user?.id} onSaved={reload}/>
    </div>
  )
}

// src/pages/Dashboard/Dashboard.jsx — mejorado con react-icons + filtros + gráficas
import { useState, useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, Legend,
} from 'recharts'
import { useFetch } from '../../hooks/useFetch'
import { useAuth }  from '../../context/AuthContext'
import { evaluacionService, candidatosService, vacantesService } from '../../services'
import { Card, Spinner, Badge } from '../../components/ui'

import {
  MdBarChart, MdPeople, MdWork, MdAssignment, MdTrendingUp,
  MdFilterList, MdRefresh, MdOutlineSchool, MdCheckCircle,
  MdHourglassEmpty, MdCancel, MdInfo,
} from 'react-icons/md'
import { BiBrain } from 'react-icons/bi'

// ── Niveles θ ─────────────────────────────────────────────────
const NIVELES = [
  { label:'Sobresaliente', min: 1.5, color:'#15803d' },
  { label:'Alto',          min: 0.5, color:'#2563eb' },
  { label:'Medio',         min:-0.5, color:'#f59e0b' },
  { label:'Bajo',          min:-1.5, color:'#ef4444' },
  { label:'Muy Bajo',      min:-4.0, color:'#7f1d1d' },
]
function getNivel(theta) {
  if (theta == null) return null
  for (let i = 0; i < NIVELES.length; i++) {
    if (theta >= NIVELES[i].min) return NIVELES[i]
  }
  return NIVELES[NIVELES.length - 1]
}

// ── Tooltip personalizado ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)',
      borderRadius:8, padding:'8px 12px', fontSize:'.8rem',
      boxShadow:'0 4px 20px rgba(0,0,0,.1)' }}>
      {label && <div style={{ fontWeight:700, marginBottom:5 }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ color: p.fill || p.color, marginBottom:2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed?.(2) ?? p.value : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, color='var(--primary)', sublabel, onClick, active }) {
  return (
    <Card onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:14, padding:18, cursor:onClick?'pointer':'default',
        border: active ? '2px solid var(--primary)' : '1.5px solid var(--border)',
        background: active ? 'var(--primary-bg)' : 'var(--card)',
        transition:'all .2s',
      }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={22} color={color}/>
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:'1.6rem', fontWeight:800, color, lineHeight:1.1,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:2 }}>{label}</div>
        {sublabel && <div style={{ fontSize:'.71rem', color, fontWeight:600 }}>{sublabel}</div>}
      </div>
    </Card>
  )
}

// ── Panel de filtros ──────────────────────────────────────────
function PanelFiltros({ filtro, setFiltro, onRefresh }) {
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)',
        fontSize:'.82rem', fontWeight:600 }}>
        <MdFilterList size={16}/> Filtrar:
      </div>
      {[
        ['todos',       'Todos'],
        ['completados', 'Completados'],
        ['en_progreso', 'En Progreso'],
      ].map(([k, l]) => (
        <button key={k} onClick={() => setFiltro(k)} style={{
          padding:'5px 14px', borderRadius:99, border:'none', cursor:'pointer',
          fontFamily:'var(--font)', fontSize:'.8rem', fontWeight:600, transition:'all .15s',
          background: filtro===k ? 'var(--primary)' : 'var(--border)',
          color:      filtro===k ? '#fff'           : 'var(--text)',
        }}>{l}</button>
      ))}
      <button onClick={onRefresh} style={{ marginLeft:'auto', display:'flex', alignItems:'center',
        gap:5, padding:'5px 12px', borderRadius:99, border:'1px solid var(--border)',
        background:'var(--bg)', cursor:'pointer', fontFamily:'var(--font)',
        fontSize:'.78rem', color:'var(--text-muted)' }}>
        <MdRefresh size={14}/> Actualizar
      </button>
    </div>
  )
}

// ── Gráfica: Intentos por estado ──────────────────────────────
function GraficaEstados({ intentos }) {
  const data = useMemo(() => {
    const g = {}
    intentos?.forEach(i => { const k = i.estado_descripcion||'—'; g[k]=(g[k]||0)+1 })
    return Object.entries(g).map(([name, value]) => ({ name, value }))
  }, [intentos])

  const COLORS = { Completado:'#15803d','En Progreso':'#2563eb', Abandonado:'#ef4444', Expirado:'#f59e0b', Anulado:'#94a3b8' }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name"
          cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}
          label={({ name, value, percent }) => `${name}: ${value} (${(percent*100).toFixed(0)}%)`}
          labelLine={false}>
          {data.map((d,i) => <Cell key={i} fill={COLORS[d.name]||'#94a3b8'}/>)}
        </Pie>
        <Tooltip content={<CustomTooltip/>}/>
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Gráfica: θ por evaluación ─────────────────────────────────
function GraficaTheta({ intentos }) {
  const data = useMemo(() => {
    const g = {}
    intentos?.filter(i => i.estado_descripcion==='Completado' && i.habilidad_estim!=null)
      .forEach(i => {
        const k = (i.evaluacion_descripcion||'Sin eval.').slice(0,20)
        if (!g[k]) g[k]=[]
        g[k].push(i.habilidad_estim)
      })
    return Object.entries(g).map(([name,vals]) => {
      const avg = vals.reduce((a,b)=>a+b,0)/vals.length
      return { name, theta:+avg.toFixed(3), n:vals.length, color:getNivel(avg)?.color||'#94a3b8' }
    }).sort((a,b)=>b.theta-a.theta)
  }, [intentos])

  if (!data.length) return <div style={{textAlign:'center',color:'var(--text-muted)',padding:30}}>Sin datos</div>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{top:20,right:10,left:-10,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
        <XAxis dataKey="name" tick={{fontSize:10}}/>
        <YAxis domain={[-2,2]} tick={{fontSize:10}}/>
        <Tooltip content={<CustomTooltip/>}
          formatter={(v,_,{payload})=>[`θ=${v} · n=${payload.n}`,'Promedio']}/>
        <Bar dataKey="theta" radius={[6,6,0,0]}>
          {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
          <LabelList dataKey="theta" position="top" style={{fontSize:10}}
            formatter={v => Number(v).toFixed(2)}/>
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Gráfica: niveles distribución ─────────────────────────────
function GraficaNiveles({ intentos }) {
  const data = useMemo(() => {
    const c = Object.fromEntries(NIVELES.map(n=>[n.label,0]))
    intentos?.filter(i=>i.estado_descripcion==='Completado'&&i.habilidad_estim!=null)
      .forEach(i=>{const n=getNivel(i.habilidad_estim);if(n)c[n.label]++})
    return NIVELES.map(n=>({name:n.label,value:c[n.label],color:n.color})).filter(d=>d.value>0)
  }, [intentos])

  const total = data.reduce((s,d)=>s+d.value,0)
  if (!data.length) return <div style={{textAlign:'center',color:'var(--text-muted)',padding:30}}>Sin datos</div>

  return (
    <div style={{display:'flex',gap:16,alignItems:'center'}}>
      <ResponsiveContainer width="55%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%"
            innerRadius={50} outerRadius={85} paddingAngle={2}>
            {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
          </Pie>
          <Tooltip formatter={(v,name)=>[`${v} (${((v/total)*100).toFixed(0)}%)`,name]}/>
        </PieChart>
      </ResponsiveContainer>
      <div style={{flex:1}}>
        {data.map(d=>(
          <div key={d.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:11,height:11,borderRadius:3,background:d.color,flexShrink:0}}/>
            <span style={{fontSize:'.82rem',flex:1}}>{d.name}</span>
            <strong style={{color:d.color,fontSize:'.85rem'}}>{d.value}</strong>
            <span style={{fontSize:'.72rem',color:'var(--text-muted)',minWidth:32}}>
              {((d.value/total)*100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DASHBOARD PRINCIPAL ───────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const cid      = user?.compania
  const [filtro, setFiltro] = useState('todos')
  const [graficaActiva, setGraficaActiva] = useState('niveles')

  const intentos  = useFetch(() => evaluacionService.vIntentos(cid), [cid])
  const reporte   = useFetch(() => candidatosService.getReporte(cid), [cid])
  const vacantes  = useFetch(() => vacantesService.vVacantes(cid), [cid])
  const evals     = useFetch(() => evaluacionService.vEvaluaciones(cid), [cid])

  const refresh = () => {
    intentos.reload(); reporte.reload()
    vacantes.reload(); evals.reload()
  }

  const intentosFiltrados = useMemo(() => {
    const all = intentos.data ?? []
    if (filtro === 'completados')  return all.filter(i=>i.estado_descripcion==='Completado')
    if (filtro === 'en_progreso')  return all.filter(i=>i.estado_descripcion==='En Progreso')
    return all
  }, [intentos.data, filtro])

  const completados = (intentos.data??[]).filter(i=>i.estado_descripcion==='Completado')
  const avgTheta    = completados.length
    ? (completados.reduce((s,i)=>s+(i.habilidad_estim||0),0)/completados.length).toFixed(3)
    : null
  const topNivel = useMemo(() => {
    const c = Object.fromEntries(NIVELES.map(n=>[n.label,0]))
    completados.forEach(i=>{const n=getNivel(i.habilidad_estim);if(n)c[n.label]++})
    const top = Object.entries(c).sort((a,b)=>b[1]-a[1])[0]
    return top?.[1]>0 ? top[0] : null
  }, [completados])

  const GRAFICAS = [
    { id:'niveles',  label:'Distribución Niveles' },
    { id:'theta',    label:'θ por Evaluación'    },
    { id:'estados',  label:'Estados de Intentos' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <h1 style={{ margin:0, fontSize:'1.4rem', fontWeight:800, color:'var(--text-h)',
            display:'flex', alignItems:'center', gap:10 }}>
            <MdBarChart size={26} color="var(--primary)"/>
            Dashboard
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:'.84rem', color:'var(--text-muted)' }}>
            Bienvenido, <strong>{user?.nombre || user?.login}</strong> · {user?.compania_nombre}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:20 }}>
        <KPICard icon={MdWork}         label="Vacantes activas"   color="#2563eb"
          value={vacantes.data?.filter(v=>v.ind_activa).length}/>
        <KPICard icon={MdPeople}       label="Candidatos"          color="#15803d"
          value={reporte.data?.length}/>
        <KPICard icon={MdAssignment}   label="Intentos totales"    color="#7c3aed"
          value={intentos.data?.length}/>
        <KPICard icon={MdCheckCircle}  label="Completados"         color="#15803d"
          value={completados.length}/>
        <KPICard icon={MdTrendingUp}   label="θ Promedio"          color="#f59e0b"
          value={avgTheta} sublabel={topNivel || ''}/>
        <KPICard icon={MdOutlineSchool} label="Evaluaciones activas" color="#0891b2"
          value={(() => { const d = evals.data; return Array.isArray(d) ? d.filter(e=>e.ind_activa).length : d?.evaluaciones?.filter(e=>e.ind_activa).length })()} />
      </div>

      {/* Filtros */}
      <PanelFiltros filtro={filtro} setFiltro={setFiltro} onRefresh={refresh}/>

      {/* Gráficas */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <h3 style={{ margin:0, fontSize:'.95rem', fontWeight:700, display:'flex', alignItems:'center', gap:7 }}>
            <BiBrain size={17} color="var(--primary)"/> Análisis de Evaluaciones
          </h3>
          <div style={{ display:'flex', gap:6 }}>
            {GRAFICAS.map(g => (
              <button key={g.id} onClick={() => setGraficaActiva(g.id)} style={{
                padding:'5px 13px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:'var(--font)', fontSize:'.78rem', fontWeight:600, transition:'all .15s',
                background: graficaActiva===g.id ? 'var(--primary)' : 'var(--border)',
                color:      graficaActiva===g.id ? '#fff'           : 'var(--text)',
              }}>{g.label}</button>
            ))}
          </div>
        </div>

        {intentos.loading ? <Spinner label="Cargando datos..."/> : (
          <>
            {graficaActiva === 'niveles' && <GraficaNiveles intentos={intentosFiltrados}/>}
            {graficaActiva === 'theta'   && <GraficaTheta   intentos={intentosFiltrados}/>}
            {graficaActiva === 'estados' && <GraficaEstados intentos={intentosFiltrados}/>}
          </>
        )}
      </Card>

      {/* Últimos 5 intentos */}
      <Card>
        <h3 style={{ margin:'0 0 14px', fontSize:'.95rem', fontWeight:700,
          display:'flex', alignItems:'center', gap:7 }}>
          <MdHourglassEmpty size={17} color="var(--primary)"/> Actividad Reciente
        </h3>
        {intentos.loading ? <Spinner size="sm"/> : (
          <div>
            {(intentosFiltrados.slice(0,6) ?? []).map((i,idx) => {
              const niv = getNivel(i.habilidad_estim)
              return (
                <div key={i.id||idx} style={{ display:'flex', alignItems:'center', gap:12,
                  padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:36, height:36, borderRadius:10,
                    background:`${niv?.color||'#94a3b8'}18`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <MdOutlineSchool size={18} color={niv?.color||'#94a3b8'}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'.88rem',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {i.candidato_nombre_completo || 'Candidato'}
                    </div>
                    <div style={{ fontSize:'.74rem', color:'var(--text-muted)' }}>
                      {i.evaluacion_descripcion} · {i.fecha_inicio ? new Date(i.fecha_inicio).toLocaleDateString('es-CO') : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    {i.habilidad_estim!=null && (
                      <div style={{ fontWeight:700, color:niv?.color||'var(--primary)', fontSize:'.88rem' }}>
                        θ {Number(i.habilidad_estim).toFixed(2)}
                      </div>
                    )}
                    <Badge variant={i.estado_descripcion==='Completado'?'success':'warning'} style={{fontSize:'.7rem'}}>
                      {i.estado_descripcion}
                    </Badge>
                  </div>
                </div>
              )
            })}
            {!intentosFiltrados.length && (
              <div style={{ textAlign:'center', padding:24, color:'var(--text-muted)' }}>
                Sin actividad reciente con el filtro seleccionado.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

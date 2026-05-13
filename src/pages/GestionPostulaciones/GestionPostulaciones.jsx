// src/pages/GestionPostulaciones/GestionPostulaciones.jsx
import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { candidatosService, vacantesService } from '../../services'
import { PageHeader, SearchBar, Table, Badge, Button, Select, Alert, Spinner, Card } from '../../components/ui'

const COLS_POST = [
  { key: 'id',                     label: 'ID',    width: 60 },
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'vacante_descripcion',    label: 'Vacante',
    render: v => <span title={v}>{v?.slice(0,40)}{v?.length>40?'...':''}</span> },
  { key: 'estado_descripcion', label: 'Estado', width: 130,
    render: v => {
      const m = { Recibida:'info','En Evaluación':'warning',Seleccionado:'success',Descartado:'danger',Finalizado:'primary' }
      return <Badge variant={m[v]||'info'}>{v}</Badge>
    }},
  { key: 'fecha_postulacion', label: 'Fecha',  width: 120,
    render: v => v ? new Date(v).toLocaleDateString('es-CO') : '—' },
  { key: 'candidato_email',   label: 'Email' },
  { key: 'candidato_documento', label: 'Documento', width: 120 },
]

const COLS_REP = [
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'vacante',           label: 'Vacante',
    render: v => <span title={v}>{v?.slice(0,35)}{v?.length>35?'...':''}</span> },
  { key: 'estado_postulacion',label: 'Estado Post.', width:130,
    render: v => <Badge variant={{ Seleccionado:'success',Descartado:'danger','En Proceso':'warning',Finalizado:'primary' }[v]||'info'}>{v}</Badge> },
  { key: 'decision',          label: 'Decisión',  width:110,
    render: v => <Badge variant={{ SELECCIONADO:'success',DESCARTADO:'danger',FINALIZADO:'primary','EN PROCESO':'warning' }[v]||'info'}>{v}</Badge> },
  { key: 'theta_final',       label: 'θ Final',   width:90,
    render: v => v != null ? <strong>{Number(v).toFixed(3)}</strong> : '—' },
  { key: 'duracion_minutos',  label: 'Duración',  width:90,
    render: v => v != null ? `${v} min` : '—' },
  { key: 'estado_intento',    label: 'Evaluación', width:120 },
]

export default function GestionPostulaciones() {
  const { user } = useAuth()
  const cid  = user?.compania
  const [tab, setTab]     = useState('postulaciones')  // 'postulaciones' | 'reporte'
  const [search, setSearch] = useState('')
  const [filtDecision, setFiltDecision] = useState('')

  const postulaciones = useFetch(() => candidatosService.vPostulaciones(cid), [cid])
  const reporte       = useFetch(() => candidatosService.getReporte(cid), [cid])

  const filteredPost = postulaciones.data?.filter(p =>
    !search || [p.candidato_nombre_completo, p.vacante_descripcion, p.estado_descripcion]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  const filteredRep = reporte.data?.filter(r =>
    (!search || [r.candidato_nombre_completo, r.vacante].some(f => f?.toLowerCase().includes(search.toLowerCase()))) &&
    (!filtDecision || r.decision === filtDecision)
  ) ?? []

  return (
    <div>
      <PageHeader title="Postulaciones" subtitle="Seguimiento de candidatos y resultados de evaluación" />

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['postulaciones','📋 Postulaciones'],['reporte','📊 Reporte Ejecutivo']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'8px 20px', borderRadius:99, border:'none', cursor:'pointer', fontFamily:'var(--font)',
              fontWeight:600, fontSize:'.88rem', transition:'all .2s',
              background: tab===key ? 'var(--primary)' : 'var(--border)',
              color: tab===key ? '#fff' : 'var(--text)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar candidato, vacante..." />
        </div>
        {tab === 'reporte' && (
          <select
            style={{ padding:'8px 14px', borderRadius:8, border:'1.5px solid var(--border)',
              fontFamily:'var(--font)', fontSize:'.88rem', background:'var(--input-bg)' }}
            value={filtDecision} onChange={e => setFiltDecision(e.target.value)}
          >
            <option value="">Todas las decisiones</option>
            {['SELECCIONADO','DESCARTADO','EN PROCESO','FINALIZADO'].map(d =>
              <option key={d} value={d}>{d}</option>
            )}
          </select>
        )}
      </div>

      {/* Contenido */}
      {tab === 'postulaciones' ? (
        postulaciones.loading ? <Spinner /> :
        <Table columns={COLS_POST} data={filteredPost} empty="No hay postulaciones registradas." />
      ) : (
        reporte.loading ? <Spinner /> :
        <Table columns={COLS_REP} data={filteredRep} empty="No hay datos en el reporte." />
      )}
    </div>
  )
}

// src/pages/GestionPostulaciones/GestionPostulaciones.jsx
import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { candidatosService, vacantesService } from '../../services'
import {
  PageHeader, SearchBar, Table, Badge, Button,
  Modal, Input, Select, Alert, Spinner, Card
} from '../../components/ui'
import api from '../../api/axios'

const COLS_POST = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'vacante_descripcion', label: 'Vacante',
    render: v => <span title={v}>{v?.slice(0,45)}{v?.length>45?'...':''}</span> },
  { key: 'estado_descripcion', label: 'Estado', width: 130,
    render: v => {
      const m = { Recibida:'info','En Evaluación':'warning',Seleccionado:'success',Descartado:'danger',Finalizado:'primary' }
      return <Badge variant={m[v]||'info'}>{v}</Badge>
    }},
  { key: 'fecha_postulacion', label: 'Fecha', width: 110,
    render: v => v ? new Date(v).toLocaleDateString('es-CO') : '—' },
  { key: 'candidato_email', label: 'Email' },
]

const COLS_REP = [
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'vacante', label: 'Vacante',
    render: v => <span title={v}>{v?.slice(0,35)}{v?.length>35?'...':''}</span> },
  { key: 'estado_postulacion', label: 'Estado Post.', width:130,
    render: v => <Badge variant={{Seleccionado:'success',Descartado:'danger','En Evaluación':'warning',Finalizado:'primary'}[v]||'info'}>{v}</Badge> },
  { key: 'decision', label: 'Decisión', width:110,
    render: v => <Badge variant={{SELECCIONADO:'success',DESCARTADO:'danger',FINALIZADO:'primary','EN PROCESO':'warning'}[v]||'info'}>{v}</Badge> },
  { key: 'theta_final', label: 'θ Final', width:90,
    render: v => v != null ? <strong style={{color:'var(--primary)'}}>{Number(v).toFixed(3)}</strong> : '—' },
  { key: 'duracion_minutos', label: 'Duración', width:90, render: v => v != null ? `${v} min` : '—' },
  { key: 'estado_intento', label: 'Evaluación', width:120 },
]

function ModalPostular({ open, onClose, compania, onSaved }) {
  const [form, setForm] = useState({ vacante: '', candidato: '', descripcion: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [ok, setOk]           = useState(null)

  const vacantes   = useFetch(() => vacantesService.vVacantes(compania), [compania])
  const candidatos = useFetch(() => candidatosService.vCandidatos(compania), [compania])
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(null)
    if (!form.vacante || !form.candidato) {
      setError('Vacante y candidato son obligatorios.'); return
    }
    setLoading(true)
    try {
      const res = await candidatosService.createPostulacion(compania, form)
      const correo = res.data.correo_enviado
        ? '✅ Correo enviado al candidato.'
        : '⚠️ Postulación creada (correo no enviado — revisa SMTP).'
      setOk(correo)
      onSaved()
      setTimeout(() => { setOk(null); onClose() }, 3000)
    } catch (e) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Error al postular.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="📋 Nueva Postulación" size="md">
      {error && <Alert type="error" style={{ marginBottom:12 }}>{error}</Alert>}
      {ok    && <Alert type="success" style={{ marginBottom:12 }}>{ok}</Alert>}
      <p style={{ fontSize:'.85rem', color:'var(--text-muted)', marginBottom:16 }}>
        Al crear la postulación, el sistema enviará automáticamente el enlace de evaluación
        al correo del candidato (si está registrado).
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Select label="Vacante *" value={form.vacante} onChange={e => set('vacante', e.target.value)}>
          <option value="">Seleccionar vacante...</option>
          {vacantes.data?.filter(v => v.ind_activa).map(v => (
            <option key={v.id} value={v.id}>{v.descripcion?.slice(0,60)}</option>
          ))}
        </Select>
        <Select label="Candidato *" value={form.candidato} onChange={e => set('candidato', e.target.value)}>
          <option value="">Seleccionar candidato...</option>
          {candidatos.data?.map(c => (
            <option key={c.id} value={c.id}>{c.nombre_completo || `Candidato #${c.id}`}</option>
          ))}
        </Select>
        <div>
          <label style={{ fontSize:'.82rem', fontWeight:600, display:'block', marginBottom:6 }}>Observaciones (opcional)</label>
          <textarea
            value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
            style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid var(--border)',
              fontFamily:'var(--font)', fontSize:'.9rem', minHeight:70, resize:'vertical', outline:'none' }}
            placeholder="Notas del analista..."
          />
        </div>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} loading={loading} icon="📋">Postular y enviar enlace</Button>
      </div>
    </Modal>
  )
}

export default function GestionPostulaciones() {
  const { user }  = useAuth()
  const cid       = user?.compania
  const [tab, setTab] = useState('postulaciones')
  const [search, setSearch] = useState('')
  const [modalPost, setModalPost] = useState(false)

  const postulaciones = useFetch(() => candidatosService.vPostulaciones(cid), [cid])
  const reporte       = useFetch(() => candidatosService.getReporte(cid), [cid])

  const filteredPost = postulaciones.data?.filter(p =>
    !search || [p.candidato_nombre_completo, p.vacante_descripcion, p.estado_descripcion]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  const filteredRep = reporte.data?.filter(r =>
    !search || [r.candidato_nombre_completo, r.vacante].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  return (
    <div>
      <PageHeader
        title="Postulaciones"
        subtitle="Gestión de candidatos y proceso de evaluación"
        action={<Button icon="➕" onClick={() => setModalPost(true)}>Nueva Postulación</Button>}
      />

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['postulaciones','📋 Postulaciones'],['reporte','📊 Reporte Ejecutivo']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding:'8px 20px', borderRadius:99, border:'none', cursor:'pointer',
              fontFamily:'var(--font)', fontWeight:600, fontSize:'.88rem', transition:'all .2s',
              background: tab===k ? 'var(--primary)' : 'var(--border)',
              color: tab===k ? '#fff' : 'var(--text)',
            }}>{l}</button>
        ))}
      </div>

      <div style={{ marginBottom:14 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar candidato, vacante..." />
      </div>

      {tab === 'postulaciones'
        ? (postulaciones.loading ? <Spinner /> : <Table columns={COLS_POST} data={filteredPost} empty="No hay postulaciones." />)
        : (reporte.loading ? <Spinner /> : <Table columns={COLS_REP} data={filteredRep} empty="No hay datos en el reporte." />)
      }

      <ModalPostular
        open={modalPost}
        onClose={() => setModalPost(false)}
        compania={cid}
        onSaved={() => { postulaciones.reload(); reporte.reload() }}
      />
    </div>
  )
}

// src/pages/Evaluacion/Evaluacion.jsx
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { evaluacionService } from '../../services'
import { PageHeader, Table, Badge, Card, Spinner } from '../../components/ui'

const COLS_EVAL = [
  { key: 'id',           label: 'ID',    width: 60 },
  { key: 'descripcion',  label: 'Evaluación' },
  { key: 'total_habilidades', label: 'Habilidades', width: 110 },
  { key: 'ind_activa',   label: 'Activa', width: 80,
    render: v => <Badge variant={v?'success':'danger'}>{v?'Sí':'No'}</Badge> },
]

const COLS_INT = [
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'evaluacion_descripcion',    label: 'Evaluación' },
  { key: 'estado_descripcion', label: 'Estado', width:120,
    render: v => {
      const m = { 'En Progreso':'warning',Completado:'success',Abandonado:'danger',Expirado:'danger',Anulado:'primary' }
      return <Badge variant={m[v]||'info'}>{v}</Badge>
    }},
  { key: 'habilidad_estim', label: 'θ Estimado', width:110,
    render: v => v != null ? <strong style={{ color:'var(--primary)' }}>{Number(v).toFixed(4)}</strong> : '—' },
  { key: 'error_estandar', label: 'SE(θ)', width:90,
    render: v => v != null ? Number(v).toFixed(4) : '—' },
  { key: 'duracion_segundos', label: 'Duración', width:100,
    render: v => v != null ? `${Math.round(v/60)} min` : '—' },
  { key: 'fecha_inicio', label: 'Inicio', width:130,
    render: v => v ? new Date(v).toLocaleDateString('es-CO') : '—' },
]

const NIVELES = [
  { rango: [1.5, 4],   label: 'Sobresaliente', color: '#15803d' },
  { rango: [0.5, 1.5], label: 'Alto',          color: '#2563eb' },
  { rango: [-0.5, 0.5],label: 'Medio',         color: '#b45309' },
  { rango: [-1.5,-0.5],label: 'Bajo',          color: '#dc2626' },
  { rango: [-4, -1.5], label: 'Muy Bajo',      color: '#7f1d1d' },
]

function nivel(theta) {
  if (theta == null) return '—'
  const n = NIVELES.find(l => theta >= l.rango[0] && theta < l.rango[1])
  return n ? <span style={{ color:n.color, fontWeight:700 }}>{n.label}</span> : '—'
}

export default function Evaluacion() {
  const { user }  = useAuth()
  const cid       = user?.compania
  const evals     = useFetch(() => evaluacionService.vEvaluaciones(cid), [cid])
  const intentos  = useFetch(() => evaluacionService.vIntentos(cid), [cid])
  const reporte   = useFetch(() => evaluacionService.vReporte(cid), [cid])

  const completados = intentos.data?.filter(i => i.estado_descripcion === 'Completado') ?? []
  const avgTheta    = completados.length
    ? (completados.reduce((s,i) => s + (i.habilidad_estim||0), 0) / completados.length).toFixed(3)
    : null

  return (
    <div>
      <PageHeader title="Evaluaciones" subtitle="Motor CAT · Parámetros TRI · Estimación θ en tiempo real" />

      {/* KPIs de evaluación */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:24 }}>
        {[
          { icon:'📋', label:'Evaluaciones activas', value: evals.data?.filter(e=>e.ind_activa).length },
          { icon:'🏃', label:'Intentos totales',     value: intentos.data?.length },
          { icon:'✅', label:'Completados',          value: completados.length },
          { icon:'📈', label:'θ Promedio',           value: avgTheta },
        ].map(k => (
          <Card key={k.label} style={{ display:'flex', alignItems:'center', gap:12, padding:16 }}>
            <span style={{ fontSize:'1.8rem' }}>{k.icon}</span>
            <div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--primary)' }}>{k.value ?? '—'}</div>
              <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{k.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Evaluaciones configuradas */}
      <Card style={{ marginBottom:20 }}>
        <h3 style={{ marginBottom:14, fontSize:'.95rem' }}>📋 Evaluaciones Configuradas</h3>
        {evals.loading ? <Spinner size="sm" /> : (
          <Table columns={COLS_EVAL} data={evals.data ?? []} empty="No hay evaluaciones configuradas." />
        )}
      </Card>

      {/* Intentos recientes */}
      <Card style={{ marginBottom:20 }}>
        <h3 style={{ marginBottom:14, fontSize:'.95rem' }}>🏃 Intentos de Evaluación</h3>
        {intentos.loading ? <Spinner size="sm" /> : (
          <Table
            columns={[
              ...COLS_INT,
              { key: 'habilidad_estim', label: 'Nivel',
                render: (v) => nivel(v) }
            ]}
            data={intentos.data ?? []}
            empty="No hay intentos registrados."
          />
        )}
      </Card>

      {/* Leyenda de niveles */}
      <Card>
        <h3 style={{ marginBottom:14, fontSize:'.95rem' }}>📊 Escala de Niveles θ (Theta)</h3>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {NIVELES.map(n => (
            <div key={n.label} style={{
              padding:'8px 16px', borderRadius:99, border:`2px solid ${n.color}20`,
              background:`${n.color}10`, color:n.color, fontWeight:600, fontSize:'.82rem'
            }}>
              {n.label} ({n.rango[0]} a {n.rango[1]})
            </div>
          ))}
        </div>
        <p style={{ marginTop:12, fontSize:'.8rem', color:'var(--text-muted)' }}>
          θ (theta) representa el nivel de habilidad estimado por el algoritmo CAT usando la Teoría de Respuesta al Ítem (TRI 3PL).
          Un SE(θ) menor indica mayor precisión en la estimación.
        </p>
      </Card>
    </div>
  )
}

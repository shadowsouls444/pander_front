// src/pages/Evaluacion/Evaluacion.jsx — DEFINITIVO
// 7 Gráficas interactivas + exportación PNG/JPG/WEBP/PDF (gráficas) + Excel (tablas)
// Gráficas:
//   1. Niveles por Vacante (barras apiladas horizontales)  ← PRINCIPAL NUEVO
//   2. Distribución global de Niveles θ (donut)
//   3. θ Promedio por Evaluación (barras)
//   4. Dispersión θ vs SE (scatter — precisión del CAT)
//   5. Evolución Temporal θ (línea)
//   6. Duración promedio por Evaluación (barras agrupadas)
//   7. θ por Candidato Top-15 (barras horizontales)
import { useState, useMemo, useRef } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList, ReferenceLine,
} from 'recharts'
import { useFetch } from '../../hooks/useFetch'
import { useAuth }  from '../../context/AuthContext'
import { evaluacionService, candidatosService } from '../../services'
import { PageHeader, Table, Badge, Card, Spinner } from '../../components/ui'

// ── Escala de niveles ─────────────────────────────────────────
const NIVELES = [
  { label: 'Sobresaliente', min:  1.5, max:  4.0, color: '#15803d' },
  { label: 'Alto',          min:  0.5, max:  1.5, color: '#2563eb' },
  { label: 'Medio',         min: -0.5, max:  0.5, color: '#f59e0b' },
  { label: 'Bajo',          min: -1.5, max: -0.5, color: '#ef4444' },
  { label: 'Muy Bajo',      min: -4.0, max: -1.5, color: '#7f1d1d' },
]

function getNivel(theta) {
  if (theta == null) return null
  return NIVELES.find(n => theta >= n.min && theta < n.max)
    ?? (theta >= 1.5 ? NIVELES[0] : NIVELES[NIVELES.length - 1])
}

function NivelBadge({ theta }) {
  if (theta == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const n = getNivel(theta)
  if (!n) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 99,
      background: n.color + '18', color: n.color,
      border: `1px solid ${n.color}40`, fontWeight: 700, fontSize: '.78rem',
    }}>{n.label}</span>
  )
}

// ── Exportar Excel (CSV con BOM, separador ;) ─────────────────
function exportarExcel(datos, columnas, nombre) {
  const enc  = columnas.map(c => c.label)
  const fils  = datos.map(row =>
    columnas.map(c => String(row[c.key] ?? '').replace(/"/g, '""'))
  )
  const csv  = [enc, ...fils].map(r => r.map(v => `"${v}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: `${nombre}.csv` }).click()
  URL.revokeObjectURL(url)
}

// ── Exportar gráfica SVG → PNG/JPG/WEBP/PDF ──────────────────
async function exportarGrafica(refEl, formato, nombre) {
  const svgEl = refEl?.current?.querySelector('svg')
  if (!svgEl) { alert('Sin gráfica SVG para exportar.'); return }
  const blob = new Blob([new XMLSerializer().serializeToString(svgEl)],
    { type: 'image/svg+xml;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const img  = Object.assign(new Image(), { crossOrigin: 'anonymous', src: url })
  await new Promise(r => { img.onload = r })
  const scale  = 2
  const canvas = document.createElement('canvas')
  canvas.width  = img.naturalWidth  * scale
  canvas.height = img.naturalHeight * scale
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(scale, scale); ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)
  if (formato === 'pdf') {
    const w = window.open('', '_blank')
    w.document.write(
      `<html><head><title>${nombre}</title></head>` +
      `<body style="margin:0;padding:20px;display:flex;justify-content:center">` +
      `<img src="${canvas.toDataURL('image/png')}" style="max-width:100%"/></body></html>`
    )
    w.document.close(); setTimeout(() => w.print(), 400)
    return
  }
  const mime = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[formato]
  Object.assign(document.createElement('a'),
    { href: canvas.toDataURL(mime, 0.95), download: `${nombre}.${formato}` }).click()
}

// ── Botones de exportación ────────────────────────────────────
function BtnGrafica({ refEl, nombre }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {['PNG','JPG','WEBP','PDF'].map(f => (
        <button key={f} title={`Exportar ${f}`}
          onClick={() => exportarGrafica(refEl, f.toLowerCase(), nombre)}
          style={{
            padding: '3px 9px', borderRadius: 5, cursor: 'pointer',
            border: '1px solid var(--border)', background: 'var(--bg)',
            fontFamily: 'var(--font)', fontSize: '.7rem', fontWeight: 600, color: 'var(--text-muted)',
          }}>⬇ {f}
        </button>
      ))}
    </div>
  )
}

function BtnExcel({ onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 6, border: '1px solid #d1fae5',
      background: '#f0fdf4', cursor: 'pointer',
      fontFamily: 'var(--font)', fontSize: '.76rem', fontWeight: 600, color: '#15803d',
    }}>📥 Exportar Excel
    </button>
  )
}

// ── Tooltip personalizado ─────────────────────────────────────
const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
      padding: '8px 12px', fontSize: '.8rem', boxShadow: '0 4px 20px rgba(0,0,0,.1)',
    }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 5 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? Number(p.value).toFixed(3) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GRÁFICO 1 — NIVELES POR VACANTE (barras apiladas horizontales)
// ════════════════════════════════════════════════════════════════
function G1NivelesPorVacante({ reporte }) {
  const ref = useRef(null)
  const data = useMemo(() => {
    if (!reporte?.length) return []
    const g = {}
    reporte.forEach(r => {
      if (r.theta_final == null) return
      const k = (r.vacante || 'Sin vacante').slice(0, 30)
      if (!g[k]) { g[k] = { vacante: k }; NIVELES.forEach(n => { g[k][n.label] = 0 }) }
      const niv = getNivel(r.theta_final)
      if (niv) g[k][niv.label]++
    })
    return Object.values(g)
      .sort((a, b) => NIVELES.reduce((s, n) => s + b[n.label] - a[n.label], 0))
      .slice(0, 12)
  }, [reporte])

  if (!data.length) return <NoData />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <BtnGrafica refEl={ref} nombre="niveles_por_vacante" />
      </div>
      <div ref={ref}>
        <ResponsiveContainer width="100%" height={Math.max(280, data.length * 38)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="vacante" width={148} tick={{ fontSize: 10 }} />
            <Tooltip content={<TT />} />
            <Legend iconType="square" iconSize={10}
              formatter={v => <span style={{ fontSize: '.77rem' }}>{v}</span>} />
            {NIVELES.map((n, i) => (
              <Bar key={n.label} dataKey={n.label} stackId="a" fill={n.color}
                radius={i === 0 ? [4, 0, 0, 4] : i === NIVELES.length - 1 ? [0, 4, 4, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GRÁFICO 2 — DISTRIBUCIÓN DE NIVELES (donut)
// ════════════════════════════════════════════════════════════════
function G2Distribucion({ intentos }) {
  const ref = useRef(null)
  const data = useMemo(() => {
    const comp   = intentos?.filter(i => i.estado_descripcion === 'Completado') ?? []
    const conteo = Object.fromEntries(NIVELES.map(n => [n.label, 0]))
    comp.forEach(i => { const n = getNivel(i.habilidad_estim); if (n) conteo[n.label]++ })
    return NIVELES.map(n => ({ name: n.label, value: conteo[n.label], color: n.color }))
      .filter(d => d.value > 0)
  }, [intentos])

  const total = data.reduce((s, d) => s + d.value, 0)
  if (!data.length) return <NoData />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <BtnGrafica refEl={ref} nombre="distribucion_niveles" />
      </div>
      <div ref={ref} style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <ResponsiveContainer width="55%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={58} outerRadius={100} paddingAngle={2}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v, name) => [`${v} (${((v/total)*100).toFixed(0)}%)`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, minWidth: 130 }}>
          {data.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: '.83rem', flex: 1 }}>{d.name}</span>
              <strong style={{ color: d.color }}>{d.value}</strong>
              <span style={{ fontSize: '.74rem', color: 'var(--text-muted)', minWidth: 34 }}>
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--text-muted)' }}>
            Total: <strong>{total}</strong> evaluados
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GRÁFICO 3 — θ PROMEDIO POR EVALUACIÓN
// ════════════════════════════════════════════════════════════════
function G3ThetaEval({ intentos }) {
  const ref = useRef(null)
  const data = useMemo(() => {
    const g = {}
    intentos?.filter(i => i.estado_descripcion === 'Completado').forEach(i => {
      const k = (i.evaluacion_descripcion || 'Sin eval.').slice(0, 28)
      if (!g[k]) g[k] = []
      if (i.habilidad_estim != null) g[k].push(i.habilidad_estim)
    })
    return Object.entries(g).filter(([, v]) => v.length).map(([name, vals]) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      return { name, theta: +avg.toFixed(3), n: vals.length, color: getNivel(avg)?.color ?? '#94a3b8' }
    }).sort((a, b) => b.theta - a.theta)
  }, [intentos])

  if (!data.length) return <NoData />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <BtnGrafica refEl={ref} nombre="theta_promedio_evaluacion" />
      </div>
      <div ref={ref}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[-2, 2]} tick={{ fontSize: 11 }}
              label={{ value: 'θ', angle: -90, position: 'insideLeft', fontSize: 13 }} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2" />
            <Tooltip content={<TT />} formatter={(v, _, { payload }) => [`θ=${v} · n=${payload.n}`, 'Promedio']} />
            <Bar dataKey="theta" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              <LabelList dataKey="theta" position="top" style={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GRÁFICO 4 — DISPERSIÓN θ vs SE
// ════════════════════════════════════════════════════════════════
function G4Scatter({ intentos }) {
  const ref = useRef(null)
  const data = useMemo(() =>
    (intentos ?? []).filter(i => i.habilidad_estim != null && i.error_estandar != null)
      .map(i => ({
        theta: +Number(i.habilidad_estim).toFixed(3),
        se:    +Number(i.error_estandar).toFixed(3),
        color: getNivel(i.habilidad_estim)?.color ?? '#94a3b8',
      })),
  [intentos])

  if (!data.length) return <NoData />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <BtnGrafica refEl={ref} nombre="scatter_theta_se" />
      </div>
      <div ref={ref}>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 16, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="theta" name="θ" type="number" domain={[-2.5, 2.5]} tick={{ fontSize: 11 }}
              label={{ value: 'θ (habilidad estimada)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
            <YAxis dataKey="se" name="SE" type="number" tick={{ fontSize: 11 }}
              label={{ value: 'SE(θ)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }}
              formatter={(v, name) => [Number(v).toFixed(3), name]} />
            <Scatter data={data}>
              {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.75} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
        Cada punto = un intento. Colores según nivel θ. SE bajo = estimación precisa del CAT.
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GRÁFICO 5 — EVOLUCIÓN TEMPORAL θ
// ════════════════════════════════════════════════════════════════
function G5Temporal({ intentos }) {
  const ref = useRef(null)
  const data = useMemo(() =>
    [...(intentos ?? [])]
      .filter(i => i.fecha_inicio && i.habilidad_estim != null && i.estado_descripcion === 'Completado')
      .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
      .map(i => ({
        fecha: new Date(i.fecha_inicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
        theta: +Number(i.habilidad_estim).toFixed(3),
        cand:  (i.candidato_nombre_completo || '').split(' ')[0],
      })),
  [intentos])

  if (!data.length) return <NoData />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <BtnGrafica refEl={ref} nombre="evolucion_temporal_theta" />
      </div>
      <div ref={ref}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
            <YAxis domain={[-2, 2]} tick={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2" />
            <Tooltip formatter={(v, _, { payload }) => [`θ = ${v}  ·  ${payload.cand}`, 'Habilidad']} />
            <Line type="monotone" dataKey="theta" stroke="var(--primary)" strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--primary)', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GRÁFICO 6 — DURACIÓN POR EVALUACIÓN (barras agrupadas min/prom/max)
// ════════════════════════════════════════════════════════════════
function G6Duracion({ intentos }) {
  const ref = useRef(null)
  const data = useMemo(() => {
    const g = {}
    ;(intentos ?? []).forEach(i => {
      if (!i.duracion_segundos) return
      const k = (i.evaluacion_descripcion || 'Sin eval.').slice(0, 24)
      if (!g[k]) g[k] = []
      g[k].push(i.duracion_segundos / 60)
    })
    return Object.entries(g).map(([name, vals]) => ({
      name,
      Mínimo:   +Math.min(...vals).toFixed(1),
      Promedio: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      Máximo:   +Math.max(...vals).toFixed(1),
    })).sort((a, b) => b.Promedio - a.Promedio)
  }, [intentos])

  if (!data.length) return <NoData />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <BtnGrafica refEl={ref} nombre="duracion_evaluacion" />
      </div>
      <div ref={ref}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }}
              label={{ value: 'min', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip content={<TT />} />
            <Legend iconSize={10} formatter={v => <span style={{ fontSize: '.77rem' }}>{v}</span>} />
            <Bar dataKey="Mínimo"   fill="#bfdbfe" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Promedio" fill="var(--primary)" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Promedio" position="top" style={{ fontSize: 10 }} />
            </Bar>
            <Bar dataKey="Máximo"   fill="#93c5fd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GRÁFICO 7 — θ TOP-15 CANDIDATOS (barras horizontales)
// ════════════════════════════════════════════════════════════════
function G7Candidatos({ intentos }) {
  const ref = useRef(null)
  const data = useMemo(() =>
    [...(intentos ?? [])]
      .filter(i => i.habilidad_estim != null && i.estado_descripcion === 'Completado')
      .sort((a, b) => (b.habilidad_estim || 0) - (a.habilidad_estim || 0))
      .slice(0, 15)
      .map(i => ({
        nombre: (i.candidato_nombre_completo || 'Sin nombre').slice(0, 22),
        theta:  +Number(i.habilidad_estim).toFixed(3),
        color:  getNivel(i.habilidad_estim)?.color ?? '#94a3b8',
      })),
  [intentos])

  if (!data.length) return <NoData />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <BtnGrafica refEl={ref} nombre="theta_top15_candidatos" />
      </div>
      <div ref={ref}>
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 30)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 50, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" domain={[-2, 2]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 10 }} />
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 2" />
            <Tooltip formatter={v => [`θ = ${Number(v).toFixed(3)}`, 'Habilidad estimada']} />
            <Bar dataKey="theta" radius={[0, 6, 6, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              <LabelList dataKey="theta" position="right"
                style={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: 4 }}>
        Top 15 candidatos por θ entre evaluaciones completadas.
      </p>
    </div>
  )
}

// ── Placeholder sin datos ─────────────────────────────────────
function NoData() {
  return (
    <div style={{
      textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px',
      fontSize: '.88rem',
    }}>
      Sin datos suficientes para esta gráfica.
    </div>
  )
}

// ── Menú de gráficas ──────────────────────────────────────────
const MENU = [
  { id: 'g1', label: '💼 Niveles × Vacante',    desc: 'Distribución de niveles por cada vacante' },
  { id: 'g2', label: '🥧 Distribución Global',   desc: 'Donut de niveles en todos los intentos' },
  { id: 'g3', label: '📈 θ × Evaluación',        desc: 'Promedio de θ por evaluación configurada' },
  { id: 'g4', label: '🎯 Dispersión θ vs SE',    desc: 'Precisión del CAT (nube de puntos)' },
  { id: 'g5', label: '📉 Evolución Temporal',    desc: 'Tendencia de θ en el tiempo' },
  { id: 'g6', label: '⏱️ Duración × Evaluación', desc: 'Mínimo, promedio y máximo en minutos' },
  { id: 'g7', label: '👤 θ Top-15 Candidatos',   desc: 'Ranking de candidatos por habilidad estimada' },
]

function PanelGraficas({ intentos, reporte }) {
  const [activa, setActiva] = useState('g1')

  const componentes = {
    g1: <G1NivelesPorVacante  reporte={reporte}   />,
    g2: <G2Distribucion        intentos={intentos} />,
    g3: <G3ThetaEval           intentos={intentos} />,
    g4: <G4Scatter             intentos={intentos} />,
    g5: <G5Temporal            intentos={intentos} />,
    g6: <G6Duracion            intentos={intentos} />,
    g7: <G7Candidatos          intentos={intentos} />,
  }

  const meta = MENU.find(m => m.id === activa)

  return (
    <Card style={{ marginBottom: 20 }}>
      {/* Selector horizontal */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        paddingBottom: 14, marginBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        {MENU.map(m => (
          <button key={m.id} onClick={() => setActiva(m.id)} title={m.desc} style={{
            padding: '6px 13px', borderRadius: 99, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: '.79rem', fontWeight: 600, transition: 'all .15s',
            background: activa === m.id ? 'var(--primary)' : 'var(--border)',
            color:      activa === m.id ? '#fff'           : 'var(--text)',
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontSize: '.95rem', margin: 0, color: 'var(--text-h)' }}>{meta?.label}</h3>
          <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>{meta?.desc}</p>
        </div>
      </div>

      {componentes[activa]}
    </Card>
  )
}

// ── Columnas tablas ───────────────────────────────────────────
const COLS_EVAL_TABLA = [
  { key: 'id',              label: 'ID',          width: 55 },
  { key: 'descripcion',     label: 'Evaluación' },
  { key: 'total_habilidades', label: 'Habilidades', width: 100 },
  { key: 'ind_activa',      label: 'Activa',       width: 80,
    render: v => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Sí' : 'No'}</Badge> },
]

const COLS_INT_TABLA = [
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'evaluacion_descripcion',    label: 'Evaluación' },
  { key: 'estado_descripcion',        label: 'Estado',  width: 120,
    render: v => {
      const m = { 'En Progreso':'warning', Completado:'success', Abandonado:'danger', Anulado:'primary' }
      return <Badge variant={m[v]||'info'}>{v}</Badge>
    }},
  { key: 'habilidad_estim', label: 'θ',     width: 85,
    render: v => v != null ? <strong style={{ color: getNivel(v)?.color }}>{Number(v).toFixed(3)}</strong> : '—' },
  { key: 'habilidad_estim', label: 'Nivel', width: 130, render: v => <NivelBadge theta={v} /> },
  { key: 'error_estandar',  label: 'SE(θ)', width: 80,
    render: v => v != null ? Number(v).toFixed(3) : '—' },
  { key: 'duracion_segundos', label: 'Duración', width: 90,
    render: v => v != null ? `${Math.round(v/60)} min` : '—' },
  { key: 'fecha_inicio',    label: 'Inicio', width: 105,
    render: v => v ? new Date(v).toLocaleDateString('es-CO') : '—' },
]

const COLS_INT_EXPORT = [
  { key: 'candidato_nombre_completo', label: 'Candidato' },
  { key: 'evaluacion_descripcion',    label: 'Evaluación' },
  { key: 'estado_descripcion',        label: 'Estado' },
  { key: 'habilidad_estim',           label: 'θ Estimado' },
  { key: 'error_estandar',            label: 'SE(θ)' },
  { key: 'duracion_segundos',         label: 'Duración (seg)' },
  { key: 'fecha_inicio',              label: 'Inicio' },
  { key: 'fecha_fin',                 label: 'Fin' },
]

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────
export default function Evaluacion() {
  const { user } = useAuth()
  const cid      = user?.compania

  const evals    = useFetch(() => evaluacionService.vEvaluaciones(cid), [cid])
  const intentos = useFetch(() => evaluacionService.vIntentos(cid),     [cid])
  const reporte  = useFetch(() => candidatosService.getReporte(cid),    [cid])

  const completados = useMemo(
    () => intentos.data?.filter(i => i.estado_descripcion === 'Completado') ?? [],
    [intentos.data]
  )
  const avgTheta = completados.length
    ? (completados.reduce((s, i) => s + (i.habilidad_estim || 0), 0) / completados.length).toFixed(3)
    : null

  const topNivel = useMemo(() => {
    const c = Object.fromEntries(NIVELES.map(n => [n.label, 0]))
    completados.forEach(i => { const n = getNivel(i.habilidad_estim); if (n) c[n.label]++ })
    const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]
    return top?.[1] > 0 ? top[0] : null
  }, [completados])

  return (
    <div>
      <PageHeader title="Evaluaciones" subtitle="Motor CAT · TRI 3PL · Análisis de competencias" />

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(148px,1fr))', gap:12, marginBottom:20 }}>
        {[
          { icon:'📋', label:'Evaluaciones activas', value: evals.data?.filter(e=>e.ind_activa).length },
          { icon:'🏃', label:'Intentos totales',     value: intentos.data?.length },
          { icon:'✅', label:'Completados',          value: completados.length },
          { icon:'📈', label:'θ Promedio',           value: avgTheta },
          { icon:'🏆', label:'Nivel frecuente',      value: topNivel, small: true },
        ].map(k => (
          <Card key={k.label} style={{ display:'flex', alignItems:'center', gap:10, padding:13 }}>
            <span style={{ fontSize:'1.6rem' }}>{k.icon}</span>
            <div style={{ minWidth:0 }}>
              <div style={{
                fontSize: k.small ? '.9rem' : '1.35rem', fontWeight:800, color:'var(--primary)',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              }}>{k.value ?? '—'}</div>
              <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{k.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Panel de gráficas */}
      {(intentos.loading || reporte.loading) ? (
        <Card style={{ marginBottom:20 }}><Spinner label="Cargando análisis..." /></Card>
      ) : (
        <PanelGraficas intentos={intentos.data ?? []} reporte={reporte.data ?? []} />
      )}

      {/* Tabla Evaluaciones */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ fontSize:'.95rem', margin:0 }}>📋 Evaluaciones Configuradas</h3>
          <BtnExcel onClick={() => exportarExcel(evals.data??[], COLS_EVAL_TABLA, 'evaluaciones')} />
        </div>
        {evals.loading ? <Spinner size="sm" /> : (
          <Table columns={COLS_EVAL_TABLA} data={evals.data??[]} empty="Sin evaluaciones." />
        )}
      </Card>

      {/* Tabla Intentos */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ fontSize:'.95rem', margin:0 }}>🏃 Intentos de Evaluación</h3>
          <BtnExcel onClick={() => exportarExcel(intentos.data??[], COLS_INT_EXPORT, 'intentos_evaluacion')} />
        </div>
        {intentos.loading ? <Spinner size="sm" /> : (
          <Table columns={COLS_INT_TABLA} data={intentos.data??[]} empty="Sin intentos." />
        )}
      </Card>

      {/* Escala */}
      <Card>
        <h3 style={{ fontSize:'.88rem', marginBottom:10 }}>📊 Escala θ — TRI 3PL</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
          {NIVELES.map(n => (
            <div key={n.label} style={{
              padding:'5px 13px', borderRadius:99,
              border:`2px solid ${n.color}20`, background:`${n.color}10`,
              color:n.color, fontWeight:600, fontSize:'.78rem',
            }}>
              {n.label} · {n.min >= 0 ? `≥ ${n.min}` : `[${n.min}, ${n.max})`}
            </div>
          ))}
        </div>
        <p style={{ fontSize:'.77rem', color:'var(--text-muted)', margin:0 }}>
          θ estima la habilidad del candidato mediante CAT con modelo TRI 3PL.
          SE bajo indica mayor precisión. Prior N(0,1) estabiliza estimaciones extremas.
        </p>
      </Card>
    </div>
  )
}

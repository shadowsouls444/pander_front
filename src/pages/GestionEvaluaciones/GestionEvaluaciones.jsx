// src/pages/GestionEvaluaciones/GestionEvaluaciones.jsx  — v6
// FIX #2: CRUD completo de habilidades (crear, editar, eliminar)
//         Banco filtrado por evaluación seleccionada
// FIX #4: Selects / checkboxes pre-llenan correctamente en edición
import { useState, useEffect } from 'react'
import { useFetch }  from '../../hooks/useFetch'
import { useAuth }   from '../../context/AuthContext'
import { evaluacionService } from '../../services'
import {
  PageHeader, Card, Button, Input, Badge,
  Alert, Spinner, Modal,
} from '../../components/ui'

const NIVELES = [
  { rango: [1.5, 4],    label: 'Sobresaliente', color: '#15803d' },
  { rango: [0.5, 1.5],  label: 'Alto',          color: '#2563eb' },
  { rango: [-0.5, .5],  label: 'Medio',         color: '#b45309' },
  { rango: [-1.5, -.5], label: 'Bajo',          color: '#dc2626' },
  { rango: [-4, -1.5],  label: 'Muy Bajo',      color: '#7f1d1d' },
]

// ── Modal crear/editar Evaluación ────────────────────────────
function ModalEvaluacion({ open, onClose, evaluacion, companiaId, userId, onSaved }) {
  const isEdit = !!evaluacion
  const [form, setForm]     = useState({ descripcion: '', ind_activa: true })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // FIX #4: pre-llenar desde el objeto recibido
  useEffect(() => {
    if (open) {
      setForm(evaluacion
        ? { descripcion: evaluacion.descripcion ?? '', ind_activa: !!evaluacion.ind_activa }
        : { descripcion: '', ind_activa: true })
      setMsg(null)
    }
  }, [evaluacion, open])

  const handleSave = async () => {
    if (!form.descripcion.trim()) {
      setMsg({ type: 'error', text: 'El nombre es obligatorio.' })
      return
    }
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
      onSaved(); onClose()
    } catch (e) {
      setMsg({ type: 'error',
        text: e?.response?.data?.detail
          || JSON.stringify(e?.response?.data)
          || 'Error al guardar.' })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? '✏️ Editar Evaluación' : '➕ Nueva Evaluación'} size="sm">
      {msg && <Alert type={msg.type === 'ok' ? 'success' : 'error'} style={{ marginBottom: 12 }}>
        {msg.text}
      </Alert>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Nombre de la Evaluación *"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Ej: Evaluación de Competencias Blandas" />
        {/* FIX #4: checked vinculado al estado del form */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '.88rem', fontWeight: 500, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.ind_activa}
            onChange={e => set('ind_activa', e.target.checked)}
            style={{ width: 16, height: 16 }} />
          Evaluación activa
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSave} loading={loading} icon="💾">
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Modal CRUD Habilidad (banco global) ──────────────────────
// FIX #2: CRUD completo de habilidades
function ModalHabilidadForm({ open, onClose, habilidad, onSaved }) {
  const isEdit = !!habilidad
  const DEFAULT = { descripcion: '', dificultad: 0.0, discriminacion: 1.0, adivinabilidad: 0.0 }
  const [form, setForm]     = useState(DEFAULT)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open) {
      setForm(habilidad
        ? {
            descripcion:    habilidad.descripcion    ?? '',
            dificultad:     habilidad.dificultad     ?? 0.0,
            discriminacion: habilidad.discriminacion ?? 1.0,
            adivinabilidad: habilidad.adivinabilidad ?? 0.0,
          }
        : DEFAULT)
      setMsg(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habilidad, open])

  const handleSave = async () => {
    if (!form.descripcion.trim()) {
      setMsg({ type: 'error', text: 'El nombre es obligatorio.' })
      return
    }
    setLoading(true); setMsg(null)
    try {
      if (isEdit) {
        await evaluacionService.updateHabilidad(habilidad.id, form)
      } else {
        await evaluacionService.createHabilidad(form)
      }
      onSaved(); onClose()
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.detail || 'Error al guardar.' })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? '✏️ Editar Habilidad' : '➕ Nueva Habilidad'} size="md">
      {msg && <Alert type={msg.type === 'ok' ? 'success' : 'error'} style={{ marginBottom: 12 }}>
        {msg.text}
      </Alert>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Nombre de la Habilidad *"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            ['dificultad',     'Dificultad (b)'],
            ['discriminacion', 'Discriminación (a)'],
            ['adivinabilidad', 'Adivinabilidad (c)'],
          ].map(([k, l]) => (
            <div key={k}>
              <label style={{ fontSize: '.78rem', fontWeight: 600,
                display: 'block', marginBottom: 4 }}>{l}</label>
              <input type="number" step="0.1"
                value={form[k]}
                onChange={e => set(k, parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 10px',
                  border: '1.5px solid var(--border)', borderRadius: 6,
                  fontFamily: 'var(--font)', outline: 'none' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSave} loading={loading} icon="💾">
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Modal asignar/desasignar habilidades a evaluación ────────
function ModalAsignarHabilidades({ open, onClose, evaluacion, companiaId, userId }) {
  const todasHabilidades = useFetch(() => evaluacionService.getHabilidades())
  const asignadas = useFetch(
    () => evaluacionService.getEvalHabilidades(companiaId, evaluacion?.id),
    [evaluacion?.id]
  )
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)

  const asignadasIds = new Set(asignadas.data?.map(eh => eh.habilidad) ?? [])

  const toggle = async (habId) => {
    setLoading(true); setMsg(null)
    try {
      if (asignadasIds.has(habId)) {
        const rel = asignadas.data.find(eh => eh.habilidad === habId)
        await evaluacionService.desasignarHabilidad(companiaId, evaluacion.id, rel.id)
      } else {
        await evaluacionService.asignarHabilidad(companiaId, evaluacion.id, {
          habilidad:        habId,
          orden:            (asignadas.data?.length ?? 0) + 1,
          obligatoria:      true,
          usuario_creacion: userId,
          compania:         companiaId,
        })
      }
      asignadas.reload()
      setMsg({ type: 'ok', text: 'Actualizado.' })
      setTimeout(() => setMsg(null), 1500)
    } catch {
      setMsg({ type: 'error', text: 'Error al actualizar.' })
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose}
      title={`🧠 Habilidades — ${evaluacion?.descripcion}`} size="md">
      {msg && <Alert type={msg.type === 'ok' ? 'success' : 'error'} style={{ marginBottom: 10 }}>
        {msg.text}
      </Alert>}
      <p style={{ fontSize: '.83rem', color: 'var(--text-muted)', marginBottom: 14 }}>
        Marca las habilidades que se evaluarán en esta configuración.
      </p>
      {(todasHabilidades.loading || asignadas.loading) ? <Spinner size="sm" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todasHabilidades.data?.map(h => {
            const activa = asignadasIds.has(h.id)
            return (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 10,
                background: activa ? 'var(--primary-bg)' : 'var(--bg)',
                border: `1.5px solid ${activa ? 'var(--primary-border)' : 'var(--border)'}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{h.descripcion}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    a={Number(h.discriminacion ?? 0).toFixed(2)} ·
                    b={Number(h.dificultad     ?? 0).toFixed(2)} ·
                    c={Number(h.adivinabilidad ?? 0).toFixed(2)} ·
                    {' '}{h.total_preguntas ?? 0} preguntas
                  </div>
                </div>
                <button onClick={() => toggle(h.id)} disabled={loading}
                  style={{
                    padding: '6px 14px', borderRadius: 99, border: 'none',
                    cursor: 'pointer', fontFamily: 'var(--font)',
                    fontSize: '.8rem', fontWeight: 700, transition: 'all .2s',
                    background: activa ? 'var(--danger-bg)' : 'var(--primary)',
                    color:      activa ? 'var(--danger)'    : '#fff',
                  }}>
                  {activa ? '✕ Quitar' : '+ Asignar'}
                </button>
              </div>
            )
          })}
          {!todasHabilidades.data?.length && (
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
              No hay habilidades. Créalas en "Banco de Habilidades".
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Modal preguntas de una habilidad ─────────────────────────
function ModalPreguntas({ habilidad, onClose }) {
  const preguntas = useFetch(() => evaluacionService.getPreguntas(habilidad.id), [habilidad.id])
  const DEFAULT_FORM = {
    contenido: '', criterio_a: 1.0, criterio_b: 0.0, criterio_c: 0.1,
    opciones: [
      { contenido: '', ind_correcta: true  },
      { contenido: '', ind_correcta: false },
      { contenido: '', ind_correcta: false },
      { contenido: '', ind_correcta: false },
    ],
  }
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [editPreg, setEditPreg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setOpc = (i, k, v) => setForm(f => {
    const ops = [...f.opciones]
    if (k === 'ind_correcta' && v)
      ops.forEach((_, j) => { ops[j] = { ...ops[j], ind_correcta: j === i } })
    else
      ops[i] = { ...ops[i], [k]: v }
    return { ...f, opciones: ops }
  })
  const resetForm = () => { setForm(DEFAULT_FORM); setEditPreg(null) }

  const handleSave = async () => {
    if (!form.contenido.trim()) {
      setMsg({ type: 'error', text: 'El enunciado es obligatorio.' }); return
    }
    const ops = form.opciones.filter(o => o.contenido.trim())
    if (ops.length < 2) {
      setMsg({ type: 'error', text: 'Se requieren al menos 2 opciones.' }); return
    }
    if (!ops.some(o => o.ind_correcta)) {
      setMsg({ type: 'error', text: 'Marca una opción correcta.' }); return
    }
    setLoading(true); setMsg(null)
    try {
      if (editPreg) {
        await evaluacionService.updatePregunta(habilidad.id, editPreg.id,
          { ...form, ind_activa: true, opciones: ops })
      } else {
        await evaluacionService.createPregunta(habilidad.id,
          { ...form, ind_activa: true, opciones: ops })
      }
      setMsg({ type: 'ok', text: editPreg ? 'Pregunta actualizada.' : 'Pregunta creada.' })
      preguntas.reload(); resetForm()
    } catch { setMsg({ type: 'error', text: 'Error al guardar.' }) }
    finally { setLoading(false) }
  }

  const handleEdit = async (p) => {
    setEditPreg(p); setMsg(null)
    try {
      const res = await evaluacionService.getRespuestas(p.id)
      const ops = res.data.map(r => ({
        id: r.id, contenido: r.contenido, ind_correcta: r.ind_correcta,
      }))
      while (ops.length < 4) ops.push({ contenido: '', ind_correcta: false })
      setForm({
        contenido:   p.contenido,
        criterio_a:  p.criterio_a,
        criterio_b:  p.criterio_b,
        criterio_c:  p.criterio_c,
        opciones:    ops,
      })
    } catch { setMsg({ type: 'error', text: 'Error al cargar la pregunta.' }) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    try { await evaluacionService.deletePregunta(habilidad.id, id); preguntas.reload() }
    catch { alert('Error al eliminar.') }
  }

  return (
    <Modal open onClose={onClose}
      title={`❓ Preguntas — ${habilidad.descripcion}`} size="lg">
      {msg && <Alert type={msg.type === 'ok' ? 'success' : 'error'}
        onClose={() => setMsg(null)} style={{ marginBottom: 10 }}>{msg.text}</Alert>}

      {/* Lista de preguntas existentes */}
      <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
        {preguntas.loading ? <Spinner size="sm" /> :
          !preguntas.data?.length
            ? <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Sin preguntas aún.</p>
            : preguntas.data.map((p, i) => (
              <div key={p.id} style={{ padding: '10px 14px', marginBottom: 6,
                background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)',
                display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '.87rem', marginBottom: 2 }}>
                    {i + 1}. {p.contenido}
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                    a={p.criterio_a} · b={p.criterio_b} · c={p.criterio_c}
                  </div>
                </div>
                <button onClick={() => handleEdit(p)}
                  style={{ padding: '3px 10px', background: 'var(--primary-bg)',
                    color: 'var(--primary)', border: 'none', borderRadius: 6,
                    cursor: 'pointer', fontSize: '.76rem', fontWeight: 600 }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(p.id)}
                  style={{ padding: '3px 10px', background: 'var(--danger-bg)',
                    color: 'var(--danger)', border: 'none', borderRadius: 6,
                    cursor: 'pointer', fontSize: '.76rem', fontWeight: 600 }}>
                  Eliminar
                </button>
              </div>
            ))
        }
      </div>

      {/* Formulario crear/editar */}
      <div style={{ background: 'var(--primary-bg)', borderRadius: 12, padding: 16,
        border: '1px solid var(--primary-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize: '.9rem', color: 'var(--primary)', margin: 0 }}>
            {editPreg ? '✏️ Editando pregunta' : '➕ Nueva Pregunta'}
          </h4>
          {editPreg && (
            <button onClick={resetForm}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '.8rem' }}>
              Cancelar edición
            </button>
          )}
        </div>

        <textarea value={form.contenido}
          onChange={e => set('contenido', e.target.value)}
          placeholder="Enunciado de la pregunta..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
            fontSize: '.9rem', minHeight: 60, resize: 'vertical',
            outline: 'none', marginBottom: 10 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 8, marginBottom: 12 }}>
          {[
            ['criterio_a', 'Discriminación (a)'],
            ['criterio_b', 'Dificultad (b)'],
            ['criterio_c', 'Adivinabilidad (c)'],
          ].map(([k, l]) => (
            <div key={k}>
              <label style={{ fontSize: '.72rem', fontWeight: 600,
                display: 'block', marginBottom: 4 }}>{l}</label>
              <input type="number" step="0.1" value={form[k]}
                onChange={e => set(k, parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '6px 10px',
                  border: '1.5px solid var(--border)', borderRadius: 6,
                  fontFamily: 'var(--font)', outline: 'none' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {form.opciones.map((op, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="radio" name="correcta" checked={!!op.ind_correcta}
                onChange={() => setOpc(i, 'ind_correcta', true)}
                style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }} />
              <input value={op.contenido}
                onChange={e => setOpc(i, 'contenido', e.target.value)}
                placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: 8,
                  fontFamily: 'var(--font)', fontSize: '.88rem', outline: 'none',
                  border: `1.5px solid ${op.ind_correcta ? '#86efac' : 'var(--border)'}`,
                  background: op.ind_correcta ? '#f0fdf4' : 'var(--input-bg)',
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

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function GestionEvaluaciones() {
  const { user } = useAuth()
  const cid      = user?.compania

  // Datos globales
  const todasHabilidades = useFetch(() => evaluacionService.getHabilidades())
  const evaluaciones     = useFetch(() => evaluacionService.getEvaluaciones(cid), [cid])

  // Evaluación seleccionada en el panel izquierdo
  const [evalSel, setEvalSel] = useState(null)

  // Habilidades asignadas a la evaluación seleccionada
  const habsAsignadas = useFetch(
    () => evalSel
      ? evaluacionService.getEvalHabilidades(cid, evalSel.id)
      : Promise.resolve({ data: [] }),
    [evalSel?.id]
  )
  const habsAsignadasIds = new Set(habsAsignadas.data?.map(eh => eh.habilidad) ?? [])

  // FIX #2: banco filtrado según evaluación seleccionada
  const habsMostradas = evalSel
    ? (todasHabilidades.data ?? []).filter(h => habsAsignadasIds.has(h.id))
    : (todasHabilidades.data ?? [])

  // Modales
  const [modalEval,      setModalEval]      = useState(null)  // null | 'new' | obj
  const [modalAsignar,   setModalAsignar]   = useState(null)  // evaluacion obj
  const [panelPreg,      setPanelPreg]      = useState(null)  // habilidad obj
  const [modalHabForm,   setModalHabForm]   = useState(null)  // null | 'new' | obj
  const [msg, setMsg] = useState(null)

  const handleDeleteEval = async (id) => {
    if (!confirm('¿Eliminar esta evaluación?')) return
    try {
      await evaluacionService.deleteEvaluacion(cid, id)
      if (evalSel?.id === id) setEvalSel(null)
      evaluaciones.reload()
    } catch { alert('Error al eliminar.') }
  }

  const handleDeleteHabilidad = async (id) => {
    if (!confirm('¿Eliminar esta habilidad del banco global?')) return
    try { await evaluacionService.deleteHabilidad(id); todasHabilidades.reload() }
    catch { alert('Error al eliminar habilidad.') }
  }

  return (
    <div>
      <PageHeader
        title="Configuración de Evaluaciones"
        subtitle="Evaluaciones · Habilidades · Preguntas TRI"
        action={<Button icon="➕" onClick={() => setModalEval('new')}>Nueva Evaluación</Button>}
      />

      {msg && <Alert type={msg.type === 'ok' ? 'success' : 'error'}
        onClose={() => setMsg(null)} style={{ marginBottom: 16 }}>{msg.text}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Panel izquierdo: lista de evaluaciones ── */}
        <Card>
          <h3 style={{ fontSize: '.95rem', marginBottom: 14 }}>📋 Evaluaciones</h3>
          {evaluaciones.loading ? <Spinner size="sm" /> :
            !evaluaciones.data?.length
              ? <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
                  Sin evaluaciones. Crea la primera.
                </p>
              : evaluaciones.data.map(e => (
                <div key={e.id} style={{
                  padding: '10px 14px', marginBottom: 8, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${evalSel?.id === e.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: evalSel?.id === e.id ? 'var(--primary-bg)' : 'var(--bg)',
                  transition: 'all .15s',
                }} onClick={() => setEvalSel(e.id === evalSel?.id ? null : e)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{e.descripcion}</div>
                      <div style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        ID: {e.id}
                      </div>
                    </div>
                    <Badge variant={e.ind_activa ? 'success' : 'danger'}>
                      {e.ind_activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}
                    onClick={ev => ev.stopPropagation()}>
                    <Button size="sm" variant="secondary" icon="🧠"
                      onClick={() => setModalAsignar(e)}>Habilidades</Button>
                    <Button size="sm" variant="secondary" icon="✏️"
                      onClick={() => setModalEval(e)}>Editar</Button>
                    <Button size="sm" variant="danger" icon="🗑️"
                      onClick={() => handleDeleteEval(e.id)}>Eliminar</Button>
                  </div>
                </div>
              ))
          }
        </Card>

        {/* ── Panel derecho: banco de habilidades ── */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '.95rem', margin: 0 }}>
              {evalSel
                ? `🧠 Habilidades de: ${evalSel.descripcion}`
                : '🧠 Banco Global de Habilidades'}
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {evalSel && (
                <Button size="sm" variant="ghost" onClick={() => setEvalSel(null)}>
                  Ver todas
                </Button>
              )}
              {/* FIX #2: botón para crear habilidad */}
              <Button size="sm" icon="➕" onClick={() => setModalHabForm('new')}>
                Nueva Habilidad
              </Button>
            </div>
          </div>

          {evalSel && (
            <div style={{ background: 'var(--primary-bg)', borderRadius: 8,
              padding: '8px 12px', fontSize: '.8rem', color: 'var(--primary)',
              marginBottom: 14, border: '1px solid var(--primary-border)' }}>
              Mostrando {habsMostradas.length} habilidad(es) de esta evaluación.
              <button onClick={() => setModalAsignar(evalSel)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontWeight: 700,
                  textDecoration: 'underline', marginLeft: 8 }}>
                Gestionar asignación
              </button>
            </div>
          )}

          {todasHabilidades.loading ? <Spinner size="sm" /> :
            !habsMostradas.length ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
                {evalSel
                  ? 'No hay habilidades asignadas. Usa "Gestionar asignación".'
                  : 'No hay habilidades en el banco.'}
              </p>
            ) : (
              <div style={{ display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                {habsMostradas.map(h => (
                  <div key={h.id} style={{ padding: 14, background: 'var(--bg)',
                    borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', flex: 1,
                        paddingRight: 6 }}>{h.descripcion}</div>
                      <Badge variant="primary">{h.total_preguntas ?? 0}</Badge>
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)',
                      marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span>a={Number(h.discriminacion ?? 0).toFixed(2)}</span>
                      <span>b={Number(h.dificultad     ?? 0).toFixed(2)}</span>
                      <span>c={Number(h.adivinabilidad ?? 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setPanelPreg(h)}
                        style={{ flex: 1, padding: '5px 0', background: 'var(--primary)',
                          color: '#fff', border: 'none', borderRadius: 6,
                          cursor: 'pointer', fontSize: '.76rem', fontWeight: 600 }}>
                        ❓ Preguntas
                      </button>
                      {/* FIX #2: botones editar y eliminar habilidad */}
                      <button onClick={() => setModalHabForm(h)}
                        style={{ padding: '5px 10px', background: 'var(--primary-bg)',
                          color: 'var(--primary)', border: 'none', borderRadius: 6,
                          cursor: 'pointer', fontSize: '.76rem', fontWeight: 600 }}>✏️</button>
                      <button onClick={() => handleDeleteHabilidad(h.id)}
                        style={{ padding: '5px 10px', background: 'var(--danger-bg)',
                          color: 'var(--danger)', border: 'none', borderRadius: 6,
                          cursor: 'pointer', fontSize: '.76rem', fontWeight: 600 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          {/* Escala θ */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-h)',
              marginBottom: 8 }}>📊 Escala de Niveles θ</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NIVELES.map(n => (
                <div key={n.label} style={{ padding: '4px 12px', borderRadius: 99,
                  border: `2px solid ${n.color}20`, background: `${n.color}10`,
                  color: n.color, fontWeight: 600, fontSize: '.75rem' }}>
                  {n.label} ({n.rango[0]} → {n.rango[1]})
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Modales ── */}
      {(modalEval === 'new' || (modalEval && typeof modalEval === 'object')) && (
        <ModalEvaluacion open onClose={() => setModalEval(null)}
          evaluacion={modalEval === 'new' ? null : modalEval}
          companiaId={cid} userId={user?.id}
          onSaved={() => { evaluaciones.reload(); habsAsignadas.reload() }} />
      )}
      {modalAsignar && (
        <ModalAsignarHabilidades open onClose={() => setModalAsignar(null)}
          evaluacion={modalAsignar} companiaId={cid} userId={user?.id} />
      )}
      {panelPreg && (
        <ModalPreguntas habilidad={panelPreg} onClose={() => setPanelPreg(null)} />
      )}
      {(modalHabForm === 'new' || (modalHabForm && typeof modalHabForm === 'object')) && (
        <ModalHabilidadForm open onClose={() => setModalHabForm(null)}
          habilidad={modalHabForm === 'new' ? null : modalHabForm}
          onSaved={() => { todasHabilidades.reload(); habsAsignadas.reload() }} />
      )}
    </div>
  )
}

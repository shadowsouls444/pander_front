// src/pages/GestionVacantes/GestionVacantes.jsx
// ─────────────────────────────────────────────
// FIX SELECT EN EDICIÓN:
// El problema raíz: el backend devuelve FK como int (ej: unidad: 3).
// Los <option value={u.id}> comparan value como string en el DOM.
// Por eso String(form.unidad) es obligatorio en el value del <select>.
// Se aplica a todos los campos FK: unidad, estado, tipo_contrato.
//
// Patrón correcto: value={String(form.campo ?? '')}
// En onChange: guardar como Number para que el PUT envíe int al backend.
// ─────────────────────────────────────────────
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { vacantesService, empresaService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Select, Badge } from '../../components/ui'

const COLS = [
  { key: 'id_interno', label: 'ID', width: 60 },
  {
    key: 'descripcion', label: 'Descripción',
    render: v => <span title={v}>{v?.slice(0, 50)}{v?.length > 50 ? '...' : ''}</span>
  },
  { key: 'unidad_descripcion', label: 'Unidad' },
  {
    key: 'estado_descripcion', label: 'Estado', width: 120,
    render: v => {
      const m = { Abierta: 'success', 'En Evaluación': 'warning', Cerrada: 'danger', Finalizada: 'primary' }
      return <Badge variant={m[v] || 'info'}>{v}</Badge>
    }
  },
  { key: 'tipo_contrato_descripcion', label: 'Contrato', width: 130 },
  { key: 'anio_experiencia', label: 'Exp.(años)', width: 90 },
  {
    key: 'salario_minimo', label: 'Sal. Min.', width: 110,
    render: v => v ? `$${Number(v).toLocaleString('es-CO')}` : '—'
  },
  {
    key: 'ind_publicada', label: 'Publicada', width: 90,
    render: v => <Badge variant={v ? 'success' : 'warning'}>{v ? 'Sí' : 'No'}</Badge>
  },
]

function Form({ form, setForm }) {
  const { user } = useAuth()
  const cid = user?.compania
  const estados = useFetch(() => vacantesService.getEstadosVacante())
  const contratos = useFetch(() => vacantesService.getTiposContrato())
  const unidades = useFetch(() => empresaService.getUnidades(cid), [cid])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <textarea
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
          fontSize: '.9rem', minHeight: 80, resize: 'vertical', outline: 'none',
        }}
        placeholder="Descripción de la vacante *"
        value={form.descripcion || ''}
        onChange={e => set('descripcion', e.target.value)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/*
          FIX: value={String(form.unidad ?? '')}
          El DOM de <select> siempre compara el value como string.
          Si form.unidad viene como int 3 desde el backend y el option
          tiene value={3} (también int), React convierte ambos a string
          internamente, PERO solo si value del select también es string.
          Usar String() garantiza la comparación correcta.
        */}
        <Select
          label="Unidad Organizacional *"
          value={String(form.unidad_id ?? form.unidad ?? '')}
          onChange={e => setForm(f => ({
            ...f,
            unidad: e.target.value ? Number(e.target.value) : '',
            unidad_id: e.target.value ? Number(e.target.value) : ''
          }))}
        >
          <option value="">Seleccionar...</option>
          {unidades.data?.map(u => (
            <option key={u.id} value={String(u.id)}>{u.descripcion}</option>
          ))}
        </Select>

        <Select
          label="Estado *"
          value={String(form.estado_id ?? form.estado ?? '')}
          onChange={e => setForm(f => ({
            ...f,
            estado: e.target.value ? Number(e.target.value) : '',
            estado_id: e.target.value ? Number(e.target.value) : ''
          }))}
        >
          <option value="">Seleccionar...</option>
          {estados.data?.map(e => (
            <option key={e.id} value={String(e.id)}>
              {e.descripcion}
            </option>
          ))}
        </Select>

        <Select
          label="Tipo Contrato *"
          value={String(form.tipo_contrato_id ?? form.tipo_contrato ?? '')}
          onChange={e => setForm(f => ({
            ...f,
            tipo_contrato: e.target.value ? Number(e.target.value) : '',
            tipo_contrato_id: e.target.value ? Number(e.target.value) : ''
          }))}
        >
          <option value="">Seleccionar...</option>
          {contratos.data?.map(c => (
            <option key={c.id} value={String(c.id)}>
              {c.descripcion}
            </option>
          ))}
        </Select>

        <Input
          label="Años de Experiencia"
          type="number"
          value={form.anio_experiencia ?? ''}
          onChange={e => set('anio_experiencia', e.target.value ? Number(e.target.value) : null)}
        />
        <Input
          label="Salario Mínimo (COP)"
          type="number"
          value={form.salario_minimo ?? ''}
          onChange={e => set('salario_minimo', e.target.value ? Number(e.target.value) : null)}
        />
        <Input
          label="Salario Máximo (COP)"
          type="number"
          value={form.salario_maximo ?? ''}
          onChange={e => set('salario_maximo', e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[['ind_activa', 'Activa'], ['ind_publicada', 'Publicada']].map(([k, l]) => (
          <label key={k} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: '.88rem', fontWeight: 500, cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={!!form[k]}
              onChange={e => set(k, e.target.checked)}
            />
            {l}
          </label>
        ))}
      </div>
    </>
  )
}

export default function GestionVacantes() {
  const { user } = useAuth()
  const cid = user?.compania
  const fetch = useFetch(() => vacantesService.vVacantes(cid), [cid])

  const DEFAULT = {
    descripcion: '',
    unidad: '',
    estado: '',
    tipo_contrato: '',
    anio_experiencia: null,
    salario_minimo: null,
    salario_maximo: null,
    ind_activa: true,
    ind_publicada: false,
    usuario_creacion: user?.id || 1,
  }

  return (
    <CrudPage
      title="Vacantes"
      subtitle="Gestión de ofertas laborales"
      columns={COLS}
      fetchData={fetch}
      defaultForm={DEFAULT}
      searchFields={['descripcion', 'unidad_descripcion', 'estado_descripcion']}
      FormContent={Form}
      onSave={async (data, id) => {
        const payload = {
          ...data,
          unidad: data.unidad_id || data.unidad,
          estado: data.estado_id || data.estado,
          tipo_contrato: data.tipo_contrato_id || data.tipo_contrato,
        }
        if (!id) {
          const all = await vacantesService.getVacantes(cid)
          payload.id_interno = (all.data.length || 0) + 1
        }
        return id
          ? await vacantesService.updateVacante(cid, id, payload)
          : await vacantesService.createVacante(cid, payload)
      }}
      onDelete={async row => await vacantesService.deleteVacante(cid, row.id)}
    />
  )
}

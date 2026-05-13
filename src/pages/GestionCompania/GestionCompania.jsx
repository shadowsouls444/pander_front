// ══════════════════════════════════════════════
// src/pages/GestionCompania/GestionCompania.jsx
// ══════════════════════════════════════════════
import { useFetch } from '../../hooks/useFetch'
import { empresaService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Badge } from '../../components/ui'

const COLS = [
  { key: 'id',              label: 'ID',            width: 60 },
  { key: 'descripcion',     label: 'Nombre' },
  { key: 'nit',             label: 'NIT',           width: 120 },
  { key: 'representante_legal', label: 'Representante' },
  { key: 'telefono',        label: 'Teléfono',      width: 120 },
  { key: 'ind_activa',      label: 'Activa',        width: 80,
    render: v => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Sí' : 'No'}</Badge> },
]

const DEFAULT = {
  descripcion: '', nit: '', objeto_social: '',
  representante_legal: '', direccion: '', telefono: '',
  ind_activa: true, ind_evaluacion_vacante: false, usuario_creacion: 1,
}

function Form({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <Input label="Nombre / Razón Social *" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} error={errors.descripcion} required />
      <Input label="NIT *"                   value={form.nit}         onChange={e => set('nit', e.target.value)}         error={errors.nit}         required />
      <Input label="Objeto Social"            value={form.objeto_social||''} onChange={e => set('objeto_social', e.target.value)} />
      <Input label="Representante Legal"     value={form.representante_legal||''} onChange={e => set('representante_legal', e.target.value)} />
      <Input label="Dirección"               value={form.direccion||''} onChange={e => set('direccion', e.target.value)} />
      <Input label="Teléfono"                value={form.telefono||''} onChange={e => set('telefono', e.target.value)} />
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.88rem', fontWeight:500 }}>
        <input type="checkbox" checked={!!form.ind_activa} onChange={e => set('ind_activa', e.target.checked)} />
        Compañía activa
      </label>
    </>
  )
}

export default function GestionCompania() {
  const fetch = useFetch(() => empresaService.getCompanias())
  return (
    <CrudPage
      title="Compañías"
      subtitle="Gestión de empresas suscritas a la plataforma"
      columns={COLS}
      fetchData={fetch}
      defaultForm={DEFAULT}
      searchFields={['descripcion', 'nit', 'representante_legal']}
      FormContent={Form}
      onSave={async (data, id) => id
        ? await empresaService.updateCompania(id, data)
        : await empresaService.createCompania(data)
      }
      onDelete={async row => await empresaService.deleteCompania(row.id)}
    />
  )
}

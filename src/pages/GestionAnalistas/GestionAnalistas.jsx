// ══════════════════════════════════════════════
// src/pages/GestionAnalistas/GestionAnalistas.jsx
// ══════════════════════════════════════════════
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { accesoService, candidatosService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Select } from '../../components/ui'

const COLS = [
  { key: 'compania_id',    label: 'Compañía', width: 80 },
  { key: 'id_interno',     label: 'ID Int.',  width: 80 },
  { key: 'nombre_completo',label: 'Nombre Completo' },
  { key: 'numero_documento',label: 'Documento',  width: 120 },
  { key: 'cargo',          label: 'Cargo' },
  { key: 'telefono',       label: 'Teléfono',    width: 120 },
]

function Form({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const tipos = useFetch(() => candidatosService.getTiposDocumento())
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Primer Nombre *" value={form.primer_nombre||''} onChange={e => set('primer_nombre', e.target.value)} error={errors.primer_nombre} />
        <Input label="Segundo Nombre"  value={form.segundo_nombre||''} onChange={e => set('segundo_nombre', e.target.value)} />
        <Input label="Primer Apellido *" value={form.primer_apellido||''} onChange={e => set('primer_apellido', e.target.value)} error={errors.primer_apellido} />
        <Input label="Segundo Apellido"  value={form.segundo_apellido||''} onChange={e => set('segundo_apellido', e.target.value)} />
      </div>
      <Select label="Tipo Documento" value={form.tipo_documento||''} onChange={e => set('tipo_documento', e.target.value)}>
        <option value="">Sin especificar</option>
        {tipos.data?.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
      </Select>
      <Input label="Número Documento" value={form.numero_documento||''} onChange={e => set('numero_documento', e.target.value)} />
      <Input label="Cargo"            value={form.cargo||''} onChange={e => set('cargo', e.target.value)} />
      <Input label="Teléfono"         value={form.telefono||''} onChange={e => set('telefono', e.target.value)} />
    </>
  )
}

export default function GestionAnalistas() {
  const { user } = useAuth()
  const cid   = user?.compania
  const fetch = useFetch(() => accesoService.vAnalistas(cid), [cid])

  const DEFAULT = { primer_nombre:'', segundo_nombre:'', primer_apellido:'', segundo_apellido:'',
    tipo_documento:'', numero_documento:'', cargo:'', telefono:'', usuario_creacion: user?.id || 1 }

  return (
    <CrudPage
      title="Analistas"
      subtitle="Perfiles del personal de RRHH"
      columns={COLS}
      fetchData={fetch}
      defaultForm={DEFAULT}
      searchFields={['nombre_completo','numero_documento','cargo']}
      FormContent={Form}
      onSave={async (data, id) => {
        const next = { ...data }
        if (!id) {
          const all = await accesoService.getAnalistas(cid)
          next.id_interno = (all.data.length || 0) + 1
        }
        return id
          ? await accesoService.updateAnalista(cid, id, next)
          : await accesoService.createAnalista(cid, next)
      }}
      onDelete={async row => await accesoService.deleteAnalista(cid, row.id)}
    />
  )
}

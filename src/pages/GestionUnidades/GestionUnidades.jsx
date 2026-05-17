// src/pages/GestionUnidades/GestionUnidades.jsx
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { empresaService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input } from '../../components/ui'

const COLS = [
  { key: 'id',          label: 'ID',    width:60 },
  { key: 'compania_descripcion', label: 'Compañía' },
  { key: 'descripcion', label: 'Unidad Organizacional' },
  { key: 'especialidad',label: 'Especialidad' },
]

function Form({ form, setForm }) {
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <Input label="Descripción *" value={form.descripcion||''} onChange={e => set('descripcion',e.target.value)} />
      <Input label="Especialidad"  value={form.especialidad||''} onChange={e => set('especialidad',e.target.value)}
        placeholder="Ej: Tecnología, Finanzas, Marketing..." />
    </>
  )
}

export function GestionUnidades() {
  const { user } = useAuth()
  const cid  = user?.compania
  const fetch = useFetch(() => empresaService.vUnidades(cid), [cid])
  return (
    <CrudPage
      title="Unidades Organizacionales"
      subtitle="Áreas o departamentos de la compañía"
      columns={COLS}
      fetchData={fetch}
      defaultForm={{ descripcion:'', especialidad:'', usuario_creacion: user?.id||1 }}
      searchFields={['descripcion','especialidad']}
      FormContent={Form}
      onSave={async (data, id) => id
        ? await empresaService.updateUnidad(cid, id, data)
        : await empresaService.createUnidad(cid, data)
      }
      onDelete={async row => await empresaService.deleteUnidad(cid, row.id)}
    />
  )
}
export default GestionUnidades

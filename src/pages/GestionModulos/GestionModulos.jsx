// src/pages/GestionModulos/GestionModulos.jsx
import { useFetch } from '../../hooks/useFetch'
import { accesoService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Select, Badge } from '../../components/ui'

const COLS = [
  { key: 'id',              label: 'ID',      width: 60 },
  { key: 'nombre_aplicacion',label: 'Ruta / App' },
  { key: 'descripcion',     label: 'Descripción' },
  { key: 'modulo_padre_nombre', label: 'Padre',    width: 140 },
  { key: 'orden',           label: 'Orden',   width: 70 },
  { key: 'ind_visible', label: 'Visible', width: 80,
    render: v => <Badge variant={v?'success':'danger'}>{v?'Sí':'No'}</Badge> },
]

const DEFAULT = {
  descripcion:'', nombre_aplicacion:'', comentario:'',
  modulo_padre: null, ind_visible:true, orden:0, icono:'', usuario_creacion:1,
}

function Form({ form, setForm }) {
  const modulos = useFetch(() => accesoService.getModulos())
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <Input label="Nombre / Descripción *" value={form.descripcion||''} onChange={e => set('descripcion', e.target.value)} />
      <Input label="Ruta de la aplicación *" value={form.nombre_aplicacion||''} onChange={e => set('nombre_aplicacion', e.target.value)} placeholder="/gestion-usuarios" />
      <Select label="Módulo padre (opcional)" value={form.modulo_padre||''} onChange={e => set('modulo_padre', e.target.value || null)}>
        <option value="">Ninguno (raíz)</option>
        {modulos.data?.map(m => <option key={m.id} value={m.id}>{m.descripcion}</option>)}
      </Select>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Ícono (emoji/clase)"  value={form.icono||''} onChange={e => set('icono', e.target.value)} placeholder="🏠" />
        <Input label="Orden"  type="number" value={form.orden||0}  onChange={e => set('orden', +e.target.value)} />
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.88rem', fontWeight:500 }}>
        <input type="checkbox" checked={!!form.ind_visible} onChange={e => set('ind_visible', e.target.checked)} />
        Visible en menú
      </label>
    </>
  )
}

export function GestionModulos() {
  const fetch = useFetch(() => accesoService.vModulos())
  return (
    <CrudPage
      title="Módulos"
      subtitle="Árbol de módulos y permisos del sistema"
      columns={COLS}
      fetchData={fetch}
      defaultForm={DEFAULT}
      searchFields={['descripcion','nombre_aplicacion']}
      FormContent={Form}
      onSave={async (data, id) => id
        ? await accesoService.updateModulo(id, data)
        : await accesoService.createModulo(data)
      }
      onDelete={async row => await accesoService.deleteModulo(row.id)}
    />
  )
}
export default GestionModulos

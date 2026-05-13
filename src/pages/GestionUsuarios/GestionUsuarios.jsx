// src/pages/GestionUsuarios/GestionUsuarios.jsx
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { accesoService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Select, Badge } from '../../components/ui'
import styles from './GestionUsuarios.module.css'

const COLS = [
  { key: 'id_interno',              label: 'ID Int.',      width: 70 },
  { key: 'analista_nombre_completo',label: 'Analista' },
  { key: 'login',                   label: 'Login',        width: 130 },
  { key: 'email',                   label: 'Email' },
  { key: 'rol_descripcion',         label: 'Rol' },
  { key: 'ind_super_usuario', label: 'Super',  width: 70,
    render: v => <Badge variant={v ? 'warning':'primary'}>{v?'Sí':'No'}</Badge> },
  { key: 'ind_activo',       label: 'Activo', width: 70,
    render: v => <Badge variant={v ? 'success':'danger'}>{v?'Sí':'No'}</Badge> },
  { key: 'ind_bloqueo',      label: 'Bloq.',  width: 70,
    render: v => <Badge variant={v ? 'danger':'success'}>{v?'Sí':'No'}</Badge> },
]

function Form({ form, setForm, errors }) {
  const { user } = useAuth()
  const cid = user?.compania
  const roles    = useFetch(() => accesoService.getRoles())
  const analistas = useFetch(() => accesoService.getAnalistas(cid), [cid])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Login *" value={form.login||''} onChange={e => set('login', e.target.value)} error={errors.login} />
        <Input label="Email *" type="email" value={form.email||''} onChange={e => set('email', e.target.value)} error={errors.email} />
      </div>
      {!form.id && (
        <Input label="Contraseña *" type="password" value={form.pwd||''} onChange={e => set('pwd', e.target.value)} error={errors.pwd}
          placeholder="Mínimo 8 caracteres" />
      )}
      <Select label="Rol *" value={form.rol||''} onChange={e => set('rol', e.target.value)} error={errors.rol}>
        <option value="">Seleccionar rol...</option>
        {roles.data?.map(r => <option key={r.id} value={r.id}>{r.descripcion}</option>)}
      </Select>
      <Select label="Analista asociado" value={form.analista||''} onChange={e => set('analista', e.target.value || null)}>
        <option value="">Sin analista</option>
        {analistas.data?.map(a => (
          <option key={a.id} value={a.id}>
            {a.primer_nombre} {a.primer_apellido}
          </option>
        ))}
      </Select>
      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        {[['ind_super_usuario','Super Usuario'],['ind_activo','Activo'],['ind_bloqueo','Bloqueado']].map(([k,l]) => (
          <label key={k} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.88rem', fontWeight:500 }}>
            <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} />
            {l}
          </label>
        ))}
      </div>
    </>
  )
}

export default function GestionUsuarios() {
  const { user } = useAuth()
  const cid   = user?.compania
  const fetch = useFetch(() => accesoService.vUsuarios(cid), [cid])

  const DEFAULT = { login:'', email:'', pwd:'', rol:'', analista:null,
    ind_super_usuario:false, ind_activo:true, ind_bloqueo:false, usuario_creacion: user?.id || 1 }

  const hashPwd = async raw => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
  }

  return (
    <CrudPage
      title="Usuarios"
      subtitle="Gestión de accesos al sistema"
      columns={COLS}
      fetchData={fetch}
      defaultForm={DEFAULT}
      searchFields={['login','email','rol_descripcion','analista_nombre_completo']}
      FormContent={Form}
      onSave={async (data, id) => {
        const payload = { ...data }
        if (payload.pwd) payload.pwd = await hashPwd(payload.pwd)
        if (!id) {
          const all = await accesoService.getUsuarios(cid)
          payload.id_interno = (all.data.length || 0) + 1
        }
        return id
          ? await accesoService.updateUsuario(cid, id, payload)
          : await accesoService.createUsuario(cid, payload)
      }}
      onDelete={async row => await accesoService.deleteUsuario(cid, row.id)}
    />
  )
}

// src/pages/GestionUsuarios/GestionUsuarios.jsx
// Login automático + pwd automática + correo + datos completos en edición
import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { accesoService, candidatosService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Select, Badge, Alert } from '../../components/ui'

const COLS = [
  { key: 'id_interno', label: 'ID', width: 60 },
  { key: 'analista_nombre_completo', label: 'Analista' },
  { key: 'login', label: 'Login', width: 130 },
  { key: 'email', label: 'Email' },
  { key: 'rol_descripcion', label: 'Rol' },
  {
    key: 'ind_super_usuario', label: 'Super', width: 70,
    render: v => <Badge variant={v ? 'warning' : 'primary'}>{v ? 'Sí' : 'No'}</Badge>
  },
  {
    key: 'ind_activo', label: 'Activo', width: 70,
    render: v => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Sí' : 'No'}</Badge>
  },
  {
    key: 'ind_bloqueo', label: 'Bloq.', width: 70,
    render: v => <Badge variant={v ? 'danger' : 'success'}>{v ? 'Sí' : 'No'}</Badge>
  },
]

function Form({ form, setForm, errors, isEdit }) {
  const { user } = useAuth()
  const cid = user?.compania
  const roles = useFetch(() => accesoService.getRoles())
  const analistas = useFetch(() => accesoService.getAnalistas(cid), [cid])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  console.log(form)

  return (
    <>
      {/* Analista — determina nombre/email al crear */}
      <Select
        label="Analista asociado"
        value={String(form.analista_id ?? form.analista ?? '')}
        onChange={e => {
          const analistaId = e.target.value
            ? Number(e.target.value)
            : null

          setForm(f => ({
            ...f,
            analista: analistaId,
            analista_id: analistaId,
          }))

          // Auto-completar email desde el analista seleccionado
          if (analistaId && !form.email) {
            // lógica futura
          }
        }}
      >
        <option value="">Sin analista</option>

        {analistas.data?.map(a => (
          <option key={a.id} value={String(a.id)}>
            {a.primer_nombre} {a.primer_apellido}
          </option>
        ))}
      </Select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Login — auto-generado, editable */}
        <Input
          label={`Login ${isEdit ? '' : '(auto-generado si vacío)'}`}
          value={form.login || ''}
          onChange={e => set('login', e.target.value)}
          error={errors.login}
          placeholder={isEdit ? '' : 'Se generará automáticamente'}
        />
        <Input
          label="Email *"
          type="email"
          value={form.email || ''}
          onChange={e => set('email', e.target.value)}
          error={errors.email}
        />
      </div>

      {/* Contraseña solo en creación; en edición es opcional */}
      <Input
        label={isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña (auto-generada si vacío)'}
        type="password"
        value={form.pwd || ''}
        onChange={e => set('pwd', e.target.value)}
        error={errors.pwd}
        placeholder={isEdit ? '••••••••' : 'Se generará automáticamente'}
      />

      <Select
        label="Rol *"
        value={String(form.rol_id ?? form.rol ?? '')}
        onChange={e => setForm(f => ({
          ...f,
          rol: e.target.value ? Number(e.target.value) : '',
          rol_id: e.target.value ? Number(e.target.value) : ''
        }))}
        error={errors.rol}
      >
        <option value="">Seleccionar rol...</option>

        {roles.data?.map(r => (
          <option key={r.id} value={String(r.id)}>
            {r.descripcion}
          </option>
        ))}
      </Select>

      {/* Checkboxes — siempre reflejan el valor del form (funciona en edición) */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 4 }}>
        {[
          ['ind_super_usuario', 'Super Usuario'],
          ['ind_activo', 'Activo'],
          ['ind_bloqueo', 'Bloqueado'],
        ].map(([k, l]) => (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.88rem', fontWeight: 500, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!form[k]}
              onChange={e => set(k, e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            {l}
          </label>
        ))}
      </div>
    </>
  )
}

export default function GestionUsuarios() {
  const { user } = useAuth()
  const cid = user?.compania
  const fetch = useFetch(() => accesoService.vUsuarios(cid), [cid])
  const [notif, setNotif] = useState(null)  // {type, text}

  const DEFAULT = {
    login: '', email: '', pwd: '',
    rol: '', analista: null,
    ind_super_usuario: false, ind_activo: true, ind_bloqueo: false,
    usuario_creacion: user?.id || 1,
  }

  return (
    <>
      {notif && (
        <Alert
          type={notif.type === 'ok' ? 'success' : 'info'}
          onClose={() => setNotif(null)}
          style={{ marginBottom: 12 }}
        >
          {notif.text}
        </Alert>
      )}

      <CrudPage
        title="Usuarios"
        subtitle="El login y contraseña se generan automáticamente si se dejan vacíos. Se enviará un correo al email registrado."
        columns={COLS}
        fetchData={fetch}
        defaultForm={DEFAULT}
        searchFields={['login', 'email', 'rol_descripcion', 'analista_nombre_completo']}
        FormContent={({ form, setForm, errors }) => (
          <Form
            form={form}
            setForm={setForm}
            errors={errors}
            isEdit={!!form.id}
          />
        )}
        onSave={async (data, id) => {
          const payload = {
            ...data,

            rol: data.rol_id || data.rol,
            analista: data.analista_id || data.analista,

            compania: cid,
            usuario_modificacion: id ? user?.id : undefined,
            usuario_creacion: user?.id || 1,
          }

          delete payload.rol_id
          delete payload.analista_id

          if (id) {
            // PUT — pwd vacío → el serializer no la sobreescribe
            const res = await accesoService.updateUsuario(cid, id, payload)
            return res
          } else {
            // POST — login y pwd pueden estar vacíos → el backend los genera
            const res = await accesoService.createUsuario(cid, payload)
            const d = res.data
            if (d.correo_enviado) {
              setNotif({ type: 'ok', text: `✅ Usuario "${d.login_generado}" creado. Credenciales enviadas al correo ${data.email}.` })
            } else {
              setNotif({ type: 'info', text: `✅ Usuario "${d.login_generado || data.login}" creado. No se pudo enviar el correo.` })
            }
            setTimeout(() => setNotif(null), 6000)
            return res
          }
        }}
        onDelete={async row => await accesoService.deleteUsuario(cid, row.id)}
      />
    </>
  )
}

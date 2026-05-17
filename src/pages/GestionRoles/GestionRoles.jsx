// src/pages/GestionRoles/GestionRoles.jsx
import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { accesoService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Modal, Button, Badge, Spinner, Alert } from '../../components/ui'

const COLS = [
  { key: 'id',          label: 'ID',    width: 60 },
  { key: 'descripcion', label: 'Rol' },
  { key: 'comentario',  label: 'Descripción' },
  { key: 'total_usuarios', label: 'Usuarios', width: 90,
    render: v => <Badge variant={v > 0 ? 'success' : 'primary'}>{v}</Badge> },
]

function Form({ form, setForm }) {
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <Input label="Nombre del Rol *"  value={form.descripcion||''} onChange={e => set('descripcion',e.target.value)} />
      <div>
        <label style={{ fontSize:'.82rem', fontWeight:600, display:'block', marginBottom:6 }}>Descripción</label>
        <textarea value={form.comentario||''} onChange={e => set('comentario',e.target.value)}
          style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid var(--border)',
            fontFamily:'var(--font)', fontSize:'.9rem', minHeight:70, resize:'vertical', outline:'none' }}
          placeholder="Descripción del rol y sus permisos..." />
      </div>
    </>
  )
}

// Modal para ver/gestionar módulos del rol
function ModalModulosRol({ open, onClose, rolId, rolNombre }) {
  const modulos    = useFetch(() => accesoService.getModulos(), [])
  const asignados  = useFetch(() => accesoService.getRolModulos(rolId), [rolId])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const asignadosIds = new Set(asignados.data?.map(rm => rm.modulo) || [])

  const toggle = async (moduloId) => {
    setLoading(true); setMsg(null)
    try {
      if (asignadosIds.has(moduloId)) {
        const rel = asignados.data.find(rm => rm.modulo === moduloId)
        await accesoService.desasignarModulo(rolId, rel.id)
      } else {
        await accesoService.asignarModulo(rolId, { modulo: moduloId, usuario_creacion: 1 })
      }
      asignados.reload()
      setMsg({ type:'ok', text: 'Permiso actualizado.' })
      setTimeout(() => setMsg(null), 2000)
    } catch { setMsg({ type:'error', text: 'Error al actualizar.' }) }
    finally { setLoading(false) }
  }

  const visibles = modulos.data?.filter(m => m.ind_visible) || []

  return (
    <Modal open={open} onClose={onClose} title={`🧩 Módulos — Rol: ${rolNombre}`} size="md">
      {msg && <Alert type={msg.type==='ok'?'success':'error'} style={{marginBottom:12}}>{msg.text}</Alert>}
      {modulos.loading || asignados.loading ? <Spinner size="sm" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {visibles.map(m => (
            <div key={m.id} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 14px', background:asignadosIds.has(m.id)?'var(--primary-bg)':'var(--bg)',
              borderRadius:8, border:`1.5px solid ${asignadosIds.has(m.id)?'var(--primary-border)':'var(--border)'}`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span>{m.icono || '🔹'}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:'.88rem' }}>{m.descripcion}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{m.nombre_aplicacion}</div>
                </div>
              </div>
              <button onClick={() => toggle(m.id)} disabled={loading}
                style={{ padding:'6px 14px', borderRadius:99, border:'none', cursor:'pointer',
                  fontFamily:'var(--font)', fontSize:'.8rem', fontWeight:700,
                  background: asignadosIds.has(m.id) ? 'var(--danger-bg)' : 'var(--primary)',
                  color: asignadosIds.has(m.id) ? 'var(--danger)' : '#fff', transition:'all .2s',
                }}>
                {asignadosIds.has(m.id) ? 'Quitar' : 'Asignar'}
              </button>
            </div>
          ))}
          {!visibles.length && <p style={{color:'var(--text-muted)',fontSize:'.85rem'}}>No hay módulos visibles.</p>}
        </div>
      )}
    </Modal>
  )
}

export default function GestionRoles() {
  const fetch = useFetch(() => accesoService.vRoles())
  const [modulosModal, setModulosModal] = useState(null)

  const extraActions = row => (
    <Button size="sm" variant="secondary" icon="🧩"
      onClick={() => setModulosModal({ id: row.id, nombre: row.descripcion })}>
      Módulos
    </Button>
  )

  return (
    <>
      <CrudPage
        title="Roles"
        subtitle="Perfiles de acceso del sistema"
        columns={COLS}
        fetchData={fetch}
        defaultForm={{ descripcion:'', comentario:'', usuario_creacion:1 }}
        searchFields={['descripcion','comentario']}
        FormContent={Form}
        extraActions={extraActions}
        onSave={async (data, id) => id
          ? await accesoService.updateRol(id, data)
          : await accesoService.createRol(data)
        }
        onDelete={async row => await accesoService.deleteRol(row.id)}
      />
      {modulosModal && (
        <ModalModulosRol
          open={!!modulosModal} onClose={() => setModulosModal(null)}
          rolId={modulosModal.id} rolNombre={modulosModal.nombre}
        />
      )}
    </>
  )
}

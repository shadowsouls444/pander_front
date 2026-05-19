// src/pages/GestionCandidatos/GestionCandidatos.jsx
import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { candidatosService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Select, Modal, Button, Alert, Spinner } from '../../components/ui'

const COLS = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'nombre_completo', label: 'Nombre Completo' },
  { key: 'tipo_documento_descripcion', label: 'Tipo Doc.', width: 90 },
  { key: 'numero_documento', label: 'Documento', width: 120 },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono', width: 120 },
]

function Form({ form, setForm }) {
  const tipos = useFetch(() => candidatosService.getTiposDocumento())
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Primer Nombre *" value={form.primer_nombre || ''} onChange={e => set('primer_nombre', e.target.value)} />
        <Input label="Segundo Nombre" value={form.segundo_nombre || ''} onChange={e => set('segundo_nombre', e.target.value)} />
        <Input label="Primer Apellido *" value={form.primer_apellido || ''} onChange={e => set('primer_apellido', e.target.value)} />
        <Input label="Segundo Apellido" value={form.segundo_apellido || ''} onChange={e => set('segundo_apellido', e.target.value)} />
      </div>
      <Select
        label="Tipo Documento"
        value={String(form.tipo_documento_id ?? form.tipo_documento ?? '')}
        onChange={e => setForm(f => ({
          ...f,
          tipo_documento: e.target.value ? Number(e.target.value) : null,
          tipo_documento_id: e.target.value ? Number(e.target.value) : null,
        }))}
      >
        <option value="">Sin especificar</option>

        {tipos.data?.map(t => (
          <option key={t.id} value={String(t.id)}>
            {t.descripcion}
          </option>
        ))}
      </Select>
      <Input label="Número Documento" value={form.numero_documento || ''} onChange={e => set('numero_documento', e.target.value)} />
      <Input label="Email" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
      <Input label="Teléfono" value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} />
    </>
  )
}

// Componente de carga de CV
function ModalCV({ open, onClose, compania, candidatoId, candidatoNombre }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const anexos = useFetch(
    () => candidatosService.getAnexos(compania, candidatoId),
    [candidatoId]
  )

  const handleUpload = async () => {
    if (!file) { setMsg({ type: 'error', text: 'Selecciona un archivo.' }); return }
    setLoading(true); setMsg(null)
    const fd = new FormData()
    fd.append('archivo', file)
    try {
      await candidatosService.uploadAnexo(compania, candidatoId, fd)
      setMsg({ type: 'ok', text: 'Archivo subido correctamente.' })
      setFile(null)
      anexos.reload()
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.error || 'Error al subir el archivo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este anexo?')) return
    try {
      await candidatosService.deleteAnexo(compania, candidatoId, id)
      anexos.reload()
    } catch { alert('Error al eliminar.') }
  }

  return (
    <Modal open={open} onClose={onClose} title={`📎 Documentos — ${candidatoNombre}`} size="md">
      {msg && <Alert type={msg.type === 'ok' ? 'success' : 'error'} onClose={() => setMsg(null)} style={{ marginBottom: 12 }}>{msg.text}</Alert>}

      {/* Subir nuevo */}
      <div style={{
        background: 'var(--bg)', border: '2px dashed var(--border)', borderRadius: 12,
        padding: 20, textAlign: 'center', marginBottom: 20
      }}>
        <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Sube el CV del candidato (PDF, DOCX, DOC)
        </p>
        <input
          type="file" accept=".pdf,.docx,.doc"
          style={{ display: 'none' }} id="cv-input"
          onChange={e => setFile(e.target.files[0])}
        />
        <label htmlFor="cv-input" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--primary-bg)', color: 'var(--primary)', border: '1.5px solid var(--primary-border)',
          borderRadius: 99, cursor: 'pointer', fontWeight: 600, fontSize: '.88rem',
        }}>
          📁 {file ? file.name : 'Seleccionar archivo'}
        </label>
        {file && (
          <div style={{ marginTop: 12 }}>
            <Button onClick={handleUpload} loading={loading} icon="⬆️">Subir archivo</Button>
          </div>
        )}
      </div>

      {/* Lista de anexos */}
      <h4 style={{ fontSize: '.9rem', marginBottom: 10 }}>Documentos subidos</h4>
      {anexos.loading ? <Spinner size="sm" /> :
        !anexos.data?.length ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Sin documentos aún.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {anexos.data.map(anx => (
              <div key={anx.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>📄 {anx.nombre_archivo}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                    {anx.tipo_archivo} · {anx.tamanio_bytes ? `${Math.round(anx.tamanio_bytes / 1024)} KB` : '?'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={`http://localhost:8000/media/${anx.ruta_almacenamiento}`}
                    target="_blank" rel="noreferrer"
                    style={{
                      padding: '6px 12px', background: 'var(--info-bg)', color: 'var(--info)',
                      borderRadius: 8, fontSize: '.8rem', fontWeight: 600, textDecoration: 'none'
                    }}
                  >Ver</a>
                  <button onClick={() => handleDelete(anx.id)}
                    style={{
                      padding: '6px 12px', background: 'var(--danger-bg)', color: 'var(--danger)',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '.8rem', fontWeight: 600
                    }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </Modal>
  )
}

export default function GestionCandidatos() {
  const { user } = useAuth()
  const cid = user?.compania
  const fetch = useFetch(() => candidatosService.vCandidatos(cid), [cid])
  const [cvModal, setCvModal] = useState(null) // {id, nombre}

  const DEFAULT = {
    primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
    tipo_documento: null, numero_documento: '', email: '', telefono: '',
  }

  const extraActions = row => (
    <Button size="sm" variant="secondary" icon="📎"
      onClick={() => setCvModal({ id: row.id, nombre: row.nombre_completo || `#${row.id}` })}>
      CV
    </Button>
  )

  return (
    <>
      <CrudPage
        title="Candidatos"
        subtitle="Base de datos de candidatos"
        columns={COLS}
        fetchData={fetch}
        defaultForm={DEFAULT}
        searchFields={['nombre_completo', 'numero_documento', 'email']}
        FormContent={Form}
        extraActions={extraActions}
        onSave={async (data, id) => {
          if (id) {
            await candidatosService.updateDatos(cid, id, { ...data, compania: cid, candidato: id })
          } else {
            const all = await candidatosService.getCandidatos(cid)
            const id_int = (all.data.length || 0) + 1
            const cand = await candidatosService.createCandidato(cid, {
              id_interno: id_int, usuario_creacion: user?.id,
            })
            await candidatosService.createDatos(cid, cand.data.id, {
              ...data, compania: cid, candidato: cand.data.id,
              usuario_creacion: user?.id,
            })
          }
        }}
        onDelete={async row => await candidatosService.deleteCandidato(cid, row.id)}
      />

      {cvModal && (
        <ModalCV
          open={!!cvModal} onClose={() => setCvModal(null)}
          compania={cid} candidatoId={cvModal.id} candidatoNombre={cvModal.nombre}
        />
      )}
    </>
  )
}

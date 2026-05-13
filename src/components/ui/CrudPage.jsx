// src/components/ui/CrudPage.jsx
// ══════════════════════════════════════════════
// Componente CRUD reutilizable para todas las páginas.
// Gestiona: carga, búsqueda, modal crear/editar, confirm delete.
// ══════════════════════════════════════════════
import { useState, useMemo } from 'react'
import { PageHeader, SearchBar, Button, Table, Modal, ConfirmDialog, Alert, Spinner } from './index'

export default function CrudPage({
  title,
  subtitle,
  columns,
  fetchData,       // { data, loading, error, reload }
  onSave,          // async (data, editId) => void
  onDelete,        // async (row) => void
  FormContent,     // ({ form, setForm, errors }) => JSX
  defaultForm,     // objeto vacío inicial del formulario
  searchFields,    // ['campo1','campo2'] para filtrar
  rowKey = 'id',
  extraActions,    // (row) => JSX adicional en cada fila
}) {
  const [search, setSearch]   = useState('')
  const [modalOpen, setModal] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm]       = useState(defaultForm)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [delRow, setDelRow]   = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveOk, setSaveOk]   = useState(null)

  // ── Filtro de búsqueda ──────────────────────
  const filtered = useMemo(() => {
    if (!fetchData.data) return []
    if (!search.trim()) return fetchData.data
    const q = search.toLowerCase()
    return fetchData.data.filter(row =>
      searchFields.some(f => String(row[f] ?? '').toLowerCase().includes(q))
    )
  }, [fetchData.data, search, searchFields])

  // ── Abrir modal crear ───────────────────────
  const openCreate = () => {
    setEditRow(null)
    setForm(defaultForm)
    setErrors({})
    setSaveError(null)
    setModal(true)
  }

  // ── Abrir modal editar ──────────────────────
  const openEdit = row => {
    setEditRow(row)
    setForm({ ...defaultForm, ...row })
    setErrors({})
    setSaveError(null)
    setModal(true)
  }

  const closeModal = () => { if (!saving) setModal(false) }

  // ── Guardar ─────────────────────────────────
  const handleSave = async () => {
    setSaveError(null)
    setSaving(true)
    try {
      await onSave(form, editRow ? editRow[rowKey] : null)
      setModal(false)
      setSaveOk(editRow ? 'Registro actualizado.' : 'Registro creado.')
      fetchData.reload()
      setTimeout(() => setSaveOk(null), 3000)
    } catch (e) {
      const errData = e?.response?.data
      if (errData && typeof errData === 'object' && !errData.detail) {
        setErrors(errData)
        setSaveError('Revisa los campos marcados.')
      } else {
        setSaveError(errData?.detail || e.message || 'Error al guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(delRow)
      setDelRow(null)
      setSaveOk('Registro eliminado.')
      fetchData.reload()
      setTimeout(() => setSaveOk(null), 3000)
    } catch (e) {
      setSaveError(e?.response?.data?.detail || e.message || 'Error al eliminar.')
      setDelRow(null)
    } finally {
      setDeleting(false)
    }
  }

  // ── Columna de acciones ─────────────────────
  const actions = row => (
    <>
      {extraActions?.(row)}
      <Button size="sm" variant="secondary" onClick={() => openEdit(row)} icon="✏️">Editar</Button>
      <Button size="sm" variant="danger"    onClick={() => setDelRow(row)} icon="🗑️">Eliminar</Button>
    </>
  )

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button onClick={openCreate} icon="➕">Nuevo</Button>
        }
      />

      {saveOk   && <Alert type="success" onClose={() => setSaveOk(null)}>{saveOk}</Alert>}
      {saveError && !modalOpen && <Alert type="error" onClose={() => setSaveError(null)}>{saveError}</Alert>}
      {fetchData.error && <Alert type="error">{fetchData.error}</Alert>}

      <div style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder={`Buscar en ${title.toLowerCase()}...`} />
      </div>

      {fetchData.loading ? (
        <Spinner label="Cargando datos..." />
      ) : (
        <Table
          columns={columns}
          data={filtered}
          rowKey={rowKey}
          actions={actions}
          empty={`No hay ${title.toLowerCase()} registrados.`}
        />
      )}

      {/* Modal crear/editar */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editRow ? `Editar ${title}` : `Nuevo ${title}`}
        size="md"
      >
        {saveError && <Alert type="error" style={{ marginBottom: 16 }}>{saveError}</Alert>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormContent form={form} setForm={setForm} errors={errors} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <Button variant="ghost" onClick={closeModal} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} icon="💾">
            {editRow ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Modal>

      {/* Confirm eliminar */}
      <ConfirmDialog
        open={!!delRow}
        onClose={() => setDelRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}

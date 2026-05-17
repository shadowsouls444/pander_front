// src/components/ui/CrudPage.jsx  — v6
// FIX #4: openEdit hace conversión de tipos para que <select> pre-llene correctamente.
//         El value de un <select> es siempre string; los FK del backend vienen como int.
//         Se convierten todos los valores a string para que el select encuentre la opción.
import { useState, useMemo } from 'react'
import { PageHeader, SearchBar, Button, Table, Modal, ConfirmDialog, Alert, Spinner } from './index'

/**
 * Normaliza un valor de fila para que sea compatible con el value de un <select>.
 * Los FK de Django se devuelven como int; el value del <option> se define como string.
 * Esta función convierte a string los campos que parecen ser FK o booleanos.
 */
function normalizarParaForm(defaultForm, row) {
  const merged = { ...defaultForm, ...row }
  // Convertir campos numéricos a string para que <select value={...}> funcione
  // (solo los que existen en defaultForm y son números/booleanos del row)
  Object.keys(merged).forEach(k => {
    const val = merged[k]
    // Si el default es string vacío y el valor es número, convertir a string
    if (defaultForm[k] === '' && typeof val === 'number') {
      merged[k] = String(val)
    }
    // Si el default es null/string y el valor es número (FK), convertir a string
    if ((defaultForm[k] === null || defaultForm[k] === '') && typeof val === 'number') {
      merged[k] = String(val)
    }
    // Booleanos: dejar como booleanos (para checkboxes)
    // undefined → usar el default
    if (val === undefined || val === null) {
      merged[k] = defaultForm[k]
    }
  })
  return merged
}

export default function CrudPage({
  title,
  subtitle,
  columns,
  fetchData,
  onSave,
  onDelete,
  FormContent,
  defaultForm,
  searchFields,
  rowKey = 'id',
  extraActions,
}) {
  const [search, setSearch]     = useState('')
  const [modalOpen, setModal]   = useState(false)
  const [editRow, setEditRow]   = useState(null)
  const [form, setForm]         = useState(defaultForm)
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)
  const [delRow, setDelRow]     = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveOk, setSaveOk]     = useState(null)

  const filtered = useMemo(() => {
    if (!fetchData.data) return []
    if (!search.trim()) return fetchData.data
    const q = search.toLowerCase()
    return fetchData.data.filter(row =>
      searchFields.some(f => String(row[f] ?? '').toLowerCase().includes(q))
    )
  }, [fetchData.data, search, searchFields])

  const openCreate = () => {
    setEditRow(null)
    setForm(defaultForm)
    setErrors({})
    setSaveError(null)
    setModal(true)
  }

  const openEdit = row => {
    setEditRow(row)
    // FIX #4: normalizar tipos para que selects/checkboxes pre-llenen
    setForm(normalizarParaForm(defaultForm, row))
    setErrors({})
    setSaveError(null)
    setModal(true)
  }

  const closeModal = () => { if (!saving) setModal(false) }

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
    } finally { setSaving(false) }
  }

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
    } finally { setDeleting(false) }
  }

  const actions = row => (
    <>
      {extraActions?.(row)}
      <Button size="sm" variant="secondary" onClick={() => openEdit(row)} icon="✏️">Editar</Button>
      <Button size="sm" variant="danger"    onClick={() => setDelRow(row)} icon="🗑️">Eliminar</Button>
    </>
  )

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}
        action={<Button onClick={openCreate} icon="➕">Nuevo</Button>} />

      {saveOk    && <Alert type="success" onClose={() => setSaveOk(null)}>{saveOk}</Alert>}
      {saveError && !modalOpen &&
        <Alert type="error" onClose={() => setSaveError(null)}>{saveError}</Alert>}
      {fetchData.error && <Alert type="error">{fetchData.error}</Alert>}

      <div style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch}
          placeholder={`Buscar en ${title.toLowerCase()}...`} />
      </div>

      {fetchData.loading ? (
        <Spinner label="Cargando datos..." />
      ) : (
        <Table columns={columns} data={filtered} rowKey={rowKey} actions={actions}
          empty={`No hay ${title.toLowerCase()} registrados.`} />
      )}

      <Modal open={modalOpen} onClose={closeModal}
        title={editRow ? `Editar ${title}` : `Nuevo ${title}`} size="md">
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

      <ConfirmDialog open={!!delRow} onClose={() => setDelRow(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Confirmar eliminación"
        message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer." />
    </div>
  )
}

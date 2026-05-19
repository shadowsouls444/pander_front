// src/components/ui/CrudPage.jsx
// ────────────────────────────────────────────────────────────
// FIX GLOBAL DE SELECTS EN EDICIÓN:
// El DOM de <select> compara su `value` con el `value` de cada <option>
// como STRINGS. Los FK del backend llegan como int.
// Si el form guarda int y el option tiene value={int}, React los convierte
// a string al renderizar y la comparación falla silenciosamente cuando
// el form usa `value={form.campo}` sin conversión explícita.
//
// Solución en openEdit(): aplicar toStringIds() que convierte todos los
// valores numéricos a string. Los Forms pueden hacer Number() en onChange
// para enviar el tipo correcto al backend.
// ────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react'
import {
  PageHeader, SearchBar, Button, Table,
  Modal, ConfirmDialog, Alert, Spinner,
} from './index'

/**
 * Convierte a string todos los valores del form que sean numéricos,
 * excepto los que en defaultForm son number (campos de cantidad/dinero).
 * Así, los <select value={...}> encuentran su <option> correctamente.
 *
 * Regla:
 *   - Si defaultForm[k] === '' (string vacío) y row[k] es número → String
 *   - Si defaultForm[k] === null y row[k] es número → String
 *     (FK nullable: el select necesita string para comparar)
 *   - Si defaultForm[k] es number (0, null con context numérico) → mantener
 *   - Booleanos siempre como boolean
 *   - null/undefined → usar valor de defaultForm
 */
function prepararFormParaEdicion(defaultForm, row) {
  const resultado = {}

  for (const key of Object.keys(defaultForm)) {
    const defVal = defaultForm[key]
    const rowVal = row[key]

    // Valor del row indefinido o null → usar default
    if (rowVal === undefined || rowVal === null) {
      resultado[key] = defVal
      continue
    }

    // Booleano siempre como boolean
    if (typeof rowVal === 'boolean') {
      resultado[key] = rowVal
      continue
    }

    // FK: defaultForm tiene '' (string) pero row devuelve int
    // → convertir a string para que <select value="3"> encuentre <option value="3">
    if (typeof rowVal === 'number' && typeof defVal === 'string') {
      resultado[key] = String(rowVal)
      continue
    }

    // FK nullable: defaultForm tiene null y row devuelve int
    if (typeof rowVal === 'number' && defVal === null) {
      resultado[key] = String(rowVal)
      continue
    }

    // Resto de casos: usar el valor del row tal cual
    resultado[key] = rowVal
  }

  // Incluir campos del row que no estén en defaultForm (ej: id, id_interno)
  for (const key of Object.keys(row)) {
    if (!(key in resultado)) {
      resultado[key] = row[key]
    }
  }

  return resultado
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
  const [search,    setSearch]    = useState('')
  const [modalOpen, setModal]     = useState(false)
  const [editRow,   setEditRow]   = useState(null)
  const [form,      setForm]      = useState(defaultForm)
  const [errors,    setErrors]    = useState({})
  const [saving,    setSaving]    = useState(false)
  const [delRow,    setDelRow]    = useState(null)
  const [deleting,  setDeleting]  = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveOk,    setSaveOk]    = useState(null)

  // ── Búsqueda ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!fetchData.data) return []
    if (!search.trim())  return fetchData.data
    const q = search.toLowerCase()
    return fetchData.data.filter(row =>
      searchFields.some(f => String(row[f] ?? '').toLowerCase().includes(q))
    )
  }, [fetchData.data, search, searchFields])

  // ── Abrir modal CREAR ──────────────────────────────────────
  const openCreate = () => {
    setEditRow(null)
    setForm(defaultForm)
    setErrors({})
    setSaveError(null)
    setModal(true)
  }

  // ── Abrir modal EDITAR ────────────────────────────────────
  const openEdit = row => {
    setEditRow(row)
    // FIX: convertir FK int→string para que los <select> pre-llenen
    setForm(prepararFormParaEdicion(defaultForm, row))
    setErrors({})
    setSaveError(null)
    setModal(true)
  }

  const closeModal = () => { if (!saving) setModal(false) }

  // ── Guardar ───────────────────────────────────────────────
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

  // ── Eliminar ──────────────────────────────────────────────
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

  // ── Acciones por fila ─────────────────────────────────────
  const actions = row => (
    <>
      {extraActions?.(row)}
      <Button size="sm" variant="secondary" onClick={() => openEdit(row)} icon="✏️">
        Editar
      </Button>
      <Button size="sm" variant="danger" onClick={() => setDelRow(row)} icon="🗑️">
        Eliminar
      </Button>
    </>
  )

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={<Button onClick={openCreate} icon="➕">Nuevo</Button>}
      />

      {saveOk    && <Alert type="success" onClose={() => setSaveOk(null)}>{saveOk}</Alert>}
      {saveError && !modalOpen &&
        <Alert type="error" onClose={() => setSaveError(null)}>{saveError}</Alert>}
      {fetchData.error && <Alert type="error">{fetchData.error}</Alert>}

      <div style={{ marginBottom: 16 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Buscar en ${title.toLowerCase()}...`}
        />
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

      {/* Modal crear / editar */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editRow ? `Editar ${title}` : `Nuevo ${title}`}
        size="md"
      >
        {saveError && (
          <Alert type="error" style={{ marginBottom: 16 }}>{saveError}</Alert>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormContent form={form} setForm={setForm} errors={errors} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <Button variant="ghost" onClick={closeModal} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} icon="💾">
            {editRow ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Modal>

      {/* Confirmar eliminar */}
      <ConfirmDialog
        open={!!delRow}
        onClose={() => setDelRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Confirmar eliminación"
        message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer."
      />
    </div>
  )
}

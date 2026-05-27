// src/pages/GestionCompania/GestionCompania.jsx
// Incluye ind_evaluacion_vacante, ind_activa, columna de modo en tabla
import { useFetch } from '../../hooks/useFetch'
import { useAuth }  from '../../context/AuthContext'
import { empresaService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Badge } from '../../components/ui'
import {
  MdBusiness, MdWork, MdToggleOn, MdToggleOff, MdInfo, MdWorkOutline, MdOutlineHomeWork
} from 'react-icons/md'

const COLS = [
  { key: 'id',                    label: 'ID',       width: 55 },
  { key: 'descripcion',           label: 'Nombre' },
  { key: 'nit',                   label: 'NIT',      width: 120 },
  { key: 'representante_legal',   label: 'Representante' },
  { key: 'telefono',              label: 'Teléfono', width: 120 },
  {
    key: 'ind_evaluacion_vacante',
    label: 'Modo Eval.',
    width: 120,
    render: v => (
      <Badge variant={v ? 'warning' : 'primary'} style={{ fontSize: '.73rem' }}>
        {v ? <><MdWorkOutline /> Por Vacante</> : <><MdOutlineHomeWork /> Estándar</>}
      </Badge>
    ),
  },
  {
    key: 'ind_activa',
    label: 'Estado',
    width: 90,
    render: v => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Activa' : 'Suspendida'}</Badge>,
  },
]

const DEFAULT = {
  descripcion:           '',
  nit:                   '',
  objeto_social:         '',
  representante_legal:   '',
  direccion:             '',
  telefono:              '',
  ind_activa:            true,
  ind_evaluacion_vacante: false,
  usuario_creacion:      1,
}

function Form({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input
          label="Nombre / Razón Social *"
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          error={errors.descripcion}
        />
        <Input
          label="NIT *"
          value={form.nit}
          onChange={e => set('nit', e.target.value)}
          error={errors.nit}
        />
        <Input
          label="Representante Legal"
          value={form.representante_legal || ''}
          onChange={e => set('representante_legal', e.target.value)}
        />
        <Input
          label="Teléfono"
          value={form.telefono || ''}
          onChange={e => set('telefono', e.target.value)}
        />
      </div>

      <Input
        label="Dirección"
        value={form.direccion || ''}
        onChange={e => set('direccion', e.target.value)}
      />

      <div>
        <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Objeto Social
        </label>
        <textarea
          value={form.objeto_social || ''}
          onChange={e => set('objeto_social', e.target.value)}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 8, resize: 'vertical',
            border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
            fontSize: '.88rem', minHeight: 56, outline: 'none',
          }}
          placeholder="Descripción de las actividades de la empresa..."
        />
      </div>

      {/* Indicadores */}
      <div style={{
        background: 'var(--primary-bg)', borderRadius: 10, padding: '14px 16px',
        border: '1px solid var(--primary-border)',
      }}>
        <div style={{
          fontSize: '.82rem', fontWeight: 700, color: 'var(--primary)',
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <MdInfo size={15}/> Configuración de la Compañía
        </div>

        {/* ind_activa */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          cursor: 'pointer', marginBottom: 12,
        }}>
          <input
            type="checkbox"
            checked={!!form.ind_activa}
            onChange={e => set('ind_activa', e.target.checked)}
            style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: '.88rem' }}>
              Compañía activa
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Si se desactiva, ningún usuario de esta compañía podrá ingresar a la plataforma.
            </div>
          </div>
        </label>

        {/* ind_evaluacion_vacante */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={!!form.ind_evaluacion_vacante}
            onChange={e => set('ind_evaluacion_vacante', e.target.checked)}
            style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: '.88rem' }}>
              Evaluación por vacante
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              <strong>Activo:</strong> cada vacante usa su evaluación específica
              (tabla <em>evaluacion_vacante</em>). Solo puede haber 1 activa por vacante.
              <br/>
              <strong>Inactivo:</strong> todas las postulaciones usan la evaluación estándar
              activa de la compañía (tabla <em>evaluacion</em>).
            </div>
          </div>
        </label>

        {/* Alerta de validación cruzada */}
        {form.ind_evaluacion_vacante && !form.ind_activa && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: '#fef9c3', border: '1px solid #fde68a',
            fontSize: '.78rem', color: '#92400e',
          }}>
            ⚠ Una compañía con evaluación por vacante que esté suspendida no podrá
            procesar postulaciones.
          </div>
        )}
      </div>
    </div>
  )
}

export default function GestionCompania() {
  const { user } = useAuth()
  const fetch = useFetch(() => empresaService.vCompanias())

  return (
    <CrudPage
      title="Compañías"
      subtitle="Gestión de empresas suscritas · Configuración de modo de evaluación"
      columns={COLS}
      fetchData={fetch}
      defaultForm={DEFAULT}
      searchFields={['descripcion', 'nit', 'representante_legal']}
      FormContent={Form}
      onSave={async (data, id) => {
        const payload = { ...data, usuario_modificacion: id ? user?.id : undefined }
        return id
          ? await empresaService.updateCompania(id, payload)
          : await empresaService.createCompania(payload)
      }}
      onDelete={async row => await empresaService.deleteCompania(row.id)}
    />
  )
}

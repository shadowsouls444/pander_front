// src/pages/ImportacionMasiva/ImportacionMasiva.jsx
// Importación masiva con:
//   - Descarga de plantilla Excel por entidad
//   - Drag & Drop o selección de archivo
//   - Validación previa (dry_run) con log visual
//   - Importación definitiva solo si no hay errores
//   - Log coloreado por fila (OK / ERROR)
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { PageHeader, Card, Alert, Spinner, Badge } from '../../components/ui'
import {
  MdUpload, MdDownload, MdCheckCircle, MdError, MdWarning,
  MdTableChart, MdBusiness, MdPerson, MdWork, MdGroups,
  MdAssignment, MdAccountTree, MdBadge, MdRefresh,
} from 'react-icons/md'

// ── Configuración de entidades ────────────────────────────────
const ENTIDADES = [
  {
    id:        'companias',
    label:     'Compañías',
    icon:      MdBusiness,
    ruta:      (cid) => '/api/importacion/companias/',
    sinComp:   true,   // no lleva /companias/:cid/ en la URL
    descripcion: 'Registra nuevas empresas suscritas a la plataforma.',
    campos:    ['descripcion *', 'nit *', 'objeto_social', 'representante_legal', 'direccion', 'telefono', 'ind_activa', 'ind_evaluacion_vacante'],
  },
  {
    id:        'analistas',
    label:     'Analistas',
    icon:      MdBadge,
    ruta:      (cid) => `/api/importacion/companias/${cid}/analistas/`,
    descripcion: 'Perfil personal de los operadores de RRHH.',
    campos:    ['primer_nombre *', 'primer_apellido *', 'segundo_nombre', 'segundo_apellido', 'tipo_documento', 'numero_documento', 'telefono', 'cargo'],
  },
  {
    id:        'usuarios',
    label:     'Usuarios',
    icon:      MdPerson,
    ruta:      (cid) => `/api/importacion/companias/${cid}/usuarios/`,
    descripcion: 'Usuarios del sistema. Login y contraseña se generan automáticamente y se envían al correo. Relacionar analista por tipo y número de identificación.',
    campos:    ['email *', 'rol *', 'tipo_documento_analista', 'numero_documento_analista', 'ind_super_usuario'],
  },
  {
    id:        'unidades',
    label:     'Unidades Org.',
    icon:      MdAccountTree,
    ruta:      (cid) => `/api/importacion/companias/${cid}/unidades/`,
    descripcion: 'Unidades organizacionales de la compañía.',
    campos:    ['descripcion *', 'especialidad'],
  },
  {
    id:        'vacantes',
    label:     'Vacantes',
    icon:      MdWork,
    ruta:      (cid) => `/api/importacion/companias/${cid}/vacantes/`,
    descripcion: 'Ofertas laborales. Relacionar unidad por nombre exacto (no por ID).',
    campos:    ['descripcion *', 'unidad *', 'estado *', 'tipo_contrato *', 'anio_experiencia', 'salario_minimo', 'salario_maximo', 'ind_activa', 'ind_publicada'],
  },
  {
    id:        'candidatos',
    label:     'Candidatos',
    icon:      MdGroups,
    ruta:      (cid) => `/api/importacion/companias/${cid}/candidatos/`,
    descripcion: 'Aspirantes a las vacantes.',
    campos:    ['primer_nombre *', 'primer_apellido *', 'segundo_nombre', 'segundo_apellido', 'tipo_documento', 'numero_documento', 'email', 'telefono'],
  },
  {
    id:        'postulaciones',
    label:     'Postulaciones',
    icon:      MdAssignment,
    ruta:      (cid) => `/api/importacion/companias/${cid}/postulaciones/`,
    descripcion: 'Vincula candidatos con vacantes. Relacionar vacante por nombre y candidato por tipo + número de documento. Se envía el enlace de evaluación automáticamente.',
    campos:    ['vacante *', 'tipo_documento_candidato *', 'numero_documento_candidato *', 'descripcion'],
  },
]

// ── Log visual por fila ───────────────────────────────────────
function LogFila({ item }) {
  const isOk = item.estado === "OK"
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '7px 10px', borderRadius: 6, marginBottom: 4,
      background: isOk ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}`,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        {isOk
          ? <MdCheckCircle size={15} color="#15803d"/>
          : <MdError size={15} color="#dc2626"/>}
      </span>
      <div style={{ fontSize: '.8rem' }}>
        <span style={{ fontWeight: 700, color: isOk ? '#15803d' : '#dc2626' }}>
          Fila {item.fila}:
        </span>{' '}
        <span style={{ color: '#374151' }}>{item.mensaje}</span>
      </div>
    </div>
  )
}

// ── DropZone ──────────────────────────────────────────────────
function DropZone({ onFile, archivo }) {
  const ref = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.match(/\.(xlsx|xls)$/i)) onFile(f)
    else alert("Solo se aceptan archivos Excel (.xlsx, .xls)")
  }, [onFile])

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 12, padding: '28px 20px', textAlign: 'center',
        cursor: 'pointer', transition: 'all .2s',
        background: dragging ? 'var(--primary-bg)' : 'var(--bg)',
      }}>
      <MdUpload size={36} color={dragging ? 'var(--primary)' : '#94a3b8'} style={{ marginBottom: 8 }}/>
      <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text-h)', marginBottom: 4 }}>
        {archivo ? archivo.name : 'Arrastra tu Excel aquí o haz clic para seleccionar'}
      </div>
      <div style={{ fontSize: '.77rem', color: 'var(--text-muted)' }}>
        {archivo
          ? `${(archivo.size / 1024).toFixed(1)} KB · Listo para validar`
          : 'Formatos aceptados: .xlsx · .xls'}
      </div>
      <input ref={ref} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])}/>
    </div>
  )
}

// ── Panel de columnas ─────────────────────────────────────────
function PanelColumnas({ entidad }) {
  return (
    <div style={{ background: 'var(--primary-bg)', borderRadius: 10,
      padding: '12px 16px', border: '1px solid var(--primary-border)' }}>
      <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
        <MdTableChart size={13} style={{ marginRight: 5 }}/>
        Columnas esperadas en el Excel
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entidad.campos.map(c => {
          const req = c.endsWith(' *')
          return (
            <span key={c} style={{
              padding: '3px 10px', borderRadius: 99, fontSize: '.75rem', fontWeight: 600,
              background: req ? 'var(--primary)' : 'var(--border)',
              color: req ? '#fff' : 'var(--text-muted)',
            }}>
              {c}
            </span>
          )
        })}
      </div>
      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
        * = campo obligatorio
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function ImportacionMasiva() {
  const { user } = useAuth()
  const cid      = user?.compania
  const uid      = user?.id

  const [entidadId, setEntidadId] = useState('companias')
  const [archivo,   setArchivo]   = useState(null)
  const [fase,      setFase]      = useState('idle')   // idle | validando | validado | importando | listo | error
  const [log,       setLog]       = useState([])
  const [resumen,   setResumen]   = useState(null)
  const [msgError,  setMsgError]  = useState(null)

  const entidad = ENTIDADES.find(e => e.id === entidadId)

  const resetear = () => {
    setArchivo(null); setFase('idle')
    setLog([]); setResumen(null); setMsgError(null)
  }

  const cambiarEntidad = (id) => { setEntidadId(id); resetear() }

  const descargarPlantilla = async () => {
    try {
      const res = await api.get(`/api/importacion/plantilla/${entidadId}/`,
        { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      Object.assign(document.createElement('a'),
        { href: url, download: `plantilla_${entidadId}.xlsx` }).click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error al descargar la plantilla.')
    }
  }

  const validar = async () => {
    if (!archivo) { alert('Selecciona un archivo primero.'); return }
    setFase('validando'); setMsgError(null); setLog([])
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('dry_run', 'true')
      fd.append('usuario_id', uid)
      const ruta = entidad.sinComp ? entidad.ruta() : entidad.ruta(cid)
      const res  = await api.post(ruta, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setLog(res.data.log || [])
      setResumen(res.data)
      setFase('validado')
    } catch (e) {
      const d = e?.response?.data
      setMsgError(d?.error || 'Error al validar el archivo.')
      setFase('error')
    }
  }

  const importar = async () => {
    if (!archivo) return
    setFase('importando'); setMsgError(null)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('dry_run', 'false')
      fd.append('usuario_id', uid)
      const ruta = entidad.sinComp ? entidad.ruta() : entidad.ruta(cid)
      const res  = await api.post(ruta, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setLog(res.data.log || [])
      setResumen(res.data)
      setFase('listo')
    } catch (e) {
      const d = e?.response?.data
      setMsgError(d?.error || 'Error durante la importación.')
      setLog(d?.log || [])
      setFase('error')
    }
  }

  const errores = log.filter(l => l.estado === 'ERROR')
  const oks     = log.filter(l => l.estado === 'OK')
  const hayLog  = log.length > 0

  return (
    <div>
      <PageHeader
        title="Importación Masiva"
        subtitle="Carga datos desde Excel · Validación previa · Log de errores por fila"
      />

      {/* Selector de entidad */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {ENTIDADES.map(e => {
          const Ic     = e.icon
          const active = entidadId === e.id
          return (
            <button key={e.id} onClick={() => cambiarEntidad(e.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: '.83rem', fontWeight: 600, transition: 'all .15s',
              background: active ? 'var(--primary)' : 'var(--border)',
              color:      active ? '#fff'           : 'var(--text)',
            }}>
              <Ic size={15}/> {e.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Panel izquierdo: carga y acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '.95rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 7 }}>
                  {(() => { const Ic = entidad.icon; return <Ic size={17} color="var(--primary)"/> })()}
                  {entidad.label}
                </h3>
                <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-muted)' }}>
                  {entidad.descripcion}
                </p>
              </div>
              <button onClick={descargarPlantilla} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 8, border: '1px solid var(--primary-border)',
                background: 'var(--primary-bg)', color: 'var(--primary)',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '.79rem', fontWeight: 600,
                flexShrink: 0,
              }}>
                <MdDownload size={15}/> Plantilla Excel
              </button>
            </div>

            <PanelColumnas entidad={entidad}/>

            <div style={{ marginTop: 16 }}>
              <DropZone onFile={f => { setArchivo(f); resetear(); setArchivo(f) }} archivo={archivo}/>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                onClick={validar}
                disabled={!archivo || ['validando','importando'].includes(fase)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: archivo ? '#2563eb' : 'var(--border)',
                  color: archivo ? '#fff' : 'var(--text-muted)',
                  cursor: archivo ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font)', fontWeight: 700, fontSize: '.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {fase === 'validando' ? <Spinner size="xs"/> : <MdCheckCircle size={16}/>}
                {fase === 'validando' ? 'Validando...' : '1. Validar'}
              </button>

              <button
                onClick={importar}
                disabled={fase !== 'validado' || errores.length > 0 || fase === 'importando'}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: (fase === 'validado' && errores.length === 0) ? '#15803d' : 'var(--border)',
                  color: (fase === 'validado' && errores.length === 0) ? '#fff' : 'var(--text-muted)',
                  cursor: (fase === 'validado' && errores.length === 0) ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font)', fontWeight: 700, fontSize: '.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {fase === 'importando' ? <Spinner size="xs"/> : <MdUpload size={16}/>}
                {fase === 'importando' ? 'Importando...' : '2. Importar'}
              </button>

              {(fase !== 'idle') && (
                <button onClick={resetear} style={{
                  padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg)', cursor: 'pointer', color: 'var(--text-muted)',
                  fontFamily: 'var(--font)', fontSize: '.82rem',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <MdRefresh size={15}/> Reiniciar
                </button>
              )}
            </div>
          </Card>

          {/* Instrucciones */}
          <Card>
            <h4 style={{ margin: '0 0 10px', fontSize: '.85rem', fontWeight: 700 }}>
              📋 Instrucciones
            </h4>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: '.8rem',
              color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <li>Descarga la <strong>Plantilla Excel</strong> del tipo de dato a importar.</li>
              <li>Completa los datos en la hoja (fila 1 = cabecera, fila 2+ = datos).</li>
              <li>Sube el archivo y haz clic en <strong>1. Validar</strong>.</li>
              <li>Revisa el log de validación. Si hay errores, corrígelos y vuelve al paso 3.</li>
              <li>Sin errores, haz clic en <strong>2. Importar</strong> para guardar en la BD.</li>
            </ol>
            {entidadId === 'postulaciones' && (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8,
                background: '#fef9c3', border: '1px solid #fde68a', fontSize: '.77rem', color: '#92400e' }}>
                <MdWarning size={13} style={{ marginRight: 5 }}/>
                Al importar postulaciones se envía automáticamente el enlace de evaluación
                a todos los candidatos por correo electrónico.
              </div>
            )}
          </Card>
        </div>

        {/* Panel derecho: log de validación / resultado */}
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '.95rem', fontWeight: 700 }}>
                {fase === 'listo' ? '✅ Resultado de Importación' :
                 fase === 'error' ? '❌ Error' :
                 hayLog          ? '🔍 Log de Validación' : '📋 Log de Validación'}
              </h3>
              {resumen && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Badge variant="success">{oks.length} OK</Badge>
                  {errores.length > 0 && <Badge variant="danger">{errores.length} Errores</Badge>}
                </div>
              )}
            </div>

            {/* Alertas de estado */}
            {fase === 'listo' && (
              <Alert type="success" style={{ marginBottom: 14 }}>
                ✅ Importación completada. <strong>{resumen?.creados}</strong> registros creados exitosamente.
              </Alert>
            )}
            {fase === 'validado' && errores.length === 0 && (
              <Alert type="success" style={{ marginBottom: 14 }}>
                ✅ Validación exitosa — <strong>{oks.length} filas</strong> listas.
                Puedes proceder con la importación.
              </Alert>
            )}
            {fase === 'validado' && errores.length > 0 && (
              <Alert type="error" style={{ marginBottom: 14 }}>
                ❌ <strong>{errores.length} error(es)</strong> encontrados.
                Corrige el Excel y vuelve a validar.
              </Alert>
            )}
            {msgError && (
              <Alert type="error" style={{ marginBottom: 14 }}>{msgError}</Alert>
            )}

            {/* Log */}
            {!hayLog && fase === 'idle' && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                <MdTableChart size={40} style={{ opacity: .2, marginBottom: 12 }}/>
                <p style={{ fontSize: '.85rem' }}>
                  Sube un archivo y haz clic en "Validar" para ver el log de validación aquí.
                </p>
              </div>
            )}
            {hayLog && (
              <div style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
                {log.map((item, i) => <LogFila key={i} item={item}/>)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

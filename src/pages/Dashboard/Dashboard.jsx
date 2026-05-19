// src/pages/Dashboard/Dashboard.jsx
import { useAuth } from '../../context/AuthContext'
import { useFetch } from '../../hooks/useFetch'
import { empresaService, accesoService, vacantesService, candidatosService } from '../../services'
import { Card, Spinner, Alert } from '../../components/ui'
import styles from './Dashboard.module.css'

function KpiCard({ icon, label, value, sub, color = 'primary' }) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi_${color}`]}`}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiBody}>
        <div className={styles.kpiValue}>{value ?? '—'}</div>
        <div className={styles.kpiLabel}>{label}</div>
        {sub && <div className={styles.kpiSub}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const cid = user?.compania

  const companias   = useFetch(() => empresaService.vCompanias())
  const usuarios    = useFetch(() => accesoService.vUsuarios(cid), [cid])
  const vacantes    = useFetch(() => vacantesService.vVacantes(cid), [cid])
  const candidatos  = useFetch(() => candidatosService.vCandidatos(cid), [cid])
  const postulaciones = useFetch(() => candidatosService.vPostulaciones(cid), [cid])

  const vacsActivas    = vacantes.data?.filter(v => v.ind_activa)?.length ?? 0
  const vacsPublicadas = vacantes.data?.filter(v => v.ind_publicada)?.length ?? 0
  const postSelec      = postulaciones.data?.filter(p => p.estado_descripcion === 'Seleccionado')?.length ?? 0

  return (
    <div className={styles.page}>
      {/* Bienvenida */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>
            ¡Hola, {user?.nombre?.split(' ')[0] || user?.login}! 👋
          </h1>
          <p className={styles.welcomeSub}>
            Resumen del sistema · {new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}
          </p>
        </div>
        {user?.ind_super_usuario && (
          <span className="badge badge-primary">Super Administrador</span>
        )}
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        {user?.ind_super_usuario && (
          <>
            <KpiCard
              icon="🏢"
              label="Compañías registradas"
              value={companias.data?.length}
              color="primary"
            />

            <KpiCard
              icon="👤"
              label="Usuarios activos"
              value={usuarios.data?.filter(u => u.ind_activo)?.length}
              color="accent"
            />
          </>
        )}

        <KpiCard
          icon="💼"
          label="Vacantes activas"
          value={vacsActivas}
          sub={`${vacsPublicadas} publicadas`}
          color="success"
        />

        <KpiCard
          icon="🧑‍💼"
          label="Candidatos registrados"
          value={candidatos.data?.length}
          color="info"
        />

        <KpiCard
          icon="📋"
          label="Postulaciones totales"
          value={postulaciones.data?.length}
          sub={`${postSelec} seleccionados`}
          color="warning"
        />
      </div>

      {/* Estado de postulaciones */}
      {postulaciones.data?.length > 0 && (
        <Card style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--text-h)' }}>
            📊 Estado de Postulaciones
          </h3>
          <div className={styles.stateGrid}>
            {['Recibida','En Evaluación','Seleccionado','Descartado','Finalizado'].map(estado => {
              const count = postulaciones.data.filter(p => p.estado_descripcion === estado).length
              const variantMap = {
                'Recibida':'info','En Evaluación':'warning',
                'Seleccionado':'success','Descartado':'danger','Finalizado':'primary'
              }
              return (
                <div key={estado} className={styles.stateCard}>
                  <div className={styles.stateCount}>{count}</div>
                  <span className={`badge badge-${variantMap[estado]}`}>{estado}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Últimas vacantes */}
      {vacantes.data?.length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--text-h)' }}>
            💼 Vacantes Recientes
          </h3>
          <div className={styles.vacList}>
            {vacantes.data.slice(0, 5).map(v => (
              <div key={v.id} className={styles.vacItem}>
                <div>
                  <div className={styles.vacTitle}>{v.descripcion?.slice(0, 60)}...</div>
                  <div className={styles.vacMeta}>{v.unidad_descripcion} · {v.tipo_contrato_descripcion}</div>
                </div>
                <span className={`badge badge-${v.ind_publicada ? 'success' : 'warning'}`}>
                  {v.ind_publicada ? 'Publicada' : 'Borrador'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

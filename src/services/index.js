// src/services/index.js
// ══════════════════════════════════════════════
// Servicios centralizados para todos los módulos.
// Cada función mapea exactamente a un endpoint
// del backend según las URLs definidas en urls.py
// ══════════════════════════════════════════════
import api from '../api/axios'

// ── EMPRESA ────────────────────────────────────
export const empresaService = {
  // Tablas base
  getCompanias:       ()         => api.get('/api/empresa/companias/'),
  getCompania:        (id)       => api.get(`/api/empresa/companias/${id}/`),
  createCompania:     (data)     => api.post('/api/empresa/companias/', data),
  updateCompania:     (id, data) => api.put(`/api/empresa/companias/${id}/`, data),
  deleteCompania:     (id)       => api.delete(`/api/empresa/companias/${id}/`),
  // Unidades org
  getUnidades:        (cid)      => api.get(`/api/empresa/companias/${cid}/unidades/`),
  createUnidad:       (cid, d)   => api.post(`/api/empresa/companias/${cid}/unidades/`, d),
  updateUnidad:       (cid,id,d) => api.put(`/api/empresa/companias/${cid}/unidades/${id}/`, d),
  deleteUnidad:       (cid, id)  => api.delete(`/api/empresa/companias/${cid}/unidades/${id}/`),
  // Vistas SQL
  vCompanias:         (params)   => api.get('/api/empresa/v/companias/', { params }),
  vUnidades:          (cid)      => api.get(`/api/empresa/v/companias/${cid}/unidades/`),
}

// ── ACCESO ─────────────────────────────────────
export const accesoService = {
  // Roles
  getRoles:           ()         => api.get('/api/acceso/roles/'),
  createRol:          (data)     => api.post('/api/acceso/roles/', data),
  updateRol:          (id, data) => api.put(`/api/acceso/roles/${id}/`, data),
  deleteRol:          (id)       => api.delete(`/api/acceso/roles/${id}/`),
  // Módulos
  getModulos:         ()         => api.get('/api/acceso/modulos/'),
  createModulo:       (data)     => api.post('/api/acceso/modulos/', data),
  updateModulo:       (id, data) => api.put(`/api/acceso/modulos/${id}/`, data),
  deleteModulo:       (id)       => api.delete(`/api/acceso/modulos/${id}/`),
  // Rol-Módulo
  getRolModulos:      (rol)      => api.get(`/api/acceso/roles/${rol}/modulos/`),
  asignarModulo:      (rol, d)   => api.post(`/api/acceso/roles/${rol}/modulos/`, d),
  desasignarModulo:   (rol, id)  => api.delete(`/api/acceso/roles/${rol}/modulos/${id}/`),
  // Analistas
  getAnalistas:       (cid)      => api.get(`/api/acceso/companias/${cid}/analistas/`),
  createAnalista:     (cid, d)   => api.post(`/api/acceso/companias/${cid}/analistas/`, d),
  updateAnalista:     (cid,id,d) => api.put(`/api/acceso/companias/${cid}/analistas/${id}/`, d),
  deleteAnalista:     (cid, id)  => api.delete(`/api/acceso/companias/${cid}/analistas/${id}/`),
  // Usuarios
  getUsuarios:        (cid)      => api.get(`/api/acceso/companias/${cid}/usuarios/`),
  createUsuario:      (cid, d)   => api.post(`/api/acceso/companias/${cid}/usuarios/`, d),
  updateUsuario:      (cid,id,d) => api.put(`/api/acceso/companias/${cid}/usuarios/${id}/`, d),
  deleteUsuario:      (cid, id)  => api.delete(`/api/acceso/companias/${cid}/usuarios/${id}/`),
  // Vistas SQL
  vRoles:             ()         => api.get('/api/acceso/v/roles/'),
  vModulos:           (p)        => api.get('/api/acceso/v/modulos/', { params: p }),
  vAnalistas:         (cid,p)    => api.get(`/api/acceso/v/companias/${cid}/analistas/`, { params: p }),
  vUsuarios:          (cid,p)    => api.get(`/api/acceso/v/companias/${cid}/usuarios/`, { params: p }),
}

// ── VACANTES ───────────────────────────────────
export const vacantesService = {
  getEstadosVacante:  ()         => api.get('/api/vacantes/estados-vacante/'),
  getTiposContrato:   ()         => api.get('/api/vacantes/tipos-contrato/'),
  // Vacantes
  getVacantes:        (cid, p)   => api.get(`/api/vacantes/companias/${cid}/vacantes/`, { params: p }),
  createVacante:      (cid, d)   => api.post(`/api/vacantes/companias/${cid}/vacantes/`, d),
  updateVacante:      (cid,id,d) => api.put(`/api/vacantes/companias/${cid}/vacantes/${id}/`, d),
  deleteVacante:      (cid, id)  => api.delete(`/api/vacantes/companias/${cid}/vacantes/${id}/`),
  // Vistas SQL
  vVacantes:          (cid, p)   => api.get(`/api/vacantes/v/companias/${cid}/vacantes/`, { params: p }),
}

// ── CANDIDATOS ─────────────────────────────────
export const candidatosService = {
  getTiposDocumento:  ()         => api.get('/api/candidatos/tipos-documento/'),
  getEstadosPost:     ()         => api.get('/api/candidatos/estados-postulacion/'),
  // Candidatos
  getCandidatos:      (cid, p)   => api.get(`/api/candidatos/companias/${cid}/candidatos/`, { params: p }),
  createCandidato:    (cid, d)   => api.post(`/api/candidatos/companias/${cid}/candidatos/`, d),
  updateCandidato:    (cid,id,d) => api.put(`/api/candidatos/companias/${cid}/candidatos/${id}/`, d),
  deleteCandidato:    (cid, id)  => api.delete(`/api/candidatos/companias/${cid}/candidatos/${id}/`),
  // Datos candidato
  getDatosCandidato:  (cid, cand) => api.get(`/api/candidatos/companias/${cid}/candidatos/${cand}/datos/`),
  createDatos:        (cid,cand,d)=> api.post(`/api/candidatos/companias/${cid}/candidatos/${cand}/datos/`, d),
  updateDatos:        (cid,cand,d)=> api.put(`/api/candidatos/companias/${cid}/candidatos/${cand}/datos/`, d),
  // Anexos
  getAnexos:          (cid, cand)      => api.get(`/api/candidatos/companias/${cid}/candidatos/${cand}/anexos/`),
  deleteAnexo:        (cid, cand, id)  => api.delete(`/api/candidatos/companias/${cid}/candidatos/${cand}/anexos/${id}/`),
  // Postulaciones
  getPostulaciones:   (cid, p)   => api.get(`/api/candidatos/companias/${cid}/postulaciones/`, { params: p }),
  createPostulacion:  (cid, d)   => api.post(`/api/candidatos/companias/${cid}/postulaciones/`, d),
  updatePostulacion:  (cid,id,d) => api.put(`/api/candidatos/companias/${cid}/postulaciones/${id}/`, d),
  deletePostulacion:  (cid, id)  => api.delete(`/api/candidatos/companias/${cid}/postulaciones/${id}/`),
  // Reporte
  getReporte:         (cid, p)   => api.get(`/api/candidatos/companias/${cid}/reporte-postulaciones/`, { params: p }),
  // Vistas SQL
  vCandidatos:        (cid, p)   => api.get(`/api/candidatos/v/companias/${cid}/candidatos/`, { params: p }),
  vPostulaciones:     (cid, p)   => api.get(`/api/candidatos/v/companias/${cid}/postulaciones/`, { params: p }),
}

// ── EVALUACIÓN ─────────────────────────────────
export const evaluacionService = {
  getHabilidades:     ()         => api.get('/api/evaluacion/habilidades/'),
  getEvaluaciones:    (cid, p)   => api.get(`/api/evaluacion/companias/${cid}/evaluaciones/`, { params: p }),
  getEstadosIntento:  ()         => api.get('/api/evaluacion/estados-intento/'),
  getIntentos:        (cid, p)   => api.get(`/api/evaluacion/companias/${cid}/intentos/`, { params: p }),
  // Vistas
  vEvaluaciones:      (cid, p)   => api.get(`/api/evaluacion/v/companias/${cid}/evaluaciones/`, { params: p }),
  vIntentos:          (cid, p)   => api.get(`/api/evaluacion/v/companias/${cid}/intentos/`, { params: p }),
  vReporte:           (cid, p)   => api.get(`/api/evaluacion/v/companias/${cid}/reporte-postulaciones/`, { params: p }),
}

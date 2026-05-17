// src/services/index.js
import api from '../api/axios'

export const empresaService = {
  getCompanias:    ()          => api.get('/api/empresa/companias/'),
  getCompania:     (id)        => api.get(`/api/empresa/companias/${id}/`),
  createCompania:  (data)      => api.post('/api/empresa/companias/', data),
  updateCompania:  (id, data)  => api.put(`/api/empresa/companias/${id}/`, data),
  deleteCompania:  (id)        => api.delete(`/api/empresa/companias/${id}/`),
  getUnidades:     (cid)       => api.get(`/api/empresa/companias/${cid}/unidades/`),
  createUnidad:    (cid, d)    => api.post(`/api/empresa/companias/${cid}/unidades/`, d),
  updateUnidad:    (cid,id,d)  => api.put(`/api/empresa/companias/${cid}/unidades/${id}/`, d),
  deleteUnidad:    (cid, id)   => api.delete(`/api/empresa/companias/${cid}/unidades/${id}/`),
  vCompanias:      ()          => api.get('/api/empresa/v/companias/'),
  vUnidades:       (cid)       => api.get(`/api/empresa/v/companias/${cid}/unidades/`),
}

export const accesoService = {
  // Auth
  login:           (data)      => api.post('/api/acceso/auth/login/', data),
  resetRequest:    (data)      => api.post('/api/acceso/auth/reset-request/', data),
  resetConfirm:    (data)      => api.post('/api/acceso/auth/reset-confirm/', data),
  cambiarCompania: (data)      => api.post('/api/acceso/auth/cambiar-compania/', data),
  misCompanias:    (uid, q)    => api.get('/api/acceso/auth/mis-companias/', { params: { usuario_id: uid, q } }),
  // Roles
  getRoles:        ()          => api.get('/api/acceso/roles/'),
  createRol:       (data)      => api.post('/api/acceso/roles/', data),
  updateRol:       (id, data)  => api.put(`/api/acceso/roles/${id}/`, data),
  deleteRol:       (id)        => api.delete(`/api/acceso/roles/${id}/`),
  // Módulos
  getModulos:      ()          => api.get('/api/acceso/modulos/'),
  createModulo:    (data)      => api.post('/api/acceso/modulos/', data),
  updateModulo:    (id, data)  => api.put(`/api/acceso/modulos/${id}/`, data),
  deleteModulo:    (id)        => api.delete(`/api/acceso/modulos/${id}/`),
  // Rol-Módulo
  getRolModulos:   (rol)       => api.get(`/api/acceso/roles/${rol}/modulos/`),
  asignarModulo:   (rol, d)    => api.post(`/api/acceso/roles/${rol}/modulos/`, d),
  desasignarModulo:(rol, id)   => api.delete(`/api/acceso/roles/${rol}/modulos/${id}/`),
  // Analistas
  getAnalistas:    (cid)       => api.get(`/api/acceso/companias/${cid}/analistas/`),
  createAnalista:  (cid, d)    => api.post(`/api/acceso/companias/${cid}/analistas/`, d),
  updateAnalista:  (cid,id,d)  => api.put(`/api/acceso/companias/${cid}/analistas/${id}/`, d),
  deleteAnalista:  (cid, id)   => api.delete(`/api/acceso/companias/${cid}/analistas/${id}/`),
  // Usuarios
  getUsuarios:     (cid)       => api.get(`/api/acceso/companias/${cid}/usuarios/`),
  createUsuario:   (cid, d)    => api.post(`/api/acceso/companias/${cid}/usuarios/`, d),
  updateUsuario:   (cid,id,d)  => api.put(`/api/acceso/companias/${cid}/usuarios/${id}/`, d),
  deleteUsuario:   (cid, id)   => api.delete(`/api/acceso/companias/${cid}/usuarios/${id}/`),
  // Vistas SQL
  vRoles:          ()          => api.get('/api/acceso/v/roles/'),
  vModulos:        (p)         => api.get('/api/acceso/v/modulos/', { params: p }),
  vAnalistas:      (cid,p)     => api.get(`/api/acceso/v/companias/${cid}/analistas/`, { params: p }),
  vUsuarios:       (cid,p)     => api.get(`/api/acceso/v/companias/${cid}/usuarios/`, { params: p }),
}

export const vacantesService = {
  getEstadosVacante: ()        => api.get('/api/vacantes/estados-vacante/'),
  getTiposContrato:  ()        => api.get('/api/vacantes/tipos-contrato/'),
  getVacantes:     (cid, p)    => api.get(`/api/vacantes/companias/${cid}/vacantes/`, { params: p }),
  createVacante:   (cid, d)    => api.post(`/api/vacantes/companias/${cid}/vacantes/`, d),
  updateVacante:   (cid,id,d)  => api.put(`/api/vacantes/companias/${cid}/vacantes/${id}/`, d),
  deleteVacante:   (cid, id)   => api.delete(`/api/vacantes/companias/${cid}/vacantes/${id}/`),
  vVacantes:       (cid, p)    => api.get(`/api/vacantes/v/companias/${cid}/vacantes/`, { params: p }),
}

export const candidatosService = {
  getTiposDocumento:  ()           => api.get('/api/candidatos/tipos-documento/'),
  getEstadosPost:     ()           => api.get('/api/candidatos/estados-postulacion/'),
  getCandidatos:      (cid, p)     => api.get(`/api/candidatos/companias/${cid}/candidatos/`, { params: p }),
  createCandidato:    (cid, d)     => api.post(`/api/candidatos/companias/${cid}/candidatos/`, d),
  updateCandidato:    (cid,id,d)   => api.put(`/api/candidatos/companias/${cid}/candidatos/${id}/`, d),
  deleteCandidato:    (cid, id)    => api.delete(`/api/candidatos/companias/${cid}/candidatos/${id}/`),
  getDatos:           (cid, cand)  => api.get(`/api/candidatos/companias/${cid}/candidatos/${cand}/datos/`),
  createDatos:        (cid,cand,d) => api.post(`/api/candidatos/companias/${cid}/candidatos/${cand}/datos/`, d),
  updateDatos:        (cid,cand,d) => api.put(`/api/candidatos/companias/${cid}/candidatos/${cand}/datos/`, d),
  getAnexos:          (cid, cand)  => api.get(`/api/candidatos/companias/${cid}/candidatos/${cand}/anexos/`),
  uploadAnexo:        (cid, cand, fd) =>
    api.post(`/api/candidatos/companias/${cid}/candidatos/${cand}/anexos/`, fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAnexo:        (cid, cand, id) =>
    api.delete(`/api/candidatos/companias/${cid}/candidatos/${cand}/anexos/${id}/`),
  getPostulaciones:   (cid, p)     => api.get(`/api/candidatos/companias/${cid}/postulaciones/`, { params: p }),
  createPostulacion:  (cid, d)     => api.post(`/api/candidatos/companias/${cid}/postulaciones/`, d),
  updatePostulacion:  (cid,id,d)   => api.put(`/api/candidatos/companias/${cid}/postulaciones/${id}/`, d),
  deletePostulacion:  (cid, id)    => api.delete(`/api/candidatos/companias/${cid}/postulaciones/${id}/`),
  getReporte:         (cid, p)     => api.get(`/api/candidatos/companias/${cid}/reporte-postulaciones/`, { params: p }),
  vCandidatos:        (cid, p)     => api.get(`/api/candidatos/v/companias/${cid}/candidatos/`, { params: p }),
  vPostulaciones:     (cid, p)     => api.get(`/api/candidatos/v/companias/${cid}/postulaciones/`, { params: p }),
}

export const evaluacionService = {
  // Banco global
  getHabilidades:     ()           => api.get('/api/evaluacion/habilidades/'),
  createHabilidad:    (d)          => api.post('/api/evaluacion/habilidades/', d),
  updateHabilidad:    (id, d)      => api.put(`/api/evaluacion/habilidades/${id}/`, d),
  deleteHabilidad:    (id)         => api.delete(`/api/evaluacion/habilidades/${id}/`),
  getPreguntas:       (hid, p)     => api.get(`/api/evaluacion/habilidades/${hid}/preguntas/`, { params: p }),
  createPregunta:     (hid, d)     => api.post(`/api/evaluacion/habilidades/${hid}/preguntas/`, d),
  updatePregunta:     (hid,id,d)   => api.put(`/api/evaluacion/habilidades/${hid}/preguntas/${id}/`, d),
  deletePregunta:     (hid, id)    => api.delete(`/api/evaluacion/habilidades/${hid}/preguntas/${id}/`),
  getRespuestas:      (pid)        => api.get(`/api/evaluacion/preguntas/${pid}/respuestas/`),
  createRespuesta:    (pid, d)     => api.post(`/api/evaluacion/preguntas/${pid}/respuestas/`, d),
  updateRespuesta:    (pid,id,d)   => api.put(`/api/evaluacion/preguntas/${pid}/respuestas/${id}/`, d),
  deleteRespuesta:    (pid, id)    => api.delete(`/api/evaluacion/preguntas/${pid}/respuestas/${id}/`),
  // Evaluaciones por compañía
  getEvaluaciones:    (cid, p)     => api.get(`/api/evaluacion/companias/${cid}/evaluaciones/`, { params: p }),
  createEvaluacion:   (cid, d)     => api.post(`/api/evaluacion/companias/${cid}/evaluaciones/`, d),
  updateEvaluacion:   (cid,id,d)   => api.put(`/api/evaluacion/companias/${cid}/evaluaciones/${id}/`, d),
  deleteEvaluacion:   (cid, id)    => api.delete(`/api/evaluacion/companias/${cid}/evaluaciones/${id}/`),
  // Habilidades de una evaluación
  getEvalHabilidades: (cid, eid)   => api.get(`/api/evaluacion/companias/${cid}/evaluaciones/${eid}/habilidades/`),
  asignarHabilidad:   (cid,eid,d)  => api.post(`/api/evaluacion/companias/${cid}/evaluaciones/${eid}/habilidades/`, d),
  desasignarHabilidad:(cid,eid,id) => api.delete(`/api/evaluacion/companias/${cid}/evaluaciones/${eid}/habilidades/${id}/`),
  // Evaluación por vacante
  getEvalVacantes:    (cid, p)     => api.get(`/api/evaluacion/companias/${cid}/evaluacion-vacante/`, { params: p }),
  createEvalVacante:  (cid, d)     => api.post(`/api/evaluacion/companias/${cid}/evaluacion-vacante/`, d),
  deleteEvalVacante:  (cid, id)    => api.delete(`/api/evaluacion/companias/${cid}/evaluacion-vacante/${id}/`),
  // Intentos
  getIntentos:        (cid, p)     => api.get(`/api/evaluacion/companias/${cid}/intentos/`, { params: p }),
  // Vistas SQL
  vEvaluaciones:      (cid, p)     => api.get(`/api/evaluacion/v/companias/${cid}/evaluaciones/`, { params: p }),
  vIntentos:          (cid, p)     => api.get(`/api/evaluacion/v/companias/${cid}/intentos/`, { params: p }),
  vReporte:           (cid, p)     => api.get(`/api/evaluacion/v/companias/${cid}/reporte-postulaciones/`, { params: p }),
  // Acceso público (candidato)
  accesoToken:        (token, llave) => api.get('/api/evaluacion/acceso/', { params: { token, llave } }),
  responder:          (data)       => api.post('/api/evaluacion/responder/', data),
}

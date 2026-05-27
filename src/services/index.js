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
  login:           (data)      => api.post('/api/acceso/auth/login/', data),
  resetRequest:    (data)      => api.post('/api/acceso/auth/reset-request/', data),
  resetConfirm:    (data)      => api.post('/api/acceso/auth/reset-confirm/', data),
  cambiarCompania: (data)      => api.post('/api/acceso/auth/cambiar-compania/', data),
  misCompanias:    (uid, q)    => api.get('/api/acceso/auth/mis-companias/', { params: { usuario_id: uid, q } }),
  getRoles:        ()          => api.get('/api/acceso/roles/'),
  createRol:       (data)      => api.post('/api/acceso/roles/', data),
  updateRol:       (id, data)  => api.put(`/api/acceso/roles/${id}/`, data),
  deleteRol:       (id)        => api.delete(`/api/acceso/roles/${id}/`),
  getModulos:      ()          => api.get('/api/acceso/modulos/'),
  createModulo:    (data)      => api.post('/api/acceso/modulos/', data),
  updateModulo:    (id, data)  => api.put(`/api/acceso/modulos/${id}/`, data),
  deleteModulo:    (id)        => api.delete(`/api/acceso/modulos/${id}/`),
  getRolModulos:   (rol)       => api.get(`/api/acceso/roles/${rol}/modulos/`),
  asignarModulo:   (rol, d)    => api.post(`/api/acceso/roles/${rol}/modulos/`, d),
  desasignarModulo:(rol, id)   => api.delete(`/api/acceso/roles/${rol}/modulos/${id}/`),
  getAnalistas:    (cid)       => api.get(`/api/acceso/companias/${cid}/analistas/`),
  createAnalista:  (cid, d)    => api.post(`/api/acceso/companias/${cid}/analistas/`, d),
  updateAnalista:  (cid,id,d)  => api.put(`/api/acceso/companias/${cid}/analistas/${id}/`, d),
  deleteAnalista:  (cid, id)   => api.delete(`/api/acceso/companias/${cid}/analistas/${id}/`),
  getUsuarios:     (cid)       => api.get(`/api/acceso/companias/${cid}/usuarios/`),
  createUsuario:   (cid, d)    => api.post(`/api/acceso/companias/${cid}/usuarios/`, d),
  updateUsuario:   (cid,id,d)  => api.put(`/api/acceso/companias/${cid}/usuarios/${id}/`, d),
  deleteUsuario:   (cid, id)   => api.delete(`/api/acceso/companias/${cid}/usuarios/${id}/`),
  vRoles:          ()          => api.get('/api/acceso/v/roles/'),
  vModulos:        (p)         => api.get('/api/acceso/v/modulos/', { params: p }),
  vAnalistas:      (cid, p)    => api.get(`/api/acceso/v/companias/${cid}/analistas/`, { params: p }),
  vUsuarios:       (cid, p)    => api.get(`/api/acceso/v/companias/${cid}/usuarios/`, { params: p }),
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
  uploadAnexo:        (cid, cand, fd) => api.post(`/api/candidatos/companias/${cid}/candidatos/${cand}/anexos/`, fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAnexo:        (cid, cand, id) => api.delete(`/api/candidatos/companias/${cid}/candidatos/${cand}/anexos/${id}/`),
  getPostulaciones:   (cid, p)     => api.get(`/api/candidatos/companias/${cid}/postulaciones/`, { params: p }),
  createPostulacion:  (cid, d)     => api.post(`/api/candidatos/companias/${cid}/postulaciones/`, d),
  updatePostulacion:  (cid,id,d)   => api.put(`/api/candidatos/companias/${cid}/postulaciones/${id}/`, d),
  deletePostulacion:  (cid, id)    => api.delete(`/api/candidatos/companias/${cid}/postulaciones/${id}/`),
  tomarDecision:      (cid, id, d) => api.post(`/api/candidatos/companias/${cid}/postulaciones/${id}/decision/`, d),
  finalizarPost:      (cid, id, d) => api.post(`/api/candidatos/companias/${cid}/postulaciones/${id}/finalizar/`, d),
  getReporte:         (cid, p)     => api.get(`/api/candidatos/companias/${cid}/reporte-postulaciones/`, { params: p }),
  vCandidatos:        (cid, p)     => api.get(`/api/candidatos/v/companias/${cid}/candidatos/`, { params: p }),
  vPostulaciones:     (cid, p)     => api.get(`/api/candidatos/v/companias/${cid}/postulaciones/`, { params: p }),
}

// ════════════════════════════════════════════════════════════
// EVALUACIÓN — rutas con compania (cid) obligatorio
// ════════════════════════════════════════════════════════════
export const evaluacionService = {
  // ── Habilidades por compañía ────────────────────────────────
  getHabilidades:     (cid)           => api.get(`/api/evaluacion/companias/${cid}/habilidades/`),
  createHabilidad:    (cid, d)        => api.post(`/api/evaluacion/companias/${cid}/habilidades/`, d),
  updateHabilidad:    (cid, id, d)    => api.put(`/api/evaluacion/companias/${cid}/habilidades/${id}/`, d),
  deleteHabilidad:    (cid, id)       => api.delete(`/api/evaluacion/companias/${cid}/habilidades/${id}/`),

  // ── Preguntas por compañía + habilidad (SIN evaluacion_id en URL) ──
  getPreguntas:       (cid, hid)          => api.get(`/api/evaluacion/companias/${cid}/habilidades/${hid}/preguntas/`),
  createPregunta:     (cid, hid, d)       => api.post(`/api/evaluacion/companias/${cid}/habilidades/${hid}/preguntas/`, d),
  updatePregunta:     (cid, hid, id, d)   => api.put(`/api/evaluacion/companias/${cid}/habilidades/${hid}/preguntas/${id}/`, d),
  deletePregunta:     (cid, hid, id)      => api.delete(`/api/evaluacion/companias/${cid}/habilidades/${hid}/preguntas/${id}/`),

  // ── Respuestas por compañía + pregunta ──────────────────────
  getRespuestas:      (cid, pid)          => api.get(`/api/evaluacion/companias/${cid}/preguntas/${pid}/respuestas/`),
  createRespuesta:    (cid, pid, d)       => api.post(`/api/evaluacion/companias/${cid}/preguntas/${pid}/respuestas/`, d),
  updateRespuesta:    (cid, pid, id, d)   => api.put(`/api/evaluacion/companias/${cid}/preguntas/${pid}/respuestas/${id}/`, d),
  deleteRespuesta:    (cid, pid, id)      => api.delete(`/api/evaluacion/companias/${cid}/preguntas/${pid}/respuestas/${id}/`),

  // ── Evaluaciones por compañía ────────────────────────────────
  getEvaluaciones:    (cid, p)        => api.get(`/api/evaluacion/companias/${cid}/evaluaciones/`, { params: p }),
  createEvaluacion:   (cid, d)        => api.post(`/api/evaluacion/companias/${cid}/evaluaciones/`, d),
  updateEvaluacion:   (cid, id, d)    => api.put(`/api/evaluacion/companias/${cid}/evaluaciones/${id}/`, d),
  deleteEvaluacion:   (cid, id)       => api.delete(`/api/evaluacion/companias/${cid}/evaluaciones/${id}/`),

  // ── Habilidades de una evaluación (N:M) ─────────────────────
  getEvalHabilidades:  (cid, eid)     => api.get(`/api/evaluacion/companias/${cid}/evaluaciones/${eid}/habilidades/`),
  asignarHabilidad:    (cid, eid, d)  => api.post(`/api/evaluacion/companias/${cid}/evaluaciones/${eid}/habilidades/`, d),
  desasignarHabilidad: (cid, eid, id) => api.delete(`/api/evaluacion/companias/${cid}/evaluaciones/${eid}/habilidades/${id}/`),

  // ── Evaluación por vacante (restaurada) ─────────────────────
  getEvalVacantes:    (cid, p)        => api.get(`/api/evaluacion/companias/${cid}/evaluacion-vacante/`, { params: p }),
  createEvalVacante:  (cid, d)        => api.post(`/api/evaluacion/companias/${cid}/evaluacion-vacante/`, d),
  updateEvalVacante:  (cid, id, d)    => api.put(`/api/evaluacion/companias/${cid}/evaluacion-vacante/${id}/`, d),
  deleteEvalVacante:  (cid, id)       => api.delete(`/api/evaluacion/companias/${cid}/evaluacion-vacante/${id}/`),

  // ── Intentos ─────────────────────────────────────────────────
  getIntentos:        (cid, p)        => api.get(`/api/evaluacion/companias/${cid}/intentos/`, { params: p }),

  // ── Candidato (token) ────────────────────────────────────────
  accesoToken:        (token, llave)  => api.get('/api/evaluacion/acceso/', { params: { token, llave } }),
  responder:          (data)          => api.post('/api/evaluacion/responder/', data),

  // ── Vistas SQL ───────────────────────────────────────────────
  vEvaluaciones:      (cid, p)        => api.get(`/api/evaluacion/v/companias/${cid}/evaluaciones/`, { params: p }),
  vIntentos:          (cid, p)        => api.get(`/api/evaluacion/v/companias/${cid}/intentos/`, { params: p }),
  vReporte:           (cid, p)        => api.get(`/api/evaluacion/v/companias/${cid}/reporte-postulaciones/`, { params: p }),
}

// src/routes/routers.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Login from '../pages/Login/Login'
import ForgotPassword from '../pages/Login/ForgotPassword'
import EvaluacionPublica from '../pages/EvaluacionPublica/EvaluacionPublica'
import Dashboard from '../pages/Dashboard/Dashboard'
import GestionCompania from '../pages/GestionCompania/GestionCompania'
import GestionUnidades from '../pages/GestionUnidades/GestionUnidades'
import GestionRoles from '../pages/GestionRoles/GestionRoles'
import GestionAnalistas from '../pages/GestionAnalistas/GestionAnalistas'
import GestionUsuarios from '../pages/GestionUsuarios/GestionUsuarios'
import GestionModulos from '../pages/GestionModulos/GestionModulos'
import GestionVacantes from '../pages/GestionVacantes/GestionVacantes'
import GestionCandidatos from '../pages/GestionCandidatos/GestionCandidatos'
import GestionPostulaciones from '../pages/GestionPostulaciones/GestionPostulaciones'
import GestionEvaluaciones from '../pages/GestionEvaluaciones/GestionEvaluaciones'
import Evaluacion from '../pages/Evaluacion/Evaluacion'

export const router = createBrowserRouter([
  // ── Rutas públicas (sin sesión) ───────────────────────────
  { path: '/login',             element: <Login /> },
  { path: '/forgot-password',   element: <ForgotPassword /> },
  { path: '/evaluacion/acceso', element: <EvaluacionPublica /> }, // ← candidato por token

  // ── Rutas protegidas ──────────────────────────────────────
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true,                     element: <Dashboard /> },
      { path: 'gestion-compania',              element: <GestionCompania /> },
      { path: 'gestion-unidades',              element: <GestionUnidades /> },
      { path: 'gestion-roles',                 element: <GestionRoles /> },
      { path: 'gestion-analistas',             element: <GestionAnalistas /> },
      { path: 'gestion-usuarios',              element: <GestionUsuarios /> },
      { path: 'gestion-modulos',               element: <GestionModulos /> },
      { path: 'gestion-vacantes',              element: <GestionVacantes /> },
      { path: 'gestion-candidatos',            element: <GestionCandidatos /> },
      { path: 'gestion-postulaciones',         element: <GestionPostulaciones /> },
      { path: 'gestion-evaluaciones',          element: <GestionEvaluaciones /> },
      { path: 'evaluacion',                    element: <Evaluacion /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

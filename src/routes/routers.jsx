// src/routes/routers.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Login from '../pages/Login/Login'
import Dashboard from '../pages/Dashboard/Dashboard'
import GestionCompania from '../pages/GestionCompania/GestionCompania'
import GestionAnalistas from '../pages/GestionAnalistas/GestionAnalistas'
import GestionUsuarios from '../pages/GestionUsuarios/GestionUsuarios'
import GestionModulos from '../pages/GestionModulos/GestionModulos'
import GestionVacantes from '../pages/GestionVacantes/GestionVacantes'
import GestionCandidatos from '../pages/GestionCandidatos/GestionCandidatos'
import GestionPostulaciones from '../pages/GestionPostulaciones/GestionPostulaciones'
import Evaluacion from '../pages/Evaluacion/Evaluacion'

export const router = createBrowserRouter([
  // ── Ruta pública: Login ──────────────────────
  {
    path: '/login',
    element: <Login />,
  },

  // ── Rutas protegidas: requieren sesión ────────
  // La protección real ocurre en MainLayout (useEffect → redirect si !user)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true,                          element: <Dashboard /> },
      { path: 'gestion-compania',             element: <GestionCompania /> },
      { path: 'gestion-analistas',            element: <GestionAnalistas /> },
      { path: 'gestion-usuarios',             element: <GestionUsuarios /> },
      { path: 'gestion-modulos',              element: <GestionModulos /> },
      { path: 'gestion-vacantes',             element: <GestionVacantes /> },
      { path: 'gestion-candidatos',           element: <GestionCandidatos /> },
      { path: 'gestion-postulaciones',        element: <GestionPostulaciones /> },
      { path: 'evaluacion',                   element: <Evaluacion /> },
    ],
  },

  // ── Catch-all ─────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])

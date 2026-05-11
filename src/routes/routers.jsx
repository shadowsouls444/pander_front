import { createBrowserRouter } from "react-router-dom"
import MainLayout from "../layout/MainLayout"
import GestionUsuarios from "../pages/GestionUsuarios"
import GestionModulos from "../pages/GestionModulos";
import GestionVacantes from "../pages/GestionVacantes";
import GestionDatosCandidato from "../pages/GestionDatosCandidato";
import GestionCompañia from "../pages/GestionCompañia";
import GestionAnalistas from "../pages/GestionAnalistas";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true, // Ruta por defecto
                element: <h4>Home</h4>
            },
            {
                path: 'gestion-usuarios',
                element: <GestionUsuarios />
            },
            {
                path: 'gestion-modulos',
                element: <GestionModulos />
            },
            {
                path: 'gestion-vacantes',
                element: <GestionVacantes />
            },
            {
                path: 'gestor-datos-candidato',
                element: <GestionDatosCandidato />
            },
            {
                path: 'gestion-compañia',
                element: <GestionCompañia />
            },
            {
                path: 'gestion-analistas',
                element: <GestionAnalistas />
            }
        ]
    }
])
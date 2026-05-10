import { createBrowserRouter } from "react-router-dom"
import MainLayout from "../layout/MainLayout"
import GestionUsuarios from "../pages/GestionUsuarios"
import GestionModulos from "../pages/GestionModulos";

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
            }
        ]
    }
])
import { createBrowserRouter } from "react-router-dom"
import MainLayout from "../layout/MainLayout"
import CreateUser from "../pages/CreateUser/CreateUser"
import ListUser from "../pages/ListUser/ListUser"

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
                path: 'crear-usuario',
                element: <CreateUser />
            },
            {
                path: 'ver-usuarios',
                element: <ListUser />
            }
        ]
    }
])
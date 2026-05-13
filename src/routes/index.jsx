// src/routes/index.jsx
import { RouterProvider } from 'react-router-dom'
import { router } from './routers'

const AppRouter = () => <RouterProvider router={router} />

export default AppRouter

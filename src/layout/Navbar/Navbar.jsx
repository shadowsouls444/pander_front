import styles from './Navbar.module.css'
import { Link } from 'react-router-dom'

function Navbar() {
    return (
        <nav>
            <ul className={`${styles.container} ${styles.text}`}>
                <li>
                    <Link to="/gestion-usuarios"> Gestion Usuarios</Link>
                </li>
                <li>
                    <Link to="/gestion-modulos"> Gestion Módulos</Link>
                </li>
                <li>
                    <Link to="/gestion-vacantes"> Gestion Vacantes</Link>
                </li>
                <li>
                    <Link to="/gestor-datos-candidato"> Gestor Datos Candidato</Link>
                </li>
                <li>
                    <Link to="/gestion-compañia"> Gestion Compañia</Link>
                </li>
                <li>
                    <Link to="/gestion-analistas"> Gestion Analistas</Link>
                </li>
            </ul>
        </nav>
    )
}

export default Navbar
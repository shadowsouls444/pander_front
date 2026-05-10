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
            </ul>
        </nav>
    )
}

export default Navbar
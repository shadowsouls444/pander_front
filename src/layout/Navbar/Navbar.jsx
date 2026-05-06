import styles from './Navbar.module.css'
import { Link } from 'react-router-dom'

function Navbar() {
    return (
        <nav>
            <ul className={`${styles.container} ${styles.text}`}>
                <li>
                    <Link to="/crear-usuario">Opcion 1</Link>
                </li>
                <li>
                    <Link to="/ver-usuarios">Opcion 2</Link>
                </li>
            </ul>
        </nav>
    )
}

export default Navbar
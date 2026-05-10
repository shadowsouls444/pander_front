import styles from './ListaModulos.module.css';

function ListaModulos() {
    return (
        <div className={styles.container}>
    <h1>CRUD de Módulos</h1>

   
    <div className={styles.form}>
        <input type="text" placeholder="Buscar módulo..." />
        <button>Buscar</button>
        <button>Crear Nuevo</button>
    </div>

    <table className={styles.crudTable}>
        <thead>
            <tr>
                <th>Módulo</th>
                <th>Módulo Principal</th>
                <th>Descripción</th>
                <th>Comentario</th>
                <th>Aplicación</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className={styles.acciones}></td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className={styles.acciones}></td>
            </tr>
        </tbody>
    </table>
</div>
    );
}

export default ListaModulos;

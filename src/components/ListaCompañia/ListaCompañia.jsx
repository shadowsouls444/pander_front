import styles from './ListaCompañia.module.css';

function ListaCompañia() {
    return (
        <div className={styles.container}>
    <h1>CRUD de Compañías</h1>
    
    <div className={styles.form}>
        <input type="text" placeholder="Buscar compañía..." />
        <button>Buscar</button>
        <button>Crear Nuevo</button>
    </div>

<div className={styles.tableContainer}>
    <table className={styles.crudTable}>
        <thead>
            <tr>
                <th>Compañía</th>
                <th>Descripción</th>
                <th>NIT</th>
                <th>Objetivo Social</th>
                <th>Representante</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Activa</th>
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
                <td></td>
                <td></td>
                <td></td>
                <td className={styles.acciones}></td>
            </tr>
        </tbody>
    </table>
</div>
</div>
    );
}

export default ListaCompañia;
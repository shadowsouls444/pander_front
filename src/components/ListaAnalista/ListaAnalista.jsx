import styles from './ListaAnalista.module.css';

function ListaAnalista() {
    return (
    <div className={styles.container}>
    <h1>CRUD de Analistas</h1>

    
    <div className={styles.form}>
        <input type="text" placeholder="Buscar analista..." />
        <button>Buscar</button>
        <button>Crear Nuevo</button>
    </div>

<div className={styles.tableContainer}>
    <table className={styles.crudTable}>
        <thead>
            <tr>
                <th>Compañía</th>
                <th>Analista</th>
                <th>Documento</th>
                <th>Número Documento</th>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Teléfono</th>
                <th>Cargo</th>
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

export default ListaAnalista;
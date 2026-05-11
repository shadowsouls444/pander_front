import styles from './ListaDatosCandidato.module.css';

function ListaDatosCandidato() {
    return (
        <div className={styles.container}>
    <h1>CRUD de Candidatos</h1>

    <div className={styles.form}>
        <input type="text" placeholder="Buscar candidato..." />
        <button>Buscar</button>
        <button>Crear Nuevo</button>
    </div>

 <div className={styles.tableContainer}>
    <table className={styles.crudTable}>
        <thead>
            <tr>
                <th>Compañía</th>
                <th>Candidato</th>
                <th>Tipo Documento</th>
                <th>Número Documento</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Email</th>
                <th>Teléfono</th>
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

export default ListaDatosCandidato;
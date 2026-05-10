import styles from './ListaUsuarios.module.css';

function ListaUsuarios() {
  return (

    <div className={styles.container}>
    <h1>CRUD de Usuarios</h1>

    <div className={styles.form}>
        <input type="text" placeholder="Buscar usuario..." />
        <button>Buscar</button>
        <button>Crear Nuevo</button>
    </div>

    <table className={styles.crudTable}>
        <thead>
            <tr>
                <th>Compañía</th>
                <th>Usuario</th>
                <th>Analista</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Super Usuario</th>
                <th>Activo</th>
                <th>Bloqueado</th>
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
  );
}

export default ListaUsuarios;
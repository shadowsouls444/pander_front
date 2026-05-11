import styles from './ListaVacantes.module.css';

function ListaVacantes() {
  return (
    <div className={styles.container}>
      <h1>CRUD de Vacantes</h1>

        <div className={styles.form}>
              <input type="text" placeholder="Buscar vacante..." />
              <button>Buscar</button>
              <button>Crear Nuevo</button>
          </div>
      

     
      <div className={styles.tableContainer}>
        <table className={styles.crudTable}>
          <thead>
            <tr>
               <th>Compañía</th>
                <th>Vacante</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th>Experiencia</th>
                <th>Rango Salarial</th>
                <th>Estado</th>
                <th>Tipo Contrato</th>
                <th>Activa</th>
                <th>Publicada</th>
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

export default ListaVacantes;

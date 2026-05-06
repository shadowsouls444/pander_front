import styles from './List.module.css'

function List() {
    return (
        <table border="1">
            <tr>
                <th>Nombre</th>
                <th>Edad</th>
            </tr>
            <tr>
                <td>Juan</td>
                <td>25</td>
            </tr>
            <tr>
                <td>María</td>
                <td>30</td>
            </tr>
        </table>
    )
}

export default List
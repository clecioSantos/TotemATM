import "./styles.css";

export default function CategoryTable({ categories, onEdit, onDelete }) {
  return (
    <div className="table-card">
      <table className="c-table">
        <thead>
          <tr>
            <th>Nome da Categoria</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>
                <button onClick={() => onEdit(cat)}>Editar</button>
                <button onClick={() => onDelete(cat.id)} style={{color: 'red', marginLeft: '10px'}}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

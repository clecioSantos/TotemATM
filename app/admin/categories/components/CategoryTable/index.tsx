"use client";

import { PermissionGate } from "@/src/components/PermissionGate";
import "./styles.css";

export default function CategoryTable({ categories, onEdit, onDelete }) {
  return (
    <div className="table-card">
      <table className="c-table">
        <thead>
          <tr>
            <th>Nome da Categoria</th>
            <th>Tamanhos</th>
            <th>Sabores</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>
                <span className={`badge ${cat.possuiTamanhos ? 'badge-active' : 'badge-inactive'}`}>
                  {cat.possuiTamanhos ? 'Sim' : 'Não'}
                </span>
              </td>
              <td>
                <span className={`badge ${cat.possuiSabores ? 'badge-active' : 'badge-inactive'}`}>
                  {cat.possuiSabores ? 'Sim' : 'Não'}
                </span>
              </td>
              <td>
                <PermissionGate permission="manageCategories">
                  <button onClick={() => onEdit(cat)}>Editar</button>
                  <button onClick={() => onDelete(cat.id)} style={{color: 'red', marginLeft: '10px'}}>Excluir</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

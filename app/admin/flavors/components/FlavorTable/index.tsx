"use client";

import { CategoryFlavor, Category } from "@totem/shared/types";
import "./styles.css";

interface Props {
  flavors: CategoryFlavor[];
  categories: Category[];
  onEdit: (f: CategoryFlavor) => void;
  onDelete: (id: string) => void;
}

export default function FlavorTable({ flavors, categories, onEdit, onDelete }: Props) {
  return (
    <div className="flavor-table-wrapper">
      <table className="c-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço Extra</th>
            <th>Ordem</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {flavors.map((flavor) => (
            <tr key={flavor.id}>
              <td><strong>{flavor.nome}</strong></td>
              <td>{categories.find(c => c.id === flavor.categoryId)?.name || "N/A"}</td>
              <td className="price-cell">R$ {flavor.preco.toFixed(2)}</td>
              <td>{flavor.ordem}</td>
              <td>
                <span className={`badge ${flavor.ativo ? 'badge-active' : 'badge-inactive'}`}>
                  {flavor.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="actions-cell">
                <button className="btn-action btn-edit" onClick={() => onEdit(flavor)}>Editar</button>
                <button className="btn-action btn-delete" onClick={() => onDelete(flavor.id)}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

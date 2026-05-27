"use client";

import { Condiment } from "../../hooks/useCondiments";
import { Category } from "@totem/shared/types";
import "./styles.css";

interface Props {
  condiments: Condiment[];
  categories: Category[];
  onEdit: (c: Condiment) => void;
  onDelete: (id: string) => void;
}

export default function CondimentTable({ condiments, categories, onEdit, onDelete }: Props) {
  return (
    <div className="condiment-table-wrapper">
      <table className="c-table">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nome</th>
            <th>Categorias Habilitadas</th>
            <th>Preço Extra</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {condiments.map((condiment) => (
            <tr key={condiment.id}>
              <td>
                <div className="table-img-container">
                  <img src={condiment.imageUrl || "https://placehold.co/40x40?text=🧂"} alt={condiment.name} />
                </div>
              </td>
              <td>
                <div className="condiment-info-cell">
                  <strong>{condiment.name}</strong>
                  <p>{condiment.description || "Sem descrição"}</p>
                </div>
              </td>
              <td>
                <div className="categories-badges">
                  {condiment.categoryIds.length > 0 ? condiment.categoryIds.map(id => (
                    <span key={id} className="category-badge">
                      {categories.find(c => c.id === id)?.name || "N/A"}
                    </span>
                  )) : <span className="cat-none">Nenhuma selecionada</span>}
                </div>
              </td>
              <td className="price-cell">R$ {condiment.price.toFixed(2)}</td>
              <td>
                <span className={`badge ${condiment.enabled ? 'badge-active' : 'badge-inactive'}`}>
                  {condiment.enabled ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="actions-cell">
                <button className="btn-action btn-edit" onClick={() => onEdit(condiment)}>Editar</button>
                <button className="btn-action btn-delete" onClick={() => onDelete(condiment.id)}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
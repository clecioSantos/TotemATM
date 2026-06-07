"use client";

import { Product, Category } from '@totem/shared/types';
import { PermissionGate } from '@/src/components/PermissionGate';
import "./styles.css";

interface Props {
  products: Product[];
  categories: Category[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, categories, onEdit, onDelete }: Props) {
  return (
    <div className="product-table-wrapper">
      <table className="p-table">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <img src={product.imageUrl} className="product-img" alt={product.name} />
              </td>
              <td>
                <strong>{product.name}</strong>
              </td>
              <td>
                {categories.find(c => c.id === product.categoryId)?.name || 'Sem categoria'}
              </td>
              <td>R$ {product.price.toFixed(2)}</td>
              <td>
                <span className={`badge ${product.active ? 'badge-active' : 'badge-inactive'}`}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="actions-cell">
                <PermissionGate permission="editProducts">
                  <button className="btn-action btn-edit" onClick={() => onEdit(product)}>Editar</button>
                  <button className="btn-action btn-delete" onClick={() => onDelete(product.id)}>Excluir</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

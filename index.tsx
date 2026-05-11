import React, { ChangeEvent } from 'react';
import { Category } from '../../types';
import './styles.css';

interface CategorySelectProps {
  categories: Category[];
  loading: boolean;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ categories, loading, selectedCategory, onCategoryChange }) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(e.target.value);
  };

  return (
    <select value={selectedCategory} onChange={handleChange} disabled={loading} className="category-select">
      <option value="">{loading ? 'Carregando categorias...' : 'Todas as Categorias'}</option>
      {!loading && categories.length === 0 && (
        <option value="" disabled>Nenhuma categoria disponível</option>
      )}
      {categories.map(category => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </select>
  );
};

export default CategorySelect;
import React, { useState } from 'react';
import ProductTable from './components/ProductTable';
import ProductModal from './components/ProductModal';
import ProductFilters from './components/ProductFilters';
import { Product } from './types';
import { useProducts } from './hooks/useProducts';
import { useCategories } from './hooks/useCategories';
import './page.css';

const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading: productsLoading, error: productsError } = useProducts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [featuredFilter, setFeaturedFilter] = useState<boolean | undefined>(undefined);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (product: Product) => {
    if (editingProduct) {
      await updateProduct(product);
    } else {
      await addProduct(product);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
    const matchesActive = activeFilter !== undefined ? product.active === activeFilter : true;
    const matchesFeatured = featuredFilter !== undefined ? product.featured === featuredFilter : true;
    return matchesSearch && matchesCategory && matchesActive && matchesFeatured;
  });

  const loading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;

  return (
    <div className="products-page-container">
      <header className="products-page-header">
        <h1 className="products-page-title">Gerenciamento de Produtos</h1>
        <button className="products-page-add-button" onClick={handleAddProduct}>
          + Adicionar Produto
        </button>
      </header>

      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        featuredFilter={featuredFilter}
        setFeaturedFilter={setFeaturedFilter}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

      {loading && <div className="loading-state">Carregando produtos...</div>}
      {error && <div className="error-state">Erro: {error.message}</div>}
      {!loading && !error && (
        <ProductTable
          products={filteredProducts}
          categories={categories}
          onEdit={handleEditProduct}
          onDelete={deleteProduct}
        />
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />
    </div>
  );
};

export default ProductsPage;
```
```diff
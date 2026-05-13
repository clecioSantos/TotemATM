import { useState, useMemo } from 'react';
import { Product } from '../../../../totem/app/index';
import { useProducts } from './useProducts';
import { useCategories } from './useCategories';

export const useProductsPage = () => {
  const { products, saveProduct, removeProduct, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

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

  const handleSaveProduct = async (productData: Partial<Product>, file?: File) => {
    await saveProduct(productData, file);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
      const matchesActive = activeFilter !== undefined ? product.active === activeFilter : true;
      const matchesFeatured = featuredFilter !== undefined ? product.featured === featuredFilter : true;
      return matchesSearch && matchesCategory && matchesActive && matchesFeatured;
    });
  }, [products, searchTerm, selectedCategory, activeFilter, featuredFilter]);

  const loading = productsLoading || categoriesLoading;

  return {
    products: filteredProducts,
    categories,
    loading,
    isModalOpen,
    editingProduct,
    searchTerm,
    selectedCategory,
    activeFilter,
    featuredFilter,
    handlers: { 
        setSearchTerm, 
        setSelectedCategory, 
        setActiveFilter, 
        setFeaturedFilter, 
        setIsModalOpen, 
        handleAddProduct, 
        handleEditProduct, 
        handleSaveProduct, 
        removeProduct 
    }
  };
};
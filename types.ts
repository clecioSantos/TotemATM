import { Category } from '../../types';

export interface CategorySelectProps {
  categories: Category[];
  loading: boolean;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}
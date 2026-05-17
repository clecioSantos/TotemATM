'use client';

import { Product } from './packages/shared/src/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCartStore } from '../store/cartStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-gray-100 p-4 flex flex-col items-center text-center cursor-pointer hover:border-red-500 transition-colors"
      onClick={() => addItem(product, 1)}
    >
      <div className="relative w-40 h-40 mb-4">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain"
          priority
        />
      </div>
      
      <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
      
      <div className="mt-auto w-full flex items-center justify-between">
        <span className="text-2xl font-black text-red-600">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
        </span>
        <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};
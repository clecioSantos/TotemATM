'use client';

import { Product } from '@totem/shared/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCartStore } from 'cartStore';

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
      className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 p-4 flex flex-row items-center cursor-pointer transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
      onClick={() => addItem(product, 1)}
    >
      <div className="relative w-[35%] aspect-square shrink-0 rounded-2xl overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <div className="flex-1 ml-4 flex flex-col justify-center">
        <h3 className="text-[18px] font-bold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-[14px] text-gray-500 mb-2 line-clamp-2">{product.description}</p>
        <span className="text-[22px] font-bold text-red-600">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
        </span>
      </div>
 
    </motion.div>
  );
};
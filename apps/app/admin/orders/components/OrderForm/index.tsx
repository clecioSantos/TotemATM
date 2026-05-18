"use client";

import { useState } from "react";
import { Product, OrderLineItem, OrderFormPayload } from "@totem/shared/types";
import styles from "./OrderForm.module.css";

interface Props {
  products: Product[];
  onSubmit: (order: OrderFormPayload) => Promise<void>;
  onClose: () => void;
}

export default function OrderForm({ products, onSubmit, onClose }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState<OrderLineItem[]>([]);
  
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentObservation, setCurrentObservation] = useState("");

  const handleAddItem = () => {
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;

    const newItem: OrderLineItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: currentQuantity,
      observation: currentObservation
    };

    setSelectedItems([...selectedItems, newItem]);
    
    setCurrentProductId("");
    setCurrentQuantity(1);
    setCurrentObservation("");
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const total = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert("Adicione pelo menos um item ao pedido");
      return;
    }

    const payload: OrderFormPayload = {
      customerName,
      tableNumber,
      items: selectedItems,
      total,
      status: "pending"
    };

    await onSubmit(payload);
  };

  return (
    <form className={styles.orderForm} onSubmit={handleSubmit}>
      <div className={styles.formSection}>
        <h3>Identificação</h3>
        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label>Cliente</label>
            <input 
              className={styles.formInput} 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              placeholder="Nome do cliente"
            required />
          </div>
          <div className={styles.inputGroup}>
            <label>Mesa/Local</label>
            <input 
              className={styles.formInput} 
              value={tableNumber} 
              onChange={e => setTableNumber(e.target.value)} 
              placeholder="Ex: 04"
            required />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3>Adicionar Produtos</h3>
        <div className={styles.addItemBox}>
          <select 
            className={styles.formInput} 
            value={currentProductId} 
            onChange={e => setCurrentProductId(e.target.value)}
          >
            <option value="">Selecionar Produto...</option>
            {products.filter(p => p.active !== false).map(p => (
              <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>
            ))}
          </select>
          
          <div className={styles.itemControls}>
            <input 
              type="number" 
              className={`${styles.formInput} ${styles.qtyInput}`} 
              value={currentQuantity} 
              min="1" 
              onChange={e => setCurrentQuantity(Number(e.target.value))}
            />
            <input 
              className={`${styles.formInput} ${styles.obsInput}`} 
              value={currentObservation} 
              onChange={e => setCurrentObservation(e.target.value)} 
              placeholder="Obs: Sem cebola, mal passado..."
            />
            <button type="button" className={styles.addItemBtn} onClick={handleAddItem} disabled={!currentProductId}>➕</button>
          </div>
        </div>
      </div>

      <div className={`${styles.formSection} ${styles.resumen}`}>
        <h3>Itens Selecionados ({selectedItems.length})</h3>
        <div className={styles.selectedItemsList}>
          {selectedItems.map((item, index) => (
            <div key={index} className={styles.selectedItemCard}>
              <div className={styles.itemHeader}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemQuantity}>{item.quantity}x</span>
                  <strong className={styles.itemName}>{item.name}</strong>
                </div>
                <span className={styles.itemPrice}>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
              {item.observation && <p className={styles.itemObs}>"{item.observation}"</p>}
              <button type="button" className={styles.removeItem} onClick={() => removeItem(index)}>Remover</button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formFooter}>
        <div className={styles.totalArea}>
          <span>Total do Pedido:</span>
          <strong>R$ {total.toFixed(2)}</strong>
        </div>
        <div className={styles.footerActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" className={styles.submitOrderBtn}>Finalizar Pedido</button>
        </div>
      </div>
    </form>
  );
}

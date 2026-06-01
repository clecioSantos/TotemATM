"use client";

import { useState, useEffect } from "react";
import { Product, OrderLineItem, OrderFormPayload, Condiment } from "@totem/shared/types";
import styles from "./OrderForm.module.css";
import { Plus, Trash2, Check } from "lucide-react";

interface Props {
  products: Product[];
  condiments: Condiment[];
  onSubmit: (order: OrderFormPayload) => Promise<void>;
  onClose: () => void;
}

export default function OrderForm({ products, condiments, onSubmit, onClose }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState<OrderLineItem[]>([]);
  
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentObservation, setCurrentObservation] = useState("");
  const [selectedCondimentIds, setSelectedCondimentIds] = useState<string[]>([]);

  const product = products.find(p => p.id === currentProductId);
  const availableCondiments = product 
    ? condiments.filter(c => c.enabled && c.categoryIds?.includes(product.categoryId))
    : [];

  // Logs de Depuração
  useEffect(() => {
    if (currentProductId) {
      console.log("🔍 [OrderForm] Produto:", product?.name, "ID Categoria:", product?.categoryId);
      console.log("🧂 [OrderForm] Total de Condimentos no sistema:", condiments.length);
      condiments.forEach(c => console.log(`   - Adicional: ${c.name}, Habilitado: ${c.enabled}, Categorias permitidas:`, c.categoryIds));
      console.log("✅ [OrderForm] Adicionais filtrados para este produto:", availableCondiments.map(c => c.name));
      
      if (availableCondiments.length === 0 && condiments.length > 0) {
        console.warn("⚠️ [AVISO] Nenhum condimento tem o ID da categoria", product?.categoryId, "em sua lista 'categoryIds'.");
      }
    }
  }, [currentProductId, product, condiments, availableCondiments]);

  const handleAddItem = () => {
    if (!product) return;

    const itemCondiments = condiments.filter(c => selectedCondimentIds.includes(c.id));

    const newItem: OrderLineItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: currentQuantity,
      observation: currentObservation,
      condiments: itemCondiments
    };

    setSelectedItems([...selectedItems, newItem]);
    
    setCurrentProductId("");
    setCurrentQuantity(1);
    setCurrentObservation("");
    setSelectedCondimentIds([]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const total = selectedItems.reduce((acc, item) => {
    const condimentsTotal = item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
    return acc + ((item.price + condimentsTotal) * item.quantity);
  }, 0);

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
          {availableCondiments.length > 0 && (
            <div className={styles.condimentsSelection} style={{ marginTop: '15px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>Adicionais disponíveis para este item:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableCondiments.map(cond => (
                  <div 
                    key={cond.id}
                    onClick={() => {
                      setSelectedCondimentIds(prev => 
                        prev.includes(cond.id) ? prev.filter(id => id !== cond.id) : [...prev, cond.id]
                      );
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '2px solid',
                      transition: 'all 0.2s',
                      backgroundColor: selectedCondimentIds.includes(cond.id) ? '#ffbc0d' : '#f5f5f5',
                      borderColor: selectedCondimentIds.includes(cond.id) ? '#ffbc0d' : '#eee',
                      fontWeight: selectedCondimentIds.includes(cond.id) ? 'bold' : 'normal'
                    }}
                  >
                    {cond.name} (+ R$ {cond.price.toFixed(2)})
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong className={styles.itemName}>{item.name}</strong>
                    {item.condiments && item.condiments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                        {item.condiments.map(c => (
                          <span key={c.id} style={{ fontSize: '10px', color: '#666', backgroundColor: '#fff9c4', padding: '0 4px', borderRadius: '4px' }}>
                            + {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className={styles.itemPrice}>
                  R$ {((item.price + (item.condiments?.reduce((s, c) => s + c.price, 0) || 0)) * item.quantity).toFixed(2)}
                </span>
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

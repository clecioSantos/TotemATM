"use client";

import { useState, useEffect } from "react";
import { Product, OrderLineItem, OrderFormPayload, Condiment, Category, CategoryFlavor, SelectedFlavor } from "@totem/shared/types";
import { RequiredGroup, RequiredItem } from "@totem/shared/types/required-groups";
import styles from "./OrderForm.module.css";
import { Plus, Trash2, Check, X } from "lucide-react";
import { useConfirm } from "@/app/components/ConfirmProvider";
import { collection, query, where, getDocs } from "firebase/firestore";
import { orderBy } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

interface Props {
  products: Product[];
  condiments: Condiment[];
  onSubmit: (order: OrderFormPayload) => Promise<void>;
  onClose: () => void;
}

export default function OrderForm({ products, condiments, onSubmit, onClose }: Props) {
  const { showAlert } = useConfirm();
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState<OrderLineItem[]>([]);

  const [currentProductId, setCurrentProductId] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentObservation, setCurrentObservation] = useState("");

  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<SelectedFlavor[]>([]);
  const [selectedCondimentIds, setSelectedCondimentIds] = useState<string[]>([]);
  const [requiredSelections, setRequiredSelections] = useState<Record<string, string[]>>({});
  const [requiredGroups, setRequiredGroups] = useState<RequiredGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flavors, setFlavors] = useState<CategoryFlavor[]>([]);

  useEffect(() => {
    getDocs(collection(firestore, "categories")).then(snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }).catch(() => {});
    getDocs(collection(firestore, "flavors")).then(snap => {
      setFlavors(snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryFlavor)));
    }).catch(() => {});
  }, []);

  const product = products.find(p => p.id === currentProductId);
  const category = product ? categories.find(c => c.id === product.categoryId) : null;
  const productSizes = product?.sizes || [];
  const categoryFlavors = category ? flavors.filter(f => f.ativo !== false && f.categoryId === category.id) : [];
  const availableCondiments = product
    ? condiments.filter(c => c.enabled !== false && c.categoryIds?.includes(product.categoryId))
    : [];

  const currentSize = selectedSizeIdx != null ? productSizes[selectedSizeIdx] : null;
  const maxFlavors = currentSize?.quantidadeSabores || 0;

  useEffect(() => {
    if (!product) { setRequiredGroups([]); return; }
    const fetchGroups = async () => {
      try {
        const q = query(collection(firestore, "requiredGroups"), where("productId", "==", product.id));
        const snap = await getDocs(q);
        const groups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const withItems = await Promise.all(groups.map(async (g: any) => {
          const itemsSnap = await getDocs(
            query(collection(firestore, "requiredItems"), where("groupId", "==", g.id))
          );
          return { ...g, items: itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })) };
        }));
        setRequiredGroups(withItems.filter((g: any) => g.active !== false));
      } catch { setRequiredGroups([]); }
    };
    fetchGroups();
  }, [product?.id]);

  useEffect(() => {
    setSelectedSizeIdx(null);
    setSelectedFlavors([]);
    setRequiredSelections({});
    setSelectedCondimentIds([]);
    setCurrentQuantity(1);
    setCurrentObservation("");
  }, [currentProductId]);

  const toggleCondiment = (id: string) => {
    setSelectedCondimentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleRequiredItem = (groupKey: string, itemName: string) => {
    setRequiredSelections(prev => {
      const current = prev[groupKey] || [];
      if (current.includes(itemName)) return { ...prev, [groupKey]: current.filter(x => x !== itemName) };
      return { ...prev, [groupKey]: [...current, itemName] };
    });
  };

  const isRequiredValid = () => {
    return requiredGroups.every(group => {
      const groupKey = group.name;
      const count = (requiredSelections[groupKey] || []).length;
      const minQty = group.minQuantity ?? 0;
      const maxQty = group.maxQuantity ?? 99;
      if (group.rule === "EXACTLY") return count === maxQty;
      if (group.rule === "MIN") return count >= minQty;
      if (group.rule === "MAX") return count <= maxQty;
      if (group.rule === "BETWEEN") return count >= minQty && count <= maxQty;
      return true;
    });
  };

  const handleAddItem = () => {
    if (!product) return;

    if (productSizes.length > 0 && selectedSizeIdx == null) {
      showAlert("Selecione um tamanho");
      return;
    }

    if (!isRequiredValid()) {
      showAlert("Preencha todos os grupos obrigatórios");
      return;
    }

    const itemCondiments = condiments.filter(c => selectedCondimentIds.includes(c.id));
    const selectedRequiredItemsData = requiredGroups.map(group => ({
      groupName: group.name,
      items: (requiredSelections[group.name] || []).map(name => {
        const item = group.items?.find(i => i.name === name);
        return { name, additionalPrice: item?.additionalPrice || 0 };
      }),
    })).filter(g => g.items.length > 0);

    const basePrice = currentSize ? currentSize.preco : product.price;
    const flavorsTotal = selectedFlavors.reduce((s, f) => s + f.preco, 0);

    const newItem: Record<string, unknown> = {
      productId: product.id,
      name: product.name,
      price: basePrice + flavorsTotal,
      quantity: currentQuantity,
      observation: currentObservation || "",
      condiments: itemCondiments,
    };
    if (currentSize) {
      newItem.tamanhoSelecionado = { id: String(selectedSizeIdx), nome: currentSize.nome, preco: currentSize.preco };
    }
    if (selectedFlavors.length > 0) {
      newItem.saboresSelecionados = selectedFlavors;
    }
    if (selectedRequiredItemsData.length > 0) {
      newItem.selectedRequiredItems = selectedRequiredItemsData;
    }

    setSelectedItems([...selectedItems, newItem as unknown as OrderLineItem]);

    setCurrentProductId("");
    setSelectedSizeIdx(null);
    setSelectedFlavors([]);
    setRequiredSelections({});
    setSelectedCondimentIds([]);
    setCurrentQuantity(1);
    setCurrentObservation("");
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const total = selectedItems.reduce((acc, item) => {
    const condimentsTotal = item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
    const requiredTotal = item.selectedRequiredItems?.reduce((s, rg) => s + rg.items.reduce((ss, i) => ss + (Number(i.additionalPrice) || 0), 0), 0) || 0;
    const unitPrice = (item.price || 0) + condimentsTotal + requiredTotal;
    return acc + unitPrice * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      showAlert("Adicione pelo menos um item ao pedido");
      return;
    }

    const payload: OrderFormPayload = {
      customerName,
      tableNumber,
      items: selectedItems,
      total,
      status: "paid",
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
            <input className={styles.formInput} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome do cliente" required />
          </div>
          <div className={styles.inputGroup}>
            <label>Mesa/Local</label>
            <input className={styles.formInput} value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Ex: 04" required />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3>Adicionar Produtos</h3>
        <div className={styles.addItemBox}>
          <select className={styles.formInput} value={currentProductId} onChange={e => setCurrentProductId(e.target.value)}>
            <option value="">Selecionar Produto...</option>
            {products.filter(p => p.active !== false).map(p => (
              <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>
            ))}
          </select>

          {product && (
            <div style={{ marginTop: 16 }}>
              {/* Tamanhos */}
              {productSizes.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 8 }}>Tamanhos</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {productSizes.map((s, i) => (
                      <button key={i} type="button" onClick={() => { setSelectedSizeIdx(i); setSelectedFlavors([]); }}
                        style={{
                          padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "2px solid",
                          backgroundColor: selectedSizeIdx === i ? "#ffbc0d" : "#f5f5f5",
                          borderColor: selectedSizeIdx === i ? "#ffbc0d" : "#eee",
                          fontWeight: selectedSizeIdx === i ? "bold" : "normal",
                        }}>
                        {s.nome} {s.preco > 0 ? `R$ ${s.preco.toFixed(2)}` : "Grátis"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sabores */}
              {maxFlavors > 0 && categoryFlavors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 8 }}>
                    Sabores (até {maxFlavors})
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {categoryFlavors.map(f => {
                      const isSelected = selectedFlavors.some(x => x.id === f.id);
                      const atLimit = !isSelected && selectedFlavors.length >= maxFlavors;
                      return (
                        <button key={f.id} type="button" disabled={atLimit} onClick={() => {
                          setSelectedFlavors(prev =>
                            isSelected ? prev.filter(x => x.id !== f.id)
                              : prev.length < maxFlavors ? [...prev, { id: f.id, nome: f.nome, preco: f.preco }] : prev
                          );
                        }}
                          style={{
                            padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: atLimit ? "not-allowed" : "pointer",
                            border: "2px solid", opacity: atLimit ? 0.5 : 1,
                            backgroundColor: isSelected ? "#ffbc0d" : "#f5f5f5",
                            borderColor: isSelected ? "#ffbc0d" : "#eee",
                            fontWeight: isSelected ? "bold" : "normal",
                          }}>
                          {f.nome}{f.preco > 0 ? ` (+R$ ${f.preco.toFixed(2)})` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grupos Obrigatórios */}
              {requiredGroups.length > 0 && requiredGroups.map(group => {
                const groupKey = group.name;
                const selections = requiredSelections[groupKey] || [];
                const items: RequiredItem[] = group.items || [];
                const isSingle = group.rule === "EXACTLY" && (group.maxQuantity || 1) === 1;

                return (
                  <div key={groupKey} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 4 }}>
                      {group.name}
                      <span style={{ fontSize: 10, color: "#999", fontWeight: "normal", marginLeft: 8 }}>
                        {group.rule === "EXACTLY" ? `selecione ${group.maxQuantity}` : group.rule === "MIN" ? `mín. ${group.minQuantity}` : group.rule === "MAX" ? `máx. ${group.maxQuantity}` : `de ${group.minQuantity} a ${group.maxQuantity}`}
                      </span>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {items.filter(i => i.available !== false).map(item => {
                        const isSelected = selections.includes(item.name);
                        const atLimit = !isSelected && selections.length >= (group.maxQuantity || 99);
                        return (
                          <button key={item.name} type="button" disabled={atLimit && !isSingle} onClick={() => {
                            if (isSingle) {
                              setRequiredSelections(prev => ({ ...prev, [groupKey]: selections.includes(item.name) ? [] : [item.name] }));
                            } else {
                              toggleRequiredItem(groupKey, item.name);
                            }
                          }}
                            style={{
                              padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: atLimit && !isSingle ? "not-allowed" : "pointer",
                              border: "2px solid", opacity: atLimit && !isSingle ? 0.5 : 1,
                              backgroundColor: isSelected ? "#ffbc0d" : "#f5f5f5",
                              borderColor: isSelected ? "#ffbc0d" : "#eee",
                              fontWeight: isSelected ? "bold" : "normal",
                            }}>
                            {item.name}{item.additionalPrice > 0 ? ` (+R$ ${item.additionalPrice.toFixed(2)})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Adicionais */}
              {availableCondiments.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 8 }}>Adicionais</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {availableCondiments.map(cond => (
                      <div key={cond.id} onClick={() => toggleCondiment(cond.id)}
                        style={{
                          padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "2px solid",
                          backgroundColor: selectedCondimentIds.includes(cond.id) ? "#ffbc0d" : "#f5f5f5",
                          borderColor: selectedCondimentIds.includes(cond.id) ? "#ffbc0d" : "#eee",
                          fontWeight: selectedCondimentIds.includes(cond.id) ? "bold" : "normal",
                        }}>
                        {cond.name} (+R$ {cond.price.toFixed(2)})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantidade */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: "bold", color: "#666" }}>Qtd:</label>
                <button type="button" onClick={() => setCurrentQuantity(Math.max(1, currentQuantity - 1))}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 16 }}>−</button>
                <span style={{ fontSize: 16, fontWeight: "bold", minWidth: 24, textAlign: "center" }}>{currentQuantity}</span>
                <button type="button" onClick={() => setCurrentQuantity(currentQuantity + 1)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>

              {/* Observação */}
              <input className={styles.formInput} value={currentObservation} onChange={e => setCurrentObservation(e.target.value)}
                placeholder="Observação..." style={{ marginBottom: 12, width: "100%" }} />

              <button type="button" className={styles.addItemBtn} onClick={handleAddItem} disabled={!currentProductId}
                style={{ width: "100%" }}>
                <Plus size={16} /> Adicionar Item
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.formSection} ${styles.resumen}`}>
        <h3>Itens Selecionados ({selectedItems.length})</h3>
        <div className={styles.selectedItemsList}>
          {selectedItems.map((item, index) => {
            const condimentsTotal = item.condiments?.reduce((s, c) => s + c.price, 0) || 0;
            const flavorsTotal = item.saboresSelecionados?.reduce((s, f) => s + f.preco, 0) || 0;
            const requiredTotal = item.selectedRequiredItems?.reduce((s, rg) => s + rg.items.reduce((ss, i) => ss + (Number(i.additionalPrice) || 0), 0), 0) || 0;
            return (
              <div key={index} className={styles.selectedItemCard}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemQuantity}>{item.quantity}x</span>
                    <div>
                      <strong className={styles.itemName}>{item.name}</strong>
                      {item.tamanhoSelecionado && <span style={{ fontSize: 11, color: "#666", display: "block" }}>{item.tamanhoSelecionado.nome}</span>}
                      {item.saboresSelecionados && item.saboresSelecionados.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                          {item.saboresSelecionados.map(f => <span key={f.id} style={{ fontSize: 10, background: "#fef3c7", padding: "0 4px", borderRadius: 4 }}>{f.nome}</span>)}
                        </div>
                      )}
                      {item.condiments && item.condiments.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                          {item.condiments.map(c => <span key={c.id} style={{ fontSize: 10, color: "#666", backgroundColor: "#fff9c4", padding: "0 4px", borderRadius: 4 }}>+ {c.name}</span>)}
                        </div>
                      )}
                      {item.selectedRequiredItems && item.selectedRequiredItems.map(rg => (
                        <div key={rg.groupName} style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: "bold", color: "#6b7280" }}>{rg.groupName}: </span>
                          {rg.items.map((i, ii) => (
                            <span key={ii} style={{ fontSize: 10, background: "#fef3c7", padding: "0 4px", borderRadius: 4, marginRight: 4 }}>{i.name}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className={styles.itemPrice}>
                    R$ {((item.price + condimentsTotal) * item.quantity).toFixed(2)}
                  </span>
                </div>
                {item.observation && <p className={styles.itemObs}>"{item.observation}"</p>}
                <button type="button" className={styles.removeItem} onClick={() => removeItem(index)}>
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            );
          })}
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

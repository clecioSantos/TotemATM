"use client";

import { useState, useEffect } from "react";
import { addDoc, collection, onSnapshot, query, where, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { Product, Category, ProductSize, RequiredGroup, RequiredItem, RequiredGroupRule } from '@totem/shared/types';
import { useAuth } from "@totem/shared/types/AuthProvider";
import { Plus, Trash2, Camera, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import "./styles.css";

interface Props {
  initialData?: Product | null;
  categories: Category[];
  selectedCategoryId: string;
  onSubmit: (data: Partial<Product>, file?: File) => Promise<void>;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseCurrencyInput = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '');
  return Number(digits) / 100;
};

export default function ProductForm({ initialData, categories, selectedCategoryId, onSubmit }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [description, setDescription] = useState(initialData?.description || "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [sizes, setSizes] = useState<ProductSize[]>(initialData?.sizes || []);
  const [dayPromotions, setDayPromotions] = useState<{ dayOfWeek: number; discountPercent: number }[]>(initialData?.dayPromotions || []);

  const [requiredGroups, setRequiredGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (!initialData?.id) { setRequiredGroups([]); return; }
    setLoadingGroups(true);
    const unsub = onSnapshot(
      query(collection(firestore, "requiredGroups"), where("productId", "==", initialData.id)),
      async (snap) => {
        const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const groupsWithItems = await Promise.all(groups.map(async (g: any) => {
          const itemsSnap = await getDocs(
            query(collection(firestore, "requiredItems"), where("groupId", "==", g.id), ...([] as any[]))
          );
          const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          return { ...g, items: items.sort((a: any, b: any) => a.order - b.order) };
        }));
        setRequiredGroups(groupsWithItems.sort((a: any, b: any) => a.order - b.order));
        setLoadingGroups(false);
      },
      () => setLoadingGroups(false)
    );
    return () => unsub();
  }, [initialData?.id]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const addSize = () => setSizes(prev => [...prev, { nome: "", preco: 0 }]);
  const removeSize = (index: number) => setSizes(prev => prev.filter((_, i) => i !== index));
  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    if (field === 'preco') {
      const numeric = parseCurrencyInput(value as string);
      setSizes(prev => prev.map((s, i) => i === index ? { ...s, preco: numeric } : s));
      return;
    }
    setSizes(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addDayPromo = () => setDayPromotions(prev => [...prev, { dayOfWeek: 1, discountPercent: 0 }]);
  const removeDayPromo = (index: number) => setDayPromotions(prev => prev.filter((_, i) => i !== index));
  const updateDayPromo = (index: number, field: 'dayOfWeek' | 'discountPercent', value: number) =>
    setDayPromotions(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));

  const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  const addGroup = () => {
    setRequiredGroups(prev => [...prev, {
      id: `new-${Date.now()}`,
      name: "",
      rule: "EXACTLY" as RequiredGroupRule,
      minQuantity: 1,
      maxQuantity: 1,
      order: prev.length,
      active: true,
      items: [],
    }]);
  };

  const updateGroup = (index: number, field: string, value: any) => {
    setRequiredGroups(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };

  const removeGroup = (index: number) => {
    const group = requiredGroups[index];
    if (group.id && !group.id.startsWith("new-")) {
      deleteDoc(doc(firestore, "requiredGroups", group.id)).catch(() => {});
      group.items?.forEach((item: any) => {
        if (item.id) deleteDoc(doc(firestore, "requiredItems", item.id)).catch(() => {});
      });
    }
    setRequiredGroups(prev => prev.filter((_, i) => i !== index));
  };

  const addItemToGroup = (groupIndex: number) => {
    setRequiredGroups(prev => prev.map((g, i) => i === groupIndex ? {
      ...g,
      items: [...(g.items || []), { id: `new-${Date.now()}`, name: "", additionalPrice: 0, order: (g.items?.length || 0), available: true }]
    } : g));
  };

  const updateItem = (groupIndex: number, itemIndex: number, field: string, value: any) => {
    setRequiredGroups(prev => prev.map((g, gi) => gi === groupIndex ? {
      ...g,
      items: g.items.map((item: any, ii: number) => ii === itemIndex ? { ...item, [field]: value } : item)
    } : g));
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const item = requiredGroups[groupIndex]?.items?.[itemIndex];
    if (item?.id && !item.id.startsWith("new-")) {
      deleteDoc(doc(firestore, "requiredItems", item.id)).catch(() => {});
    }
    setRequiredGroups(prev => prev.map((g, gi) => gi === groupIndex ? {
      ...g,
      items: g.items.filter((_: any, ii: number) => ii !== itemIndex)
    } : g));
  };

  const moveItem = (groupIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    setRequiredGroups(prev => prev.map((g, gi) => {
      if (gi !== groupIndex) return g;
      const items = [...g.items];
      const target = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (target < 0 || target >= items.length) return g;
      [items[itemIndex], items[target]] = [items[target], items[itemIndex]];
      return { ...g, items };
    }));
  };

  const saveGroupsAndItems = async (productId: string) => {
    for (let i = 0; i < requiredGroups.length; i++) {
      const group = requiredGroups[i];
      const validSizes = (sizes || []).filter((s: any) => s.nome.trim());
      const sizeOverrides = (group.sizeOverrides || []).filter(
        (o: any) => o.sizeName && validSizes.some((s: any) => s.nome === o.sizeName)
      );

      const groupData: Record<string, any> = {
        companyId: user?.companyId,
        productId,
        name: group.name,
        rule: group.rule,
        minQuantity: Number(group.minQuantity) || 0,
        maxQuantity: Number(group.maxQuantity) || 0,
        order: i,
        active: group.active,
      };

      if (sizeOverrides.length > 0) {
        groupData.sizeOverrides = sizeOverrides;
      } else {
        groupData.sizeOverrides = [];
      }

      let groupId = group.id;
      if (groupId?.startsWith("new-")) {
        const ref = await addDoc(collection(firestore, "requiredGroups"), groupData);
        groupId = ref.id;
      } else if (groupId) {
        await updateDoc(doc(firestore, "requiredGroups", groupId), groupData);
      }

      if (group.items) {
        for (let j = 0; j < group.items.length; j++) {
          const item = group.items[j];
          const itemData = {
            groupId,
            name: item.name,
            additionalPrice: Number(item.additionalPrice) || 0,
            order: j,
            available: item.available !== false,
            description: item.description || "",
          };
          if (item.id?.startsWith("new-")) {
            await addDoc(collection(firestore, "requiredItems"), itemData);
          } else if (item.id) {
            await updateDoc(doc(firestore, "requiredItems", item.id), itemData);
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Partial<Product> = {
      name, price: Number(price), categoryId: selectedCategoryId, description, active, featured,
      imageUrl: initialData?.imageUrl,
      sizes: sizes.filter(s => s.nome.trim()),
      dayPromotions: dayPromotions.filter(p => p.discountPercent > 0),
    };
    if (initialData?.id) productData.id = initialData.id;

    // Save product first, then groups
    await onSubmit(productData, imageFile);
    // After product is saved with ID, save groups
    if ((window as any).__lastSavedProductId) {
      await saveGroupsAndItems((window as any).__lastSavedProductId);
    } else if (initialData?.id) {
      await saveGroupsAndItems(initialData.id);
    }
  };

  const ruleLabel: Record<string, string> = {
    EXACTLY: "Selecionar exatamente",
    MIN: "Mínimo",
    MAX: "Máximo",
    BETWEEN: "Entre",
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="flex gap-6 pb-3">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${active ? 'bg-orange-500' : 'bg-gray-300'}`}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="sr-only" />
            <span className={`absolute w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
          <span className="text-sm font-medium text-gray-700">Produto Ativo</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${featured ? 'bg-orange-500' : 'bg-gray-300'}`}>
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="sr-only" />
            <span className={`absolute w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
          <span className="text-sm font-medium text-gray-700">Produto em Destaque</span>
        </label>
      </div>

      <div className="input-group">
        <label>Nome do Produto</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div className="input-group">
        <label>Preço Base (R$)</label>
        <input className="form-input" type="text" inputMode="numeric" value={formatCurrency(price)}
          onChange={e => setPrice(parseCurrencyInput(e.target.value))} required />
      </div>

      <div className="input-group">
        <label>Descrição</label>
        <textarea className="form-input form-textarea" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {/* Imagem */}
      <div className="input-group">
        <label>Imagem do Produto</label>
        <div className="flex items-center gap-4">
          {initialData?.imageUrl && !imageFile && (
            <img src={initialData.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
          )}
          {imageFile && (
            <img src={URL.createObjectURL(imageFile)} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
          )}
          <label className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors flex-1">
            <Camera size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">{imageFile ? "Trocar foto" : initialData?.imageUrl ? "Trocar foto" : "Selecionar foto"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      <div className="sizes-section">
          <div className="sizes-header">
            <button type="button" onClick={addSize} className="add-size-btn">+ Adicionar Tamanho</button>
            <label>Tamanhos</label>
          </div>
          {sizes.length === 0 && <p className="sizes-empty">Nenhum tamanho cadastrado.</p>}
          {sizes.map((size, index) => (
            <div key={index} className="size-entry">
              <div className="size-entry-fields">
                <div className="size-field">
                  <label className="size-field-label">Nome</label>
                  <input className="form-input" placeholder="Ex: Pequena" value={size.nome}
                    onChange={e => updateSize(index, 'nome', e.target.value)} />
                </div>
                <div className="size-field">
                  <label className="size-field-label">Preço (R$)</label>
                  <input className="form-input" type="text" inputMode="numeric" placeholder="0,00"
                    value={formatCurrency(size.preco)} onChange={e => updateSize(index, 'preco', e.target.value)} />
                </div>
              </div>
              <button type="button" className="remove-size-btn" onClick={() => removeSize(index)}>✕</button>
            </div>
          ))}
        </div>

      {/* ─── Promoção por Dia da Semana ─── */}
      <div className="sizes-section">
          <div className="sizes-header">
            <button type="button" onClick={addDayPromo} className="add-size-btn">+ Adicionar Dia</button>
            <label><Sparkles size={14} className="inline align-middle mr-1 text-orange-500" />Promoção por Dia</label>
          </div>
          <p className="sizes-empty">Defina descontos percentuais que se aplicam automaticamente em dias específicos da semana.</p>
          {dayPromotions.map((promo, index) => (
            <div key={index} className="size-entry">
              <div className="size-entry-fields">
                <div className="size-field">
                  <label className="size-field-label">Dia</label>
                  <select className="form-input" value={promo.dayOfWeek}
                    onChange={e => updateDayPromo(index, 'dayOfWeek', Number(e.target.value))}>
                    {weekDays.map((name, i) => (<option key={i} value={i}>{name}</option>))}
                  </select>
                </div>
                <div className="size-field">
                  <label className="size-field-label">Desconto (%)</label>
                  <input className="form-input" type="number" min="0" max="100" placeholder="0"
                    value={promo.discountPercent}
                    onChange={e => updateDayPromo(index, 'discountPercent', Number(e.target.value))} />
                </div>
              </div>
              <button type="button" className="remove-size-btn" onClick={() => removeDayPromo(index)}>✕</button>
            </div>
          ))}
        </div>

      {/* ─── Obrigatórios do Produto ─── */}
      <div className="sizes-section">
        <div className="sizes-header">
          <button type="button" onClick={addGroup} className="add-size-btn">+ Novo Obrigatório</button>
          <label>Obrigatórios</label>
        </div>
        <p className="sizes-empty" style={{ marginBottom: 12 }}>Itens que o cliente DEVE escolher (ex: sabores, borda, proteína).</p>

        {loadingGroups && <p className="sizes-empty">Carregando...</p>}

        {requiredGroups.map((group, gi) => (
          <div key={gi} className="size-entry" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6', marginBottom: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="size-field-label" style={{ fontSize: 13 }}>Obrigatório #{gi + 1}</span>
              <button type="button" onClick={() => removeGroup(gi)} className="remove-size-btn" title="Remover grupo">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="size-field-label">Nome</label>
                <input className="form-input" placeholder="Ex: Escolha os sabores" value={group.name}
                  onChange={e => updateGroup(gi, 'name', e.target.value)} />
              </div>
              <div>
                <label className="size-field-label">Regra</label>
                <select className="form-input" value={group.rule} onChange={e => updateGroup(gi, 'rule', e.target.value)}>
                  <option value="EXACTLY">Exatamente</option>
                  <option value="MIN">Mínimo</option>
                  <option value="MAX">Máximo</option>
                  <option value="BETWEEN">Entre</option>
                </select>
              </div>
            </div>

            {/* Campos de quantidade — ocultos quando há tamanhos, pois só os overrides importam */}
            {sizes.filter(s => s.nome.trim()).length === 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {group.rule === 'BETWEEN' && (
                  <>
                    <div>
                      <label className="size-field-label">Mínimo</label>
                      <input className="form-input" type="number" min="0" value={group.minQuantity}
                        onChange={e => updateGroup(gi, 'minQuantity', e.target.value)} />
                    </div>
                    <div>
                      <label className="size-field-label">Máximo</label>
                      <input className="form-input" type="number" min="0" value={group.maxQuantity}
                        onChange={e => updateGroup(gi, 'maxQuantity', e.target.value)} />
                    </div>
                  </>
                )}
                {group.rule !== 'BETWEEN' && (
                  <div>
                    <label className="size-field-label">
                      {group.rule === 'MIN' ? 'Mínimo' : group.rule === 'MAX' ? 'Máximo' : 'Quantidade'}
                    </label>
                    <input className="form-input" type="number" min="0"
                      value={group.rule === 'MAX' ? group.maxQuantity : group.minQuantity}
                      onChange={e => {
                        const val = e.target.value;
                        if (group.rule === 'MAX') updateGroup(gi, 'maxQuantity', val);
                        else updateGroup(gi, 'minQuantity', val);
                      }} />
                  </div>
                )}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors shrink-0 ${group.active !== false ? 'bg-orange-500' : 'bg-gray-300'}`}>
                      <input type="checkbox" checked={group.active !== false}
                        onChange={e => updateGroup(gi, 'active', e.target.checked)} className="sr-only" />
                      <span className={`absolute w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${group.active !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                    <span className="text-xs font-medium text-gray-600">Ativo</span>
                  </label>
                </div>
              </div>
            )}

            {/* Size overrides — sempre visível quando há tamanhos */}
            {sizes.filter(s => s.nome.trim()).length > 0 && (
              <details className="mb-3 group" open>
                <summary className="text-xs text-orange-600 font-semibold cursor-pointer hover:text-orange-700 select-none">
                  🔧 Quantidades por tamanho
                </summary>
                <div className="mt-2 pl-2 border-l-2 border-orange-200">
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    <span className="w-20" />
                    {group.rule === 'BETWEEN' && <span className="flex-1">Mínimo</span>}
                    <span className="flex-1">{group.rule === 'MAX' ? 'Máximo' : group.rule === 'EXACTLY' ? 'Quantidade' : group.rule === 'MIN' ? 'Mínimo' : 'Máximo'}</span>
                  </div>
                  <div className="space-y-2">
                    {sizes.filter(s => s.nome.trim()).map((sz) => {
                      const override = (group.sizeOverrides || []).find((o: any) => o.sizeName === sz.nome);
                      const ovMin = override?.minQuantity ?? group.minQuantity;
                      const ovMax = override?.maxQuantity ?? group.maxQuantity;
                      return (
                        <div key={sz.nome} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 w-20">{sz.nome}</span>
                          {group.rule === 'BETWEEN' ? (
                            <input className="form-input flex-1" type="number" min="0" placeholder="0" value={ovMin}
                              onChange={e => {
                                const overrides = [...(group.sizeOverrides || [])];
                                const idx = overrides.findIndex((o: any) => o.sizeName === sz.nome);
                                const entry = { sizeName: sz.nome, minQuantity: Number(e.target.value), maxQuantity: overrides[idx]?.maxQuantity ?? group.maxQuantity };
                                if (idx >= 0) overrides[idx] = entry; else overrides.push(entry);
                                updateGroup(gi, 'sizeOverrides', overrides);
                              }} />
                          ) : null}
                          <input className="form-input flex-1" type="number" min="0" placeholder="0"
                            value={group.rule === 'MIN' ? ovMin : ovMax}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const overrides = [...(group.sizeOverrides || [])];
                              const idx = overrides.findIndex((o: any) => o.sizeName === sz.nome);
                              const entry = group.rule === 'MIN'
                                ? { sizeName: sz.nome, minQuantity: val, maxQuantity: overrides[idx]?.maxQuantity ?? group.maxQuantity }
                                : { sizeName: sz.nome, minQuantity: overrides[idx]?.minQuantity ?? group.minQuantity, maxQuantity: val };
                              if (idx >= 0) overrides[idx] = entry; else overrides.push(entry);
                              updateGroup(gi, 'sizeOverrides', overrides);
                            }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            )}

            {/* Items */}
            <div className="border-t border-gray-200 pt-3 mt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="size-field-label">Itens</span>
                <button type="button" onClick={() => addItemToGroup(gi)} className="add-size-btn" style={{ fontSize: 12, padding: '4px 12px' }}>+ Item</button>
              </div>

              {(!group.items || group.items.length === 0) && (
                <p className="sizes-empty" style={{ marginTop: 4 }}>Nenhum item. Adicione as opções que o cliente poderá escolher.</p>
              )}

              {group.items && group.items.length > 0 && (
                <div className="flex items-center gap-2 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <span style={{ width: 44 }} />
                  <span className="flex-1">Nome</span>
                  <span style={{ width: 100 }}>Preço</span>
                  <span style={{ width: 28 }}>OK</span>
                  <span style={{ width: 28 }} />
                </div>
              )}
              {group.items?.map((item: any, ii: number) => (
                <div key={ii} className="flex items-center gap-2 mb-2">
                  <div className="flex flex-col items-center" style={{ width: 44 }}>
                    <button type="button" onClick={() => moveItem(gi, ii, 'up')}
                      disabled={ii === 0}
                      className="p-0.5 hover:bg-orange-100 rounded disabled:opacity-20 disabled:cursor-default transition-colors leading-none">
                      <ChevronUp size={14} className="text-orange-600" />
                    </button>
                    <button type="button" onClick={() => moveItem(gi, ii, 'down')}
                      disabled={ii === (group.items?.length || 0) - 1}
                      className="p-0.5 hover:bg-orange-100 rounded disabled:opacity-20 disabled:cursor-default transition-colors leading-none">
                      <ChevronDown size={14} className="text-orange-600" />
                    </button>
                  </div>
                  <input className="form-input flex-1" placeholder="Nome do item" value={item.name}
                    onChange={e => updateItem(gi, ii, 'name', e.target.value)} />
                  <input className="form-input" style={{ width: 100 }} type="text" inputMode="numeric" placeholder="R$ 0,00"
                    value={formatCurrency(item.additionalPrice || 0)}
                    onChange={e => updateItem(gi, ii, 'additionalPrice', parseCurrencyInput(e.target.value))} />
                  <label className="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={item.available !== false}
                      onChange={e => updateItem(gi, ii, 'available', e.target.checked)} className="w-3.5 h-3.5 accent-orange-500" />
                    OK
                  </label>
                  <button type="button" onClick={() => removeItem(gi, ii)} className="remove-size-btn" style={{ width: 28, height: 28 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {requiredGroups.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            As alterações em obrigatórios são salvas automaticamente ao salvar o produto.
          </p>
        )}
      </div>

      <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl text-sm hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
        Salvar Produto
      </button>
    </form>
  );
}

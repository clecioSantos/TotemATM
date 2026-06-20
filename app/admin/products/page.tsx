"use client";

import { useState } from "react";
import { useProducts } from "./hooks/useProducts";
import { useCategoriesStore } from "../categories/hooks/useCategories";
import { useCondiments } from "../condiments/hooks/useCondiments";
import ProductTable from "./components/ProductTable";
import ProductForm from "./components/ProductForm";
import CondimentForm from "../condiments/components/CondimentForm";
import { Product } from "@totem/shared/types";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import { useConfirm } from "@/app/components/ConfirmProvider";
import { Plus, Settings, ShoppingBag, Package, Layers, Edit3, Trash2, Save, X, Check } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import "./page.css";

type ActiveTab = "products" | "groups" | "category";

function ProductsContent() {
  const { showConfirm } = useConfirm();
  const { products, loading: productsLoading, saveProduct, removeProduct } = useProducts();
  const { categories, loading: catLoading, saveCategory, removeCategory } = useCategoriesStore();
  const { condiments, loading: condLoading, saveCondiment, removeCondiment } = useCondiments();

  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");

  // Inline editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCondimentId, setEditingCondimentId] = useState<string | null>(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newCondimentOpen, setNewCondimentOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catSaving, setCatSaving] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  const filteredProducts = selectedCatId
    ? products.filter((p) => p.categoryId === selectedCatId)
    : products;

  const filteredCondiments = selectedCatId
    ? condiments.filter((c) => c.categoryIds?.includes(selectedCatId))
    : condiments;

  const editingProduct = editingProductId ? products.find(p => p.id === editingProductId) : null;
  const editingCondiment = editingCondimentId ? condiments.find(c => c.id === editingCondimentId) : null;

  const handleCategorySave = async () => {
    if (!selectedCategory || !editingCategory) return;
    setCatSaving(true);
    try {
      await updateDoc(doc(firestore, "categories", selectedCategory.id), {
        name: editingCategory.name,
        schedulingMode: editingCategory.schedulingMode,
        minimumPreparationMinutes: editingCategory.minimumPreparationMinutes ? Number(editingCategory.minimumPreparationMinutes) : null,
        requiresCustomerContact: editingCategory.requiresCustomerContact,
        customerInstructions: editingCategory.customerInstructions || null,
      });
      setEditingCategory(null);
    } catch (err) { logger.error("ProductsPage.saveCategory", err); }
    finally { setCatSaving(false); }
  };

  const loading = productsLoading || catLoading || condLoading;

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Categorias, produtos, grupos adicionais e obrigatórios</p>
        </div>
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        <select className="filter-select" value={selectedCatId}
          onChange={(e) => { setSelectedCatId(e.target.value); setActiveTab("products"); setEditingProductId(null); setEditingCondimentId(null); setNewProductOpen(false); setNewCondimentOpen(false); }}
          style={{ minWidth: 220 }}>
          <option value="">Selecione uma categoria</option>
          {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
        </select>
      </div>

      {!selectedCatId ? (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">Selecione uma categoria para gerenciar</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-6 max-w-lg">
            {[
              { key: "products", label: "Produtos", icon: <ShoppingBag size={16} /> },
              { key: "groups", label: "Grupos Adicionais", icon: <Layers size={16} /> },
              { key: "category", label: "Config. Categoria", icon: <Settings size={16} /> },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === tab.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ─── Products Tab ─── */}
          {activeTab === "products" && (
            <div className="mt-6 space-y-4">
              {!newProductOpen && !editingProductId && (
                <button onClick={() => setNewProductOpen(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                  <Plus size={18} /> Novo Produto
                </button>
              )}

              {newProductOpen && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Novo Produto</h3>
                    <button onClick={() => setNewProductOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-400" /></button>
                  </div>
                  <ProductForm categories={categories} selectedCategoryId={selectedCatId}
                    onSubmit={async (data, file) => {
                      try { await saveProduct(data, file); setNewProductOpen(false); }
                      catch (err) { logger.error("ProductsPage.saveProduct", err); }
                    }} />
                </div>
              )}

              {productsLoading ? (
                <div className="text-center py-8 text-gray-400">Carregando...</div>
              ) : filteredProducts.length === 0 && !newProductOpen ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                  <ShoppingBag size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium">Nenhum produto nesta categoria</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className={`bg-white rounded-2xl border ${editingProductId === p.id ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'} overflow-hidden transition-all`}>
                      {/* Product row */}
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={18} className="text-gray-400" /></div>}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">R$ {p.price?.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.active !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.active !== false ? "Ativo" : "Inativo"}</span>
                          {p.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">Destaque</span>}
                          {editingProductId === p.id ? (
                            <button onClick={() => setEditingProductId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={15} className="text-gray-400" /></button>
                          ) : (
                            <button onClick={() => { setNewProductOpen(false); setEditingProductId(p.id); }} className="p-1.5 hover:bg-orange-50 rounded-lg"><Edit3 size={14} className="text-orange-500" /></button>
                          )}
                          <button onClick={async () => { if (await showConfirm("Excluir produto?")) removeProduct(p.id); }} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                        </div>
                      </div>
                      {/* Inline edit form */}
                      {editingProductId === p.id && (
                        <div className="border-t border-gray-100 p-5 bg-gray-50">
                          <ProductForm categories={categories} selectedCategoryId={selectedCatId} initialData={p}
                            onSubmit={async (data, file) => {
                              try { await saveProduct(data, file); setEditingProductId(null); }
                              catch (err) { logger.error("ProductsPage.saveProduct", err); }
                            }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Additional Groups Tab ─── */}
          {activeTab === "groups" && (
            <div className="mt-6 space-y-4">
              {!newCondimentOpen && !editingCondimentId && (
                <button onClick={() => setNewCondimentOpen(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                  <Plus size={18} /> Novo Grupo Adicional
                </button>
              )}

              {newCondimentOpen && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Novo Grupo Adicional</h3>
                    <button onClick={() => setNewCondimentOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-400" /></button>
                  </div>
                  <CondimentForm categories={categories} initialData={null}
                    onSubmit={async (data) => {
                      try { await saveCondiment({ ...data, categoryIds: [selectedCatId] }); setNewCondimentOpen(false); }
                      catch (err) { logger.error("ProductsPage.saveCondiment", err); }
                    }} />
                </div>
              )}

              {condLoading ? (
                <div className="text-center py-8 text-gray-400">Carregando...</div>
              ) : filteredCondiments.length === 0 && !newCondimentOpen ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Layers size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium">Nenhum grupo adicional</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCondiments.map((c) => (
                    <div key={c.id} className={`bg-white rounded-2xl border ${editingCondimentId === c.id ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'} overflow-hidden transition-all`}>
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Layers size={18} className="text-purple-500" /></div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                            <p className="text-xs text-gray-500">R$ {c.price?.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.enabled !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.enabled !== false ? "Ativo" : "Inativo"}</span>
                          {editingCondimentId === c.id ? (
                            <button onClick={() => setEditingCondimentId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={15} className="text-gray-400" /></button>
                          ) : (
                            <button onClick={() => { setNewCondimentOpen(false); setEditingCondimentId(c.id); }} className="p-1.5 hover:bg-orange-50 rounded-lg"><Edit3 size={14} className="text-orange-500" /></button>
                          )}
                          <button onClick={async () => { if (await showConfirm("Excluir grupo adicional?")) removeCondiment(c.id); }} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                        </div>
                      </div>
                      {editingCondimentId === c.id && (
                        <div className="border-t border-gray-100 p-5 bg-gray-50">
                          <CondimentForm categories={categories} initialData={c}
                            onSubmit={async (data) => {
                              try { await saveCondiment({ ...data, categoryIds: [selectedCatId] }); setEditingCondimentId(null); }
                              catch (err) { logger.error("ProductsPage.saveCondiment", err); }
                            }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Category Settings Tab ─── */}
          {activeTab === "category" && selectedCategory && (
            <div className="mt-6 max-w-lg">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Configurações da Categoria</h3>
                  {!editingCategory && (
                    <button onClick={() => setEditingCategory({ ...selectedCategory })} className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                      <Edit3 size={14} /> Editar
                    </button>
                  )}
                </div>

                {!editingCategory ? (
                  <div className="space-y-3 text-sm">
                    {[{ label: "Nome", value: selectedCategory.name },
                      { label: "Agendamento", value: selectedCategory.schedulingMode === "required" ? "Obrigatório" : selectedCategory.schedulingMode === "optional" ? "Opcional" : "Nenhum" },
                      { label: "Tempo de preparo", value: selectedCategory.minimumPreparationMinutes ? `${selectedCategory.minimumPreparationMinutes}min` : "—" },
                      { label: "Requer contato", value: selectedCategory.requiresCustomerContact ? "Sim" : "Não" },
                    ].map((f) => (
                      <div key={f.label} className="flex justify-between"><span className="text-gray-500">{f.label}</span><span className="font-medium text-gray-900">{String(f.value)}</span></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                      <input className="form-input w-full mt-1" value={editingCategory.name}
                        onChange={e => setEditingCategory((p: any) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Agendamento</label>
                      <select className="form-input w-full mt-1" value={editingCategory.schedulingMode || "none"}
                        onChange={e => setEditingCategory((p: any) => ({ ...p, schedulingMode: e.target.value }))}>
                        <option value="none">Sem agendamento</option>
                        <option value="optional">Opcional</option>
                        <option value="required">Obrigatório</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Tempo de preparo (min)</label>
                      <input className="form-input w-full mt-1" type="number" value={editingCategory.minimumPreparationMinutes ?? ""}
                        onChange={e => setEditingCategory((p: any) => ({ ...p, minimumPreparationMinutes: e.target.value }))} />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingCategory.requiresCustomerContact}
                        onChange={e => setEditingCategory((p: any) => ({ ...p, requiresCustomerContact: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                      Requer contato com o cliente
                    </label>
                    {editingCategory.requiresCustomerContact && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Instruções</label>
                        <textarea className="form-input w-full mt-1" rows={2} value={editingCategory.customerInstructions || ""}
                          onChange={e => setEditingCategory((p: any) => ({ ...p, customerInstructions: e.target.value }))} />
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleCategorySave} disabled={catSaving}
                        className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-xl text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                        <Save size={16} /> {catSaving ? "Salvando..." : "Salvar"}
                      </button>
                      <button onClick={() => setEditingCategory(null)} className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return <ErrorBoundary context="ProductsPage"><ProductsContent /></ErrorBoundary>;
}

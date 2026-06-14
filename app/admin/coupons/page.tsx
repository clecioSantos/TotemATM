"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { Tag, Plus, Loader2, CheckCircle, XCircle, Trash2, Search } from "lucide-react";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import "../page.css";

interface CouponData {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount?: number;
  perCustomerLimit?: number;
  firstPurchaseOnly: boolean;
  deliveryOnly: boolean;
  pickupOnly: boolean;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: any;
}

function CouponsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.companyId) return;
    Promise.all([
      getDoc(doc(firestore, "settings", "global")),
      getDoc(doc(firestore, "companies", user.companyId)),
    ]).then(([globalSnap, companySnap]) => {
      const global = globalSnap.exists() ? globalSnap.data().couponsEnabled : undefined;
      const store = companySnap.exists() ? companySnap.data().couponsEnabled : undefined;
      if (global === false || store !== true) {
        router.replace("/admin");
      }
    }).catch(() => {});
  }, [user?.companyId, router]);

  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    perCustomerLimit: "",
    firstPurchaseOnly: false,
    deliveryOnly: false,
    pickupOnly: false,
    active: true,
    startDate: "",
    endDate: "",
  });

  const [error, setError] = useState("");

  const loadCoupons = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/coupons?storeId=${user.companyId}`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      logger.error("COUPONS_PAGE", "Erro ao carregar cupons", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [user?.companyId]);

  const resetForm = () => {
    setForm({
      code: "",
      type: "percentage",
      value: "",
      minOrderValue: "",
      maxDiscount: "",
      usageLimit: "",
      perCustomerLimit: "",
      firstPurchaseOnly: false,
      deliveryOnly: false,
      pickupOnly: false,
      active: true,
      startDate: "",
      endDate: "",
    });
    setEditingId(null);
    setError("");
  };

  const openEdit = (coupon: CouponData) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      perCustomerLimit: coupon.perCustomerLimit ? String(coupon.perCustomerLimit) : "",
      firstPurchaseOnly: coupon.firstPurchaseOnly,
      deliveryOnly: coupon.deliveryOnly,
      pickupOnly: coupon.pickupOnly,
      active: coupon.active,
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
    });
    setEditingId(coupon.id);
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.code.trim()) {
      setError("Código é obrigatório");
      return;
    }

    if (form.deliveryOnly && form.pickupOnly) {
      setError("Não pode ser apenas entrega e apenas retirada ao mesmo tempo");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        storeId: user?.companyId,
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : null,
        firstPurchaseOnly: form.firstPurchaseOnly,
        deliveryOnly: form.deliveryOnly,
        pickupOnly: form.pickupOnly,
        active: form.active,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      let res;
      if (editingId) {
        res = await fetch(`/api/coupons/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        resetForm();
        setShowForm(false);
        loadCoupons();
      } else {
        setError(data.error || "Erro ao salvar cupom");
      }
    } catch (err) {
      setError("Erro ao salvar cupom");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: CouponData) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });
      const data = await res.json();
      if (data.success) loadCoupons();
    } catch (err) {
      logger.error("COUPONS_PAGE", "Erro ao alterar status", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) loadCoupons();
    } catch (err) {
      logger.error("COUPONS_PAGE", "Erro ao excluir", err);
    }
  };

  const isExpired = (coupon: CouponData) => {
    if (!coupon.endDate) return false;
    const end = new Date(coupon.endDate);
    return end < new Date();
  };

  const isPending = (coupon: CouponData) => {
    if (!coupon.startDate) return false;
    const start = new Date(coupon.startDate);
    return start > new Date();
  };

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Cupons de Desconto</h1>
          <p className="page-subtitle">Gerencie os cupons promocionais da sua loja</p>
        </div>
        <button className="page-header-button" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} />
          Novo Cupom
        </button>
      </header>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">{editingId ? "Editar Cupom" : "Novo Cupom"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Código *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                  className="form-input w-full"
                  placeholder="Ex: BEMVINDO10"
                  maxLength={20}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tipo *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="form-input w-full">
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  {form.type === "percentage" ? "Percentual (%) *" : "Valor (R$) *"}
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  className="form-input w-full"
                  min={form.type === "percentage" ? 1 : 0.01}
                  max={form.type === "percentage" ? 100 : undefined}
                  step="0.01"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Valor mínimo do pedido</label>
                  <input type="number" value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })} className="form-input w-full" min="0" step="0.01" placeholder="R$ 0,00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Desconto máximo</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} className="form-input w-full" min="0" step="0.01" placeholder="R$ 0,00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Limite total de usos</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} className="form-input w-full" min="1" placeholder="Ilimitado" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Limite por cliente</label>
                  <input type="number" value={form.perCustomerLimit} onChange={e => setForm({ ...form, perCustomerLimit: e.target.value })} className="form-input w-full" min="1" placeholder="Ilimitado" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Data inicial</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="form-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Data final</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="form-input w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-medium">Ativo</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.firstPurchaseOnly} onChange={e => setForm({ ...form, firstPurchaseOnly: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-medium">Apenas primeira compra</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.deliveryOnly} onChange={e => setForm({ ...form, deliveryOnly: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-medium">Somente entrega</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.pickupOnly} onChange={e => setForm({ ...form, pickupOnly: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-medium">Somente retirada</span>
                </label>
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="save-button flex-1">
                  {saving ? <><Loader2 size={18} className="spin" /> Salvando...</> : <><Plus size={18} /> {editingId ? "Atualizar" : "Criar"}</>}
                </button>
                <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-6 py-3 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="loading-container"><Loader2 size={24} className="spin" /><p>Carregando...</p></div>
      ) : coupons.length === 0 ? (
        <div className="settings-card" style={{ maxWidth: "100%", marginTop: 24 }}>
          <p className="text-sm text-gray-500">Nenhum cupom criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3" style={{ marginTop: 24 }}>
          {coupons.map(coupon => {
            const expired = isExpired(coupon);
            const pending = isPending(coupon);
            return (
              <div key={coupon.id} className="settings-card" style={{ maxWidth: "100%" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-black tracking-wider">{coupon.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        expired ? "bg-gray-100 text-gray-500" :
                        pending ? "bg-yellow-50 text-yellow-700" :
                        coupon.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {expired ? "Expirado" : pending ? "Agendado" : coupon.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                      <span className="font-bold">{coupon.type === "percentage" ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)} OFF`}</span>
                      {coupon.minOrderValue && <span>Mín: R$ {coupon.minOrderValue.toFixed(2)}</span>}
                      {coupon.maxDiscount && <span>Máx: R$ {coupon.maxDiscount.toFixed(2)}</span>}
                      <span>{coupon.usageCount || 0}/{coupon.usageLimit || "∞"} usos</span>
                      {coupon.startDate && <span>Início: {new Date(coupon.startDate).toLocaleDateString()}</span>}
                      {coupon.endDate && <span>Fim: {new Date(coupon.endDate).toLocaleDateString()}</span>}
                      {coupon.firstPurchaseOnly && <span className="text-purple-600 font-medium">1ª compra</span>}
                      {coupon.deliveryOnly && <span className="text-blue-600 font-medium">Entrega</span>}
                      {coupon.pickupOnly && <span className="text-amber-600 font-medium">Retirada</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(coupon)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title={coupon.active ? "Desativar" : "Ativar"}>
                      {coupon.active ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-gray-400" />}
                    </button>
                    <button onClick={() => openEdit(coupon)} className="px-3 py-1.5 text-sm font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CouponsPage() {
  return (
    <ErrorBoundary context="CouponsPage">
      <CouponsContent />
    </ErrorBoundary>
  );
}

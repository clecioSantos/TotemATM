"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { ShoppingBag, MapPin, Ticket, X, Loader2, ArrowLeft, CreditCard } from "lucide-react";
import { CartItem } from "@totem/shared/types";
import { useAuth } from "@totem/shared/types/AuthProvider";

interface CouponApplied {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discountValue: number;
  finalTotal: number;
  pixOnly?: boolean;
}

interface OrderSummaryScreenProps {
  companyId: string;
  companyName: string;
  cart: CartItem[];
  cartTotal: number;
  deliveryFee: number;
  deliveryMode: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryNeighborhood: string;
  deliveryComplement: string;
  convenienceFee: number;
  minOrderValue: number;
  onCouponChange: (coupon: CouponApplied | null) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export default function OrderSummaryScreen({
  companyId, companyName, cart, cartTotal,
  deliveryFee, deliveryMode, deliveryStreet, deliveryNumber,
  deliveryNeighborhood, deliveryComplement, convenienceFee, minOrderValue,
  onCouponChange, onConfirm, onBack,
}: OrderSummaryScreenProps) {
  const { user } = useAuth();
  const [couponsEnabled, setCouponsEnabled] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplied | null>(null);
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      getDoc(doc(firestore, "settings", "global")),
      getDoc(doc(firestore, "companies", companyId)),
    ]).then(([globalSnap, companySnap]) => {
      const g = globalSnap.exists() ? globalSnap.data().couponsEnabled : undefined;
      const s = companySnap.exists() ? companySnap.data().couponsEnabled : undefined;
      setCouponsEnabled(g !== false && s !== false);
    }).catch(() => {});
  }, [companyId]);

  const subtotal = cartTotal;
  const delivery = deliveryMode === "pickup" ? 0 : deliveryFee;
  const discount = appliedCoupon?.discountValue || 0;
  const convenience = convenienceFee || 0;
  const total = Math.max(0, subtotal + delivery + convenience - discount);

  const validateCoupon = async () => {
    const trimmed = couponCode.toUpperCase().trim();
    if (!trimmed) return;
    setValidating(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          storeId: companyId,
          subtotal,
          customerId: user?.uid,
          deliveryMode,
          paymentMethod: "PIX",
          totalOrder: subtotal + deliveryFee + convenienceFee,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        const info: CouponApplied = {
          id: data.coupon.id,
          code: data.coupon.code,
          type: data.coupon.type,
          value: data.coupon.value,
          discountValue: data.discountValue,
          finalTotal: data.finalTotal,
          pixOnly: data.coupon.pixOnly,
        };
        setAppliedCoupon(info);
        onCouponChange(info);
      } else {
        setCouponError(data.reason || "Cupom inválido");
      }
    } catch {
      setCouponError("Erro ao validar cupom");
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    onCouponChange(null);
  };

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-brand-light to-gray-100 flex items-center justify-center p-4 lg:p-8">
      <div className="bg-brand-surface w-full max-w-lg rounded-[24px] border border-brand-border shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="p-6 border-b border-brand-border flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-brand-light rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-brand-muted" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-brand-dark">Revisão do Pedido</h2>
            <p className="text-xs text-brand-muted">{companyName} • {itemCount} {itemCount === 1 ? "item" : "itens"}</p>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Itens */}
          <div>
            <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ShoppingBag size={14} /> Itens
            </h3>
            <div className="space-y-3">
              {cart.map((item) => {
                const basePrice = item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price;
                const condPrice = item.condiments?.reduce((s, c) => s + c.price, 0) || 0;
                const flavPrice = item.saboresSelecionados?.reduce((s, f) => s + (f.preco || 0), 0) || 0;
                const reqPrice = item.selectedRequiredItems?.reduce((s, rg) => s + rg.items.reduce((ss, i) => ss + (Number(i.additionalPrice) || 0), 0), 0) || 0;
                const unitTotal = (basePrice + condPrice + flavPrice + reqPrice) * item.quantity;
                return (
                  <div key={item.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-brand-muted">{item.quantity}x</span>
                        <span className="text-sm font-bold text-brand-dark truncate">{item.name}</span>
                      </div>
                      {item.tamanhoSelecionado && (
                        <p className="text-[11px] text-brand-muted ml-5">{item.tamanhoSelecionado.nome}</p>
                      )}
                      {item.condiments && item.condiments.length > 0 && (
                        <p className="text-[11px] text-brand-muted ml-5">
                          +{item.condiments.map(c => c.name).join(", ")}
                        </p>
                      )}
                      {item.selectedRequiredItems?.map((rg: any) => (
                        <p key={rg.groupName} className="text-[11px] text-brand-muted ml-5">
                          {rg.items.map((i: any) => i.name).join(", ")}
                        </p>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-brand-dark shrink-0">R$ {unitTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Endereço */}
          {deliveryMode !== "pickup" && (
            <div>
              <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MapPin size={14} /> Endereço de Entrega
              </h3>
              <div className="bg-brand-light rounded-[12px] p-3 border border-brand-border">
                <p className="text-sm font-semibold text-brand-dark">{deliveryStreet}, {deliveryNumber}</p>
                <p className="text-xs text-brand-muted">{deliveryNeighborhood}{deliveryComplement ? ` - ${deliveryComplement}` : ""}</p>
              </div>
            </div>
          )}

          {deliveryMode === "pickup" && (
            <div>
              <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MapPin size={14} /> Retirada no Local
              </h3>
              <div className="bg-brand-light rounded-[12px] p-3 border border-brand-border">
                <p className="text-sm font-semibold text-brand-dark">{companyName}</p>
                <p className="text-xs text-brand-muted">Retire seu pedido no local</p>
              </div>
            </div>
          )}

          {/* Cupom */}
          {couponsEnabled && (
            <div>
              <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Ticket size={14} /> Cupom de Desconto
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-[12px]">
                  <div>
                    <span className="text-sm font-bold text-green-700">{appliedCoupon.code}</span>
                    <span className="text-xs text-green-600 ml-2">
                      -R$ {appliedCoupon.discountValue.toFixed(2)}
                      {appliedCoupon.type === "percentage" && ` (${appliedCoupon.value}%)`}
                    </span>
                  </div>
                  <button onClick={removeCoupon} className="p-1 hover:bg-green-100 rounded-lg transition-colors">
                    <X size={16} className="text-green-600" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    placeholder="Digite o código"
                    className="flex-1 bg-brand-light border border-brand-border px-4 py-3 rounded-[12px] text-sm font-semibold outline-none focus:border-brand-primary transition-colors uppercase"
                    maxLength={20}
                    disabled={validating}
                    onKeyDown={(e) => { if (e.key === "Enter") validateCoupon(); }}
                  />
                  <button
                    onClick={validateCoupon}
                    disabled={!couponCode.trim() || validating}
                    className="px-5 py-3 bg-brand-primary text-white font-bold rounded-[12px] text-sm hover:bg-brand-primaryHover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validating ? <Loader2 size={16} className="animate-spin" /> : "Aplicar"}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 font-medium mt-1.5">{couponError}</p>}
            </div>
          )}
        </div>

        {/* Resumo de valores */}
        <div className="border-t border-brand-border p-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-brand-muted">Subtotal</span>
            <span className="font-semibold text-brand-dark">R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-muted">{deliveryMode === "pickup" ? "Retirada" : "Entrega"}</span>
            <span className="font-semibold text-brand-dark">
              {delivery === 0 ? "Grátis" : `R$ ${delivery.toFixed(2)}`}
            </span>
          </div>
          {minOrderValue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Pedido mínimo</span>
              <span className="font-semibold text-brand-dark">R$ {minOrderValue.toFixed(2)}</span>
            </div>
          )}
          {convenience > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Taxa de Conveniência</span>
              <span className="font-semibold text-brand-dark">R$ {convenience.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Desconto</span>
              <span className="font-semibold text-green-600">-R$ {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base border-t border-brand-border pt-2 mt-2">
            <span className="font-bold text-brand-dark">Total</span>
            <span className="font-bold text-lg text-brand-primary">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        {minOrderValue > 0 && total < minOrderValue && (
          <div className="px-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-xs font-bold text-red-700 text-center">
                Pedido mínimo: R$ {minOrderValue.toFixed(2)}. Adicione mais R$ {(minOrderValue - total).toFixed(2)} ao carrinho.
              </p>
            </div>
          </div>
        )}

        {/* Confirmar */}
        <div className="px-6 pb-6">
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 py-4 bg-brand-primary hover:bg-brand-primaryHover text-white font-bold rounded-[12px] transition-all"
          >
            <CreditCard size={18} />
            CONFIRMAR PAGAMENTO
          </button>
        </div>
      </div>
    </div>
  );
}

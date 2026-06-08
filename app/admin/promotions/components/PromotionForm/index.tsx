"use client";

import { useState, useEffect } from "react";
import { Promotion, PromotionEvent, Product } from "@totem/shared/types";
import { Timestamp } from "firebase/firestore";
import "./styles.css";

interface Props {
  initialData?: Promotion | null;
  products: Product[];
  events: PromotionEvent[];
  onSubmit: (data: any) => Promise<void>;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseCurrencyInput = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, "");
  return Number(digits) / 100;
};

const nowISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function PromotionForm({ initialData, products, events, onSubmit }: Props) {
  const [productId, setProductId] = useState(initialData?.productId || "");
  const [eventId, setEventId] = useState(initialData?.eventId || "");
  const [promotionType, setPromotionType] = useState<"fixed_price" | "percentage_discount" | "amount_discount">(
    initialData?.promotionType || "fixed_price"
  );
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || 0);
  const [promotionalPrice, setPromotionalPrice] = useState(initialData?.promotionalPrice || 0);
  const [percentageOff, setPercentageOff] = useState(initialData?.percentageOff || 0);
  const [stockLimit, setStockLimit] = useState<number | null>(initialData?.stockLimit ?? null);
  const [maxPerOrder, setMaxPerOrder] = useState<number | null>(initialData?.maxPerOrder ?? null);
  const toDate = (ts: any): Date => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const [startAt, setStartAt] = useState(
    initialData?.startAt ? toDate(initialData.startAt).toISOString().slice(0, 16) : nowISO()
  );
  const [endAt, setEndAt] = useState(
    initialData?.endAt ? toDate(initialData.endAt).toISOString().slice(0, 16) : nowISO()
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedEvent = events.find((e) => e.id === eventId);

  useEffect(() => {
    if (selectedProduct?.price && !initialData) {
      setOriginalPrice(selectedProduct.price);
    }
  }, [selectedProduct, initialData]);

  useEffect(() => {
    if (promotionType === "percentage_discount" && originalPrice > 0 && percentageOff > 0) {
      const discount = (originalPrice * percentageOff) / 100;
      setPromotionalPrice(originalPrice - discount);
    }
  }, [promotionType, percentageOff, originalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (selectedEvent && !selectedEvent.permanent && endDate > new Date((selectedEvent.endAt as any).seconds * 1000)) {
      alert("A promoção não pode terminar depois do evento.");
      setSubmitting(false);
      return;
    }

    const data: any = {
      productId,
      eventId,
      title: selectedProduct?.name || "Promoção",
      promotionType,
      originalPrice,
      promotionalPrice,
      percentageOff: promotionType === "percentage_discount" ? percentageOff : 0,
      stockLimit,
      maxPerOrder,
      startAt: Timestamp.fromDate(startDate),
      endAt: Timestamp.fromDate(endDate),
      status: startDate <= new Date() ? "active" : "scheduled",
    };

    if (initialData?.id) {
      data.id = initialData.id;
    }

    await onSubmit(data);
    setSubmitting(false);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Produto</label>
        <select
          className="form-input"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          <option value="">Selecione um produto...</option>
          {products
            .filter((p) => p.active)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatCurrency(p.price)}
              </option>
            ))}
        </select>
      </div>

      <div className="input-group">
        <label>Evento (opcional)</label>
        <select
          className="form-input"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="">Sem evento</option>
          {events
            .filter((e) => e.status !== "finished")
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </select>
      </div>

      <div className="input-group">
        <label>Tipo de Promoção</label>
        <select
          className="form-input"
          value={promotionType}
          onChange={(e) => setPromotionType(e.target.value as any)}
        >
          <option value="fixed_price">Preço Fixo</option>
          <option value="percentage_discount">Percentual de Desconto</option>
          <option value="amount_discount">Valor Fixo de Desconto</option>
        </select>
      </div>

      <div className="input-group">
        <label>Preço Original (R$)</label>
        <input
          className="form-input"
          type="text"
          inputMode="numeric"
          value={formatCurrency(originalPrice)}
          onChange={(e) => setOriginalPrice(parseCurrencyInput(e.target.value))}
          required
        />
      </div>

      {promotionType === "percentage_discount" && (
        <div className="input-group">
          <label>Percentual de Desconto (%)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="100"
            value={percentageOff}
            onChange={(e) => setPercentageOff(Number(e.target.value))}
            required
          />
        </div>
      )}

      <div className="input-group">
        <label>
          {promotionType === "fixed_price"
            ? "Preço Promocional (R$)"
            : promotionType === "amount_discount"
            ? "Valor do Desconto (R$)"
            : "Preço Final (R$)"}
        </label>
        <input
          className="form-input"
          type="text"
          inputMode="numeric"
          value={formatCurrency(promotionalPrice)}
          onChange={(e) => setPromotionalPrice(parseCurrencyInput(e.target.value))}
          required
        />
      </div>

      <div className="input-group">
        <label>Limite de Estoque Promocional (deixe vazio para ilimitado)</label>
        <input
          className="form-input"
          type="number"
          min="0"
          placeholder="Ilimitado"
          value={stockLimit ?? ""}
          onChange={(e) => setStockLimit(e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      <div className="input-group">
        <label>Máximo por Pedido (deixe vazio para ilimitado)</label>
        <input
          className="form-input"
          type="number"
          min="0"
          placeholder="Ilimitado"
          value={maxPerOrder ?? ""}
          onChange={(e) => setMaxPerOrder(e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      <div className="input-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label>Início</label>
          <input
            className="form-input"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Término</label>
          <input
            className="form-input"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? "Salvando..." : initialData ? "Atualizar Promoção" : "Criar Promoção"}
      </button>
    </form>
  );
}

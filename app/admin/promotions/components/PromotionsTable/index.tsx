"use client";

import { Promotion, PromotionEvent, Product } from "@totem/shared/types";
import "./styles.css";

interface Props {
  promotions: Promotion[];
  products: Product[];
  events: PromotionEvent[];
  onEdit: (p: Promotion) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "badge badge-active" },
  scheduled: { label: "Agendada", className: "badge badge-scheduled" },
  finished: { label: "Encerrada", className: "badge badge-inactive" },
};

const typeLabels: Record<string, string> = {
  fixed_price: "Preço Fixo",
  percentage_discount: "Percentual",
  amount_discount: "Desconto Fixo",
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function PromotionsTable({ promotions, products, events, onEdit, onDelete }: Props) {
  return (
    <div className="promotions-table-wrapper">
      <table className="promo-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Evento</th>
            <th>Tipo</th>
            <th>Preço Original</th>
            <th>Preço Promocional</th>
            <th>Estoque</th>
            <th>Vendas</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promo) => {
            const product = products.find((p) => p.id === promo.productId);
            const event = events.find((e) => e.id === promo.eventId);
            const statusInfo = statusLabels[promo.status] || statusLabels.finished;
            const stockText = promo.stockLimit != null ? `${promo.soldUnits}/${promo.stockLimit}` : "Ilimitado";

            return (
              <tr key={promo.id}>
                <td>
                  <div className="promo-product-cell">
                    {product?.imageUrl && (
                      <img src={product.imageUrl} alt="" className="promo-product-img" />
                    )}
                    <strong>{product?.name || "Produto removido"}</strong>
                  </div>
                </td>
                <td>{event?.name || "—"}</td>
                <td>{typeLabels[promo.promotionType] || promo.promotionType}</td>
                <td className="price-cell">{fmtCurrency(promo.originalPrice)}</td>
                <td className="price-cell promo-price">{fmtCurrency(promo.promotionalPrice)}</td>
                <td>{stockText}</td>
                <td>{promo.soldUnits || 0}</td>
                <td>
                  <span className={statusInfo.className}>{statusInfo.label}</span>
                </td>
                <td className="actions-cell">
                  <button className="btn-action btn-edit" onClick={() => onEdit(promo)}>Editar</button>
                  <button className="btn-action btn-delete" onClick={() => onDelete(promo.id)}>Excluir</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

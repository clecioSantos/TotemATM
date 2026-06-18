"use client";

import { useState } from 'react';
import { Order } from '../../types';
import OrderTimer from './OrderTimer';
import { PermissionGate } from '@/src/components/PermissionGate';
import "./styles.css";

interface Props {
  order: Order;
  onStatusUpdate: (id: string, nextStatus: Order['status']) => void;
  onCancel: (id: string) => void;
}

export default function OrderItem({ order, onStatusUpdate, onCancel }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPickup = order.deliveryMode === "pickup";

  const statusMap: Record<string, { label: string; class: string }> = {
    pending: { label: "Pendente", class: "status-pending" },
    paid: { label: "Pago", class: "status-paid" },
    awating_customization: { label: "Aguardando Alinhamento", class: "status-awaiting" },
    preparing: { label: "Preparando", class: "status-preparing" },
    ready: { label: "Pronto", class: "status-ready" },
    delivering: { label: isPickup ? "Aguardando Retirada" : "Em entrega", class: "status-delivering" },
    finished: { label: isPickup ? "Retirado" : "Finalizado", class: "status-finished" },
    cancelled: { label: "Cancelado", class: "status-cancelled" },
  };

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    const flow: Record<string, Order['status']> = {
      pending: 'paid',
      paid: order.requiresCustomerContact ? 'awating_customization' : 'preparing',
      awating_customization: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'finished',
    };
    return flow[current] || null;
  };

  const nextStatus = getNextStatus(order.status);

  const displayDate = order.createdAt instanceof Date
    ? order.createdAt
    : new Date(order.createdAt.seconds * 1000 + order.createdAt.nanoseconds / 1e6);

  return (
    <div className={`order-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="order-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="order-info">
            <span className="order-id">#{order.id.slice(-4).toUpperCase()}</span>
            <div className="order-meta">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="order-customer">{order.customerName || order.userName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Cliente')}</span>
                {order.address && (

                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '500', marginTop: '1px' }}>
                  📍 {order.address.neighborhood}
                </span>
              )}
            </div>
            <div className="order-time-info">
              <span className="order-date">{displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <OrderTimer createdAt={order.createdAt} />
            </div>
          </div>
        </div>
        
        <div className="order-summary">
          <span className={`status-badge ${statusMap[order.status]?.class || 'status-pending'}`}>
            {statusMap[order.status]?.label || 'Pendente'}
          </span>
          <span className="payment-method-badge" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: order.paymentMethod === 'credit_card' ? '#eff6ff' : '#f0fdf4', color: order.paymentMethod === 'credit_card' ? '#1d4ed8' : '#166534', fontWeight: '600', whiteSpace: 'nowrap' }}>
            {order.paymentMethod === 'credit_card' ? '💳 Cartão' : order.paymentMethod === 'PIX' ? '💠 PIX' : order.paymentMethod || '—'}
          </span>
          <strong className="order-total">R$ {order.total.toFixed(2)}</strong>
          {order.status !== 'finished' && order.status !== 'cancelled' && (
            <button
              className="cancel-btn-inline"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Deseja realmente cancelar este pedido?")) {
                  onCancel(order.id);
                }
              }}
              title="Cancelar pedido"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', fontWeight: '600', color: '#dc2626', borderRadius: '6px' }}
            >
              Cancelar
            </button>
          )}
          <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="order-details">
          <div className="details-divider" />
          
          {order.isScheduled && (
            <div className="order-address-delivery-info" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>🕒 Pedido Agendado</p>
              <p style={{ fontSize: '14px', color: '#78350f', fontWeight: '600' }}>
                {order.scheduledDate} - {order.scheduledTime}
              </p>
              {order.requiresCustomerContact && (
                <p style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>⚠ Requer alinhamento com o cliente</p>
              )}
            </div>
          )}

          {order.address && (
            <div className="order-address-delivery-info" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Endereço de Entrega</p>
              <p style={{ fontSize: '14px', color: '#334155', fontWeight: '600' }}>
                {order.address.street}, {order.address.number}
              </p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{order.address.neighborhood}{order.address.complement ? ` - ${order.address.complement}` : ''}</p>
            </div>
          )}

          <table className="details-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th style={{ textAlign: 'center' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Preço</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.tamanhoSelecionado && (
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.tamanhoSelecionado.nome}</p>
                    )}
                    {item.saboresSelecionados && item.saboresSelecionados.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {item.saboresSelecionados.map((f: any) => (
                          <span key={f.id} style={{ fontSize: '10px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#92400e' }}>
                            {f.nome}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.observation && <p className="item-observation">"{item.observation}"</p>}
                    {item.condiments && item.condiments.length > 0 && (
                      <div className="item-condiments-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {item.condiments.map((c: any) => (
                          <span key={c.id} style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#475569' }}>
                            + {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}x</td>
                  <td style={{ textAlign: 'right' }}>
                    R$ {(item.price + (item.saboresSelecionados?.reduce((s: number, f: any) => s + f.preco, 0) || 0) + (item.condiments?.reduce((s: number, c: any) => s + c.price, 0) || 0)).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    R$ {(item.quantity * (item.price + (item.saboresSelecionados?.reduce((s: number, f: any) => s + f.preco, 0) || 0) + (item.condiments?.reduce((s: number, c: any) => s + c.price, 0) || 0))).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
            <div className="order-delivery-fee-summary" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem 0', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Taxa de Entrega:</span>
              <strong style={{ fontSize: '13px', color: '#166534' }}>R$ {order.deliveryFee.toFixed(2)}</strong>
            </div>
          )}

          {nextStatus && (
            <PermissionGate permission="editOrders">
              <div className="order-actions-footer">
                <button 
                  className="action-btn-danger"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.confirm("Deseja realmente cancelar este pedido?")) {
                      onCancel(order.id);
                    }
                  }}
                >
                  Cancelar Pedido
                </button>
                <button 
                  className="action-btn-primary"
                  onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, nextStatus); }}
                >
                  Avançar para {statusMap[nextStatus].label}
                </button>
              </div>
            </PermissionGate>
          )}
        </div>
      )}
    </div>
  );
}

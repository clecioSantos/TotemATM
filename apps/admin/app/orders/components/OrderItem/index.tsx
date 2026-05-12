"use client";

import { useState } from 'react';
import { Order } from '../../../../../../../index'; 
import "./styles.css";

interface Props {
  order: Order;
  onStatusUpdate: (id: string, nextStatus: Order['status']) => void;
}

export default function OrderItem({ order, onStatusUpdate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusMap = {
    pending: { label: "Pendente", class: "status-pending" },
    preparing: { label: "Preparando", class: "status-preparing" },
    ready: { label: "Pronto", class: "status-ready" },
    finished: { label: "Finalizado", class: "status-finished" },
  };

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    const flow: Record<string, Order['status']> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'finished'
    };
    return flow[current] || null;
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <div className={`order-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="order-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="order-info">
          <span className="order-id">#{order.id.slice(-4).toUpperCase()}</span>
          <div className="order-meta">
            <span className="order-customer">{order.customerName || `Mesa ${order.tableNumber || 'N/A'}`}</span>
            <span className="order-date">{order.createdAt.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="order-summary">
          <span className={`status-badge ${statusMap[order.status]?.class || 'status-pending'}`}>
            {statusMap[order.status]?.label || 'Pendente'}
          </span>
          <strong className="order-total">R$ {order.total.toFixed(2)}</strong>
          <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="order-details">
          <div className="details-divider" />
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
                    {item.observation && <p className="item-observation">"{item.observation}"</p>}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}x</td>
                  <td style={{ textAlign: 'right' }}>R$ {item.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>R$ {(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {nextStatus && (
            <div className="order-actions-footer">
              <button 
                className="action-btn-primary"
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, nextStatus); }}
              >
                Avançar para {statusMap[nextStatus].label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import "./page.css";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: "Pedidos Hoje", value: "0", growth: "0%" },
    { title: "Em Produção", value: "0", growth: "0%" },
    { title: "Finalizados", value: "0", growth: "0%" },
    { title: "Faturamento", value: "R$ 0,00", growth: "0%" },
  ]);

  useEffect(() => {
    const q = query(collection(firestore, "orders"), orderBy("createdAt", "desc"), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `#${doc.id.slice(0, 4).toUpperCase()}`,
          customer: data.customerName || `Mesa ${data.tableNumber}`,
          items: data.items?.map((i: any) => {
            const condimentList = i.condiments?.length > 0 
              ? ` (+ ${i.condiments.map((c: any) => c.name).join(", ")})` 
              : "";
            return `${i.quantity}x ${i.name}${condimentList}`;
          }).join(", ") || "Sem itens",
          total: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total || 0),
          status: data.status === 'pending' ? 'Pendente' : 
                  data.status === 'preparing' ? 'Preparando' : 
                  data.status === 'ready' ? 'Pronto' : 
                  data.status === 'canceled' ? 'Cancelado' : 'Finalizado'
        };
      });

      setOrders(loadedOrders);
      
      // Cálculo dinâmico das estatísticas
      const totalRevenue = snapshot.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
      const inProd = snapshot.docs.filter(doc => doc.data().status === 'preparing').length;
      const finished = snapshot.docs.filter(doc => doc.data().status === 'delivered' || doc.data().status === 'ready').length;

      setStats([
        {
          title: "Pedidos Hoje",
          value: snapshot.docs.length.toString(),
          growth: "+0%",
        },
        {
          title: "Em Produção",
          value: inProd.toString(),
          growth: "+0%",
        },
        {
          title: "Finalizados",
          value: finished.toString(),
          growth: "+0%",
        },
        {
          title: "Faturamento",
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue),
          growth: "+0%",
        },
      ]);
      setLoading(false);
    }, (error) => {
      console.error("🔥 Erro ao carregar Dashboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  return (
    <div className="dashboard-view">
        {/* HEADER */}
        <div className="header">
          <div>
            <h2 className="page-title">Dashboard</h2>
            <p className="page-subtitle">
              Visão geral da operação em tempo real
            </p>
          </div> 
          <button className="primary-button">
            <span>➕</span> Novo Pedido
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          {stats.map((item) => (
            <div key={item.title} className="stat-card">
              <p className="stat-title">
                {item.title}
              </p>

              <h3 className="stat-value">
                {item.value}
              </h3>

              <span className="stat-growth">
                {item.growth}
              </span>
            </div>
          ))}
        </div>

        {/* ORDERS */}
        <div className="orders-card">
          <div className="orders-header">
            <div>
              <h3 className="orders-title">
                Pedidos Recentes
              </h3>

              <p className="orders-subtitle">
                Atualização automática em tempo real
              </p>
            </div>

            <button className="secondary-button">
              Atualizar
            </button>
          </div>

          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className="order-item"
              >
                <div>
                  <h4 className="order-id">
                    {order.id}
                  </h4>

                  <p className="order-customer">
                    {order.customer}
                  </p>

                  <span className="order-items">
                    {order.items}
                  </span>
                </div>

                <div className="order-actions">
                  <span
                    className={`status-badge ${
                      order.status === "Preparando"
                        ? "status-warning"
                        : order.status === "Pendente"
                        ? "status-danger"
                        : "status-success"
                    }`}
                  >
                    {order.status}
                  </span>

                  <strong className="order-total">
                    {order.total}
                  </strong>

                  <button className="view-button">
                    Ver Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
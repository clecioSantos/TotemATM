"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "@/app/admin/orders/AuthContext";
import "../globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthProvider>
      <div className="admin-layout">
        {/* Overlay para fechar sidebar ao clicar fora no mobile */}
        {!collapsed && (
          <div 
            className="sidebar-mobile-overlay" 
            onClick={() => setCollapsed(true)} 
          />
        )}

        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className={`admin-content ${collapsed ? "content-expanded" : ""}`}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}

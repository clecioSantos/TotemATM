"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "@/app/admin/orders/AuthContext";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import "../globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthProvider>
      <ErrorBoundary context="AdminLayout">
        <div className="admin-layout">
          {!collapsed && (
            <div 
              className="sidebar-mobile-overlay" 
              onClick={() => setCollapsed(true)} 
            />
          )}

          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <main className={`admin-content ${collapsed ? "content-expanded" : ""}`}>
            <div className="admin-page-shell">
              <div className="admin-page-body">
                {children}
              </div>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </AuthProvider>
  );
}

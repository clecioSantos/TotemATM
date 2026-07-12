"use client";

import { useState, useEffect } from "react";
import OwnerSidebar from "./components/OwnerSidebar";
import { AuthProvider, useAuth } from "@/app/admin/orders/AuthContext";
import "../globals.css";
import "../admin/page.css";

function OwnerGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;
  return <>{children}</>;
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setCollapsed(window.innerWidth < 768);
    const handleResize = () => setCollapsed(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AuthProvider>
    <div className="admin-layout">
      {!collapsed && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setCollapsed(true)} 
        />
      )}

      <OwnerSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`admin-content ${collapsed ? "content-expanded" : ""}`}>
        <OwnerGuard>
          {children}
        </OwnerGuard>
      </main>
    </div>
    </AuthProvider>
  );
}

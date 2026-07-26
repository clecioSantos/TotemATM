"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { AuthProvider, useAuth } from "@/app/admin/orders/AuthContext";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import "../globals.css";
import "./page.css";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login?redirect=/admin");
      return;
    }
    const role = (user as any)?.role;
    if (role !== "admin" && role !== "owner" && role !== "collaborator") {
      router.replace("/totem");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;
  const role = (user as any)?.role;
  if (role !== "admin" && role !== "owner" && role !== "collaborator") return null;

  return <>{children}</>;
}

export default function AdminLayout({
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
      <ErrorBoundary context="AdminLayout">
        <AdminGuard>
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
        </AdminGuard>
      </ErrorBoundary>
    </AuthProvider>
  );
}

"use client";

import { useState } from "react";
import OwnerSidebar from "./components/OwnerSidebar";
import "../globals.css";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      {!collapsed && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setCollapsed(true)} 
        />
      )}

      <OwnerSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`admin-content ${collapsed ? "content-expanded" : ""}`}>
        {children}
      </main>
    </div>
  );
}

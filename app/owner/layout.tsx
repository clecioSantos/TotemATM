"use client";

import { useState, useEffect } from "react";
import OwnerSidebar from "./components/OwnerSidebar";
import "../globals.css";

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

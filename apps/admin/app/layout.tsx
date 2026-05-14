"use client";

import { useState } from "react";
import Head from "next/head";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./orders/AuthContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  // Define as CSS custom properties (variables)
  // These can be overridden by individual components if needed


  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <div className="admin-layout">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <main className={`admin-content ${collapsed ? "content-expanded" : ""}`}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
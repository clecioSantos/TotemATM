"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./styles.css";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Pedidos", path: "/admin/orders", icon: "📋" },
    { name: "Produtos", path: "/admin/products", icon: "📦" },
    { name: "Categorias", path: "/admin/categories", icon: "📁" },
    { name: "Condimentos", path: "/admin/condiments", icon: "🧂" },
    { name: "Cupons", path: "/admin/coupons", icon: "🏷️" },
    { name: "Relatórios", path: "/admin/reports", icon: "📈" },
    { name: "Configurações", path: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-top">
        {!collapsed && (
          <div className="sidebar-logo">
            <h1 className="logo-title">NexOrder</h1>
            <p className="logo-subtitle">Admin Panel</p>
          </div>
        )}
        <button className="collapse-button" onClick={onToggle}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`menu-item ${pathname === item.path ? "menu-item-active" : ""}`}
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-status">
          <span className="status-dot"></span>
          <span className="status-label">Operação Online</span>
        </div>
      )}
    </aside>
  );
}
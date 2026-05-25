"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./styles.css";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) { // Removido o estado collapsed daqui
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Pedidos", path: "/admin/orders", icon: "📋" },
    { name: "Produtos", path: "/admin/products", icon: "📦" },
    { name: "Categorias", path: "/admin/categories", icon: "📁" },
    { name: "Cupons", path: "/admin/coupons", icon: "🏷️" },
    { name: "Relatórios", path: "/admin/reports", icon: "📈" },
    { name: "Configurações", path: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <>
      {collapsed && (
        <button
          className="mobile-sidebar-open-button"
          onClick={onToggle}
          aria-label="Abrir menu"
        >
          ☰
        </button>
      )}
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}> {/* Adicionado a classe sidebar-collapsed */}
        <div className="sidebar-top"> {/* Adicionado um container para o topo da sidebar */}
          {!collapsed && (
            <div className="sidebar-logo">
              <h1 className="logo-title">NexOrder</h1>
              <p className="logo-subtitle">Painel Administrativo</p>
            </div>
          )}
          <button className="collapse-button" onClick={onToggle}> {/* Botão para recolher/expandir */}
            {collapsed ? "▶" : "◀"} {/* Ícones simples para indicar estado */}
          </button>
        </div>

      <nav className="sidebar-menu"> {/* Menu de navegação */}
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`menu-item ${pathname === item.path ? "menu-item-active" : ""}`}
          >
            <span className="menu-icon">{item.icon}</span>
            {!collapsed && <span className="menu-text">{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-status"> {/* Indicador de status */}
        <p className="status-label">{collapsed ? "●" : "Sistema Online"}</p>
        {!collapsed && <div className="status-dot" />}
      </div>
    </aside>
    </>
  );
}

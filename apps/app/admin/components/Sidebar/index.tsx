"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Folder, 
  ChefHat, 
  Ticket, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  Menu 
} from "lucide-react";
import "./styles.css";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Pedidos", path: "/admin/orders", icon: <ClipboardList size={20} /> },
    { name: "Produtos", path: "/admin/products", icon: <Package size={20} /> },
    { name: "Categorias", path: "/admin/categories", icon: <Folder size={20} /> },
    { name: "Condimentos", path: "/admin/condiments", icon: <ChefHat size={20} /> },
    { name: "Cupons", path: "/admin/coupons", icon: <Ticket size={20} /> },
    { name: "Relatórios", path: "/admin/reports", icon: <BarChart3 size={20} /> },
    { name: "Configurações", path: "/admin/settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
      <div className="sidebar-top">
        {!collapsed && (
          <div className="sidebar-logo">
            <h1 className="logo-title">NexOrder</h1>
            <p className="logo-subtitle">Admin Panel</p>
          </div>
        )}
        <button className="collapse-button" onClick={onToggle}>
          {collapsed ? <Menu size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>

      <div className="sidebar-content">
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`menu-item ${pathname === item.path ? "menu-item-active" : ""} ${collapsed ? "collapsed-item" : ""}`}
            >
              <span className="menu-icon">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {!collapsed && (
        <div className="sidebar-status">
          <span className="status-dot"></span>
          <span className="status-label">Operação Online</span>
        </div>
      )}
    </aside>
  );
}
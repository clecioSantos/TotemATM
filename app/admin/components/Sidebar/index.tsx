"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Folder, 
  ChefHat, 
  Ticket, 
  BarChart3, 
  Settings,
  MapPin, 
  ChevronLeft, 
  Menu,
  Palette,
  Star,
  Users,
  Tag,
  Wallet,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import "./page.css";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [couponsEnabled, setCouponsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.companyId) return;
    Promise.all([
      getDoc(doc(firestore, "settings", "global")),
      getDoc(doc(firestore, "companies", user.companyId)),
    ]).then(([globalSnap, companySnap]) => {
      const global = globalSnap.exists() ? globalSnap.data().couponsEnabled : undefined;
      const store = companySnap.exists() ? companySnap.data().couponsEnabled : undefined;
      setCouponsEnabled(global !== false && store === true);
    }).catch(() => {});
  }, [user?.companyId]);

  const baseMenuItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Pedidos", path: "/admin/orders", icon: <ClipboardList size={20} /> },
    { name: "Produtos", path: "/admin/products", icon: <Package size={20} /> },
    { name: "Categorias", path: "/admin/categories", icon: <Folder size={20} /> },
    { name: "Sabores", path: "/admin/flavors", icon: <Palette size={20} /> },
    { name: "Condimentos", path: "/admin/condiments", icon: <ChefHat size={20} /> },
    { name: "Avaliações", path: "/admin/reviews", icon: <Star size={20} /> },
    { name: "Promoções", path: "/admin/promotions", icon: <Tag size={20} /> },
    { name: "Financeiro", path: "/admin/financeiro", icon: <Wallet size={20} /> },
    { name: "Relatórios", path: "/admin/reports", icon: <BarChart3 size={20} /> },
    { name: "Endereços", path: "/admin/addresses", icon: <MapPin size={20} /> },
    { name: "Usuários", path: "/admin/settings/users", icon: <Users size={20} /> },
    { name: "Configurações", path: "/admin/settings", icon: <Settings size={20} /> },
    { name: "Central de Ajuda", path: "/admin/help", icon: <HelpCircle size={20} /> },
  ];

  const menuItems = couponsEnabled === true
    ? [...baseMenuItems.slice(0, 8), { name: "Cupons", path: "/admin/coupons", icon: <Ticket size={20} /> }, ...baseMenuItems.slice(8)]
    : baseMenuItems;

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
      <div className="sidebar-top">
        {!collapsed && (
          <div className="sidebar-logo">
            <h1 className="logo-title">Bora De Delivery</h1>
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

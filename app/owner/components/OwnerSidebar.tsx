"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  ChevronLeft, 
  Menu,
  ArrowLeft,
  Calendar
} from "lucide-react";
// Assuming CSS from admin will work or we will need to create/import own
import "../../admin/components/Sidebar/page.css"; 

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function OwnerSidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", path: "/owner", icon: <LayoutDashboard size={20} /> },
    { name: "Lojas", path: "/owner/stores", icon: <Store size={20} /> },
    { name: "Usuários", path: "/owner/users", icon: <Users size={20} /> },
    { name: "Eventos", path: "/owner/events", icon: <Calendar size={20} /> },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
      <div className="sidebar-top">
        {!collapsed && (
          <div className="sidebar-logo">
            <h1 className="logo-title">Plataforma</h1>
            <p className="logo-subtitle">Owner Panel</p>
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

      <div className="sidebar-bottom">
        <Link
          href="/totem"
          className={`menu-item ${collapsed ? "collapsed-item" : ""}`}
        >
          <span className="menu-icon"><ArrowLeft size={20} /></span>
          {!collapsed && <span>Voltar ao Totem</span>}
        </Link>
      </div>
    </aside>
  );
}

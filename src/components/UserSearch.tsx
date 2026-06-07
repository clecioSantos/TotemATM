"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { StoreUser, defaultStorePermissions } from "@totem/shared/types/auth";

interface UserSearchProps {
  onSelectUser: (user: StoreUser) => void;
  selectedUsers: StoreUser[];
  companyId?: string;
}

export function UserSearch({ onSelectUser, selectedUsers, companyId }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllUsers = async () => {
      setLoadingUsers(true);
      try {
        const q = query(collection(firestore, "users"), orderBy("name", "asc"), limit(200));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        setAllUsers(list);
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = allUsers.filter((u) => {
    if (u.uid === companyId) return false;
    if (selectedUsers.some((su) => su.uid === u.uid)) return false;
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  const handleSelect = (u: any) => {
    const storeUser: StoreUser = {
      uid: u.uid,
      email: u.email || "",
      name: u.name || "",
      role: "collaborator",
      permissions: { ...defaultStorePermissions },
    };
    onSelectUser(storeUser);
    setSearchTerm("");
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Adicionar Usuários
      </label>
      <input
        type="text"
        placeholder="Buscar por nome ou email..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
      />
      {loadingUsers && (
        <p className="text-xs text-gray-400 mt-1">Carregando usuários...</p>
      )}
      {showDropdown && searchTerm && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {filtered.map((u) => (
            <button
              key={u.uid}
              type="button"
              onClick={() => handleSelect(u)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontWeight: 600 }}>{u.name || "Sem nome"}</span>
              <span style={{ color: "#6b7280", marginLeft: 8, fontSize: 12 }}>
                {u.email}
              </span>
            </button>
          ))}
        </div>
      )}
      {showDropdown && searchTerm && filtered.length === 0 && !loadingUsers && (
        <p className="text-xs text-gray-400 mt-1">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
}

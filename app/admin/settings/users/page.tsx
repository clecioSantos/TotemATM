"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { StoreUser, defaultStorePermissions, adminStorePermissions, computeStoreIds } from "@totem/shared/types/auth";
import { Save, Loader2, Shield, ShieldOff, Trash2, UserPlus, Search, ArrowLeft } from "lucide-react";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { useRouter } from "next/navigation";
import "./page.css";

function UsersSettingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [storeUsers, setStoreUsers] = useState<StoreUser[]>([]);
  const [storeOwnerId, setStoreOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [localUserRole, setLocalUserRole] = useState<"admin" | "collaborator" | null>(null);

  const canManage =
    user?.role === "owner" ||
    storeUsers.find((u) => u.uid === user?.uid)?.role === "admin" ||
    user?.uid === storeOwnerId;

  useEffect(() => {
    if (!user?.companyId || user.companyId === "default") return;

    const fetchData = async () => {
      try {
        const companyRef = doc(firestore, "companies", user.companyId!);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) {
          const data = companySnap.data();
          const users = data.users || [];
          setStoreUsers(users);
          setStoreOwnerId(data.ownerId || null);

          const currentUser = users.find((u: StoreUser) => u.uid === user?.uid);
          if (currentUser) {
            setLocalUserRole(currentUser.role);
          } else if (user?.uid === data.ownerId) {
            setLocalUserRole("admin");
          }
        }

        const usersSnap = await getDocs(
          query(collection(firestore, "users"), orderBy("name", "asc"))
        );
        setAllUsers(
          usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }))
        );
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.companyId, user?.uid]);

  const filteredUsers = allUsers.filter((u) => {
    if (u.role === "owner") return false;
    if (storeUsers.some((su) => su.uid === u.uid)) return false;
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  const addUser = async (selected: any) => {
    const newUser: StoreUser = {
      uid: selected.uid,
      email: selected.email || "",
      name: selected.name || "",
      role: "collaborator",
      permissions: { ...defaultStorePermissions },
    };
    const updated = [...storeUsers, newUser];
    setStoreUsers(updated);
    setSearchTerm("");
    setShowSearchResults(false);

    try {
      const ids = computeStoreIds(updated);
      await updateDoc(doc(firestore, "companies", user!.companyId!), {
        users: updated,
        userIds: ids.userIds,
        adminIds: ids.adminIds,
      });
      await updateDoc(doc(firestore, "users", selected.uid), {
        companyId: user!.companyId,
      });
    } catch (err) {
      console.error("Erro ao adicionar usuário:", err);
      setStoreUsers(storeUsers);
    }
  };

  const removeUser = async (uid: string) => {
    const removed = storeUsers.find((u) => u.uid === uid);
    const updated = storeUsers.filter((u) => u.uid !== uid);
    setStoreUsers(updated);

    try {
      const ids = computeStoreIds(updated);
      await updateDoc(doc(firestore, "companies", user!.companyId!), {
        users: updated,
        userIds: ids.userIds,
        adminIds: ids.adminIds,
      });
      if (removed) {
        await updateDoc(doc(firestore, "users", uid), {
          companyId: "default",
        });
      }
    } catch (err) {
      console.error("Erro ao remover usuário:", err);
      setStoreUsers(storeUsers);
    }
  };

  const toggleRole = async (uid: string) => {
    const updated = storeUsers.map((u) => {
      if (u.uid !== uid) return u;
      if (u.role === "admin") {
        return { ...u, role: "collaborator" as const, permissions: { ...defaultStorePermissions } };
      }
      return { ...u, role: "admin" as const, permissions: { ...adminStorePermissions } };
    });
    setStoreUsers(updated);

    try {
      const userToUpdate = updated.find((u) => u.uid === uid);
      const ids = computeStoreIds(updated);
      await updateDoc(doc(firestore, "companies", user!.companyId!), {
        users: updated,
        userIds: ids.userIds,
        adminIds: ids.adminIds,
      });
      if (userToUpdate) {
        await updateDoc(doc(firestore, "users", uid), {
          role: userToUpdate.role,
        });
      }
    } catch (err) {
      console.error("Erro ao alterar permissão:", err);
    }
  };

  const updatePermissions = async (uid: string, permission: string, value: boolean) => {
    const updated = storeUsers.map((u) => {
      if (u.uid !== uid) return u;
      return {
        ...u,
        permissions: { ...u.permissions, [permission]: value },
      };
    });
    setStoreUsers(updated);
  };

  const savePermissions = async () => {
    if (!user?.companyId) return;
    setSaving(true);
    try {
      const ids = computeStoreIds(storeUsers);
      await updateDoc(doc(firestore, "companies", user.companyId), {
        users: storeUsers,
        userIds: ids.userIds,
        adminIds: ids.adminIds,
      });
      alert("Permissões salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar permissões:", err);
      alert("Erro ao salvar permissões.");
    } finally {
      setSaving(false);
    }
  };

  const permissionLabels: Record<string, string> = {
    editProducts: "Editar Produtos",
    editOrders: "Editar Pedidos",
    editSettings: "Editar Configurações",
    manageUsers: "Gerenciar Usuários",
    viewReports: "Ver Relatórios",
    manageCoupons: "Gerenciar Cupons",
    manageCategories: "Gerenciar Categorias",
    manageFlavors: "Gerenciar Sabores",
    manageCondiments: "Gerenciar Condimentos",
    manageAddresses: "Gerenciar Endereços",
    manageReviews: "Gerenciar Avaliações",
  };

  if (loading) {
    return (
      <div className="condiments-page-container">
        <div className="loading-container">
          <Loader2 size={24} className="spin" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/settings")}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">Usuários da Loja</h1>
              <p className="page-subtitle">
                Gerencie os usuários com acesso ao painel administrativo
              </p>
            </div>
          </div>
        </div>
      </header>

      {!canManage && (
        <div className="settings-card" style={{ maxWidth: "100%" }}>
          <p className="text-sm text-gray-500">
            Você não tem permissão para gerenciar usuários.
          </p>
        </div>
      )}

      {canManage && (
        <>
          <div className="settings-card" style={{ maxWidth: "100%", marginTop: 24 }}>
            <div className="section-header">
              <UserPlus size={20} className="section-icon" />
              <h3 className="section-title">Adicionar Usuário</h3>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="form-input"
                style={{ width: "100%", padding: "10px 14px" }}
              />
              {showSearchResults && searchTerm && (
                <div className="users-search-dropdown">
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-gray-400 p-2">
                      Nenhum usuário encontrado.
                    </p>
                  )}
                  {filteredUsers.map((u) => (
                    <button
                      key={u.uid}
                      type="button"
                      className="users-search-item"
                      onClick={() => addUser(u)}
                    >
                      <span className="font-medium">{u.name || "Sem nome"}</span>
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="settings-card" style={{ maxWidth: "100%", marginTop: 24 }}>
            <div className="section-header">
              <Shield size={20} className="section-icon" />
              <h3 className="section-title">
                Usuários ({storeUsers.length})
              </h3>
            </div>

            {storeUsers.length === 0 && (
              <p className="text-sm text-gray-400">
                Nenhum usuário adicionado ainda. Use a busca acima para adicionar.
              </p>
            )}

            {storeUsers.map((u) => (
              <div key={u.uid} className="user-card">
                <div className="user-card-header">
                  <div className="user-card-info">
                    <p className="user-card-name">{u.name}</p>
                    <p className="user-card-email">{u.email}</p>
                  </div>
                  <div className="user-card-actions">
                    <select
                      value={u.role}
                      onChange={() => toggleRole(u.uid)}
                      className="user-role-select"
                    >
                      <option value="collaborator">Colaborador</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeUser(u.uid)}
                      className="user-remove-btn"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {u.role === "collaborator" && (
                  <div className="permissions-grid">
                    {Object.entries(permissionLabels).map(([key, label]) => (
                      <label key={key} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={(u.permissions as any)[key] || false}
                          onChange={(e) =>
                            updatePermissions(u.uid, key, e.target.checked)
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="form-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="save-button"
                onClick={savePermissions}
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 size={18} className="spin" /> Salvando...</>
                ) : (
                  <><Save size={18} /> Salvar Permissões</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="settings-card" style={{ maxWidth: "100%", marginTop: 24 }}>
        <div className="user-profile-info">
          <h3 className="section-title">Informações do Proprietário</h3>
          <p className="user-detail">
            Proprietário ID: <strong>{storeOwnerId || "N/A"}</strong>
          </p>
          <p className="user-detail">
            Seu papel:{" "}
            <strong>
              {user?.uid === storeOwnerId
                ? "Proprietário"
                : localUserRole === "admin"
                  ? "Admin"
                  : localUserRole === "collaborator"
                    ? "Colaborador"
                    : "Sem acesso"}
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UsersSettingsPage() {
  return (
    <ErrorBoundary context="UsersSettingsPage">
      <UsersSettingsContent />
    </ErrorBoundary>
  );
}

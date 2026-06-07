"use client";

import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { StoreUser, defaultStorePermissions, adminStorePermissions } from "@totem/shared/types/auth";
import { UserSearch } from "./UserSearch";

interface StoreUsersSectionProps {
  users: StoreUser[];
  onChange: (users: StoreUser[]) => void;
  companyId?: string;
}

export function StoreUsersSection({ users, onChange, companyId }: StoreUsersSectionProps) {
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<StoreUser | null>(null);

  const handleSelectUser = async (selected: StoreUser) => {
    try {
      const q = query(
        collection(firestore, "users"),
        where("uid", "==", selected.uid)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userData = snap.docs[0].data();

        if (userData.companyId && userData.companyId !== "default" && userData.companyId !== companyId) {
          setPendingUser(selected);
          setWarningMsg(
            `O usuário "${selected.name}" já possui acesso à loja "${userData.companyId}". Ao adicioná-lo a esta loja, ele perderá acesso à loja anterior. Deseja continuar?`
          );
          return;
        }
      }
      addUser(selected);
    } catch (err) {
      console.error("Erro ao verificar usuário:", err);
      addUser(selected);
    }
  };

  const addUser = (user: StoreUser) => {
    onChange([...users, user]);
  };

  const confirmWarning = () => {
    if (pendingUser) {
      addUser(pendingUser);
      setPendingUser(null);
      setWarningMsg(null);
    }
  };

  const cancelWarning = () => {
    setPendingUser(null);
    setWarningMsg(null);
  };

  const removeUser = (uid: string) => {
    onChange(users.filter((u) => u.uid !== uid));
  };

  const toggleRole = (uid: string) => {
    onChange(
      users.map((u) => {
        if (u.uid !== uid) return u;
        if (u.role === "admin") {
          return { ...u, role: "collaborator" as const, permissions: { ...defaultStorePermissions } };
        }
        return { ...u, role: "admin" as const, permissions: { ...adminStorePermissions } };
      })
    );
  };

  return (
    <div className="md:col-span-2">
      <h4 className="text-lg font-semibold mb-3">Usuários com Acesso à Loja</h4>

      <UserSearch
        onSelectUser={handleSelectUser}
        selectedUsers={users}
        companyId={companyId}
      />

      {users.length > 0 && (
        <div className="mt-4 space-y-2">
          {users.map((u) => (
            <div
              key={u.uid}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={u.role}
                  onChange={() => toggleRole(u.uid)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="collaborator">Colaborador</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeUser(u.uid)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {users.length === 0 && (
        <p className="text-sm text-gray-400 mt-2">
          Nenhum usuário adicionado. Somente o owner terá acesso inicialmente.
        </p>
      )}

      {warningMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <p className="text-sm text-gray-700 mb-4">{warningMsg}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelWarning}
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmWarning}
                className="px-4 py-2 text-sm rounded bg-orange-500 text-white hover:bg-orange-600"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

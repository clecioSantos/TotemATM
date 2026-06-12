"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { StorePermissions, StoreUser, adminStorePermissions } from "@totem/shared/types/auth";

export function useStorePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<StorePermissions | null>(null);
  const [storeUsers, setStoreUsers] = useState<StoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeOwnerId, setStoreOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.companyId || !user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(firestore, "companies", user.companyId),
      (snap) => {
        if (!snap.exists()) {
          setPermissions(null);
          setStoreUsers([]);
          setLoading(false);
          return;
        }

        const data = snap.data();
        const users: StoreUser[] = data.users || [];
        const ownerId: string = data.ownerId || "";
        setStoreOwnerId(ownerId);
        setStoreUsers(users);

        const currentUser = users.find((u: StoreUser) => u.uid === user.uid);

        if (user.role === "owner" || currentUser?.role === "admin" || user.uid === ownerId) {
          setPermissions(adminStorePermissions);
        } else if (currentUser?.role === "collaborator") {
          setPermissions(currentUser.permissions);
        } else {
          setPermissions(null);
        }

        setLoading(false);
      },
      (err) => {
        console.error("useStorePermissions error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.companyId, user?.uid]);

  const can = (permission: keyof StorePermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  const isAdminOrOwner = (): boolean => {
    if (!user) return false;
    if (user.role === "owner" || user.uid === storeOwnerId) return true;
    const currentUser = storeUsers.find((u) => u.uid === user?.uid);
    return currentUser?.role === "admin" || false;
  };

  return { permissions, storeUsers, storeOwnerId, loading, can, isAdminOrOwner };
}

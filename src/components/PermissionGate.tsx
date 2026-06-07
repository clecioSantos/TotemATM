"use client";

import { ReactNode } from "react";
import { useStorePermissions } from "@/src/hooks/useStorePermissions";
import { StorePermissions } from "@totem/shared/types/auth";

interface PermissionGateProps {
  permission: keyof StorePermissions;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { can, loading } = useStorePermissions();

  if (loading) return null;
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}

interface AdminOrOwnerGateProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function AdminOrOwnerGate({ fallback = null, children }: AdminOrOwnerGateProps) {
  const { isAdminOrOwner, loading } = useStorePermissions();

  if (loading) return null;
  if (!isAdminOrOwner()) return <>{fallback}</>;
  return <>{children}</>;
}

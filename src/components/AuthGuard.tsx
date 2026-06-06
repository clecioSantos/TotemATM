"use client";

import { useEffect } from "react";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const redirectPath = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirectPath}`);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <img src="/Logo.png" alt="" className="h-12 w-auto animate-pulse" />
          <Loader2 size={22} className="animate-spin text-[#FF6B00]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

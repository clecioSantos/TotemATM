"use client";

import { useAuth } from "@totem/shared/types/AuthProvider";
import { Loader2 } from "lucide-react";
import "../globals.css";

export default function TotemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth();

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

  return <div className="totem-wrapper">{children}</div>;
}

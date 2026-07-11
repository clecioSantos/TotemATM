"use client";
import dynamic from "next/dynamic";
const LogTerminal = dynamic(() => import("@/app/components/LogTerminal"), { ssr: false });

export default function LogTerminalWrapper() {
  return <LogTerminal />;
}

import { AuthProvider } from "@totem/shared/types/AuthProvider";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { CapacitorInit } from "@/src/capacitor/capacitor-init";
import dynamic from "next/dynamic";
import "./globals.css";

import ConfirmProvider from "@/app/components/ConfirmProvider";
import PushTokenRegistrar from "@/src/capacitor/PushTokenRegistrar";
const LogTerminal = dynamic(() => import("@/app/components/LogTerminal"), { ssr: false });

export const metadata = {
  title: 'Bora De Delivery',
  description: 'Seu delivery favorito',
  icons: {
    icon: '/Icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/Icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <ErrorBoundary context="RootLayout">
          <AuthProvider>
            <CapacitorInit>
              <ConfirmProvider>{children}</ConfirmProvider>
            </CapacitorInit>
            <PushTokenRegistrar />
          </AuthProvider>
          <LogTerminal />
        </ErrorBoundary>
      </body>
    </html>
  );
}
